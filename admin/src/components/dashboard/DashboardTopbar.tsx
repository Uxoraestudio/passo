"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellIcon, ChevronDownIcon, GearIcon, LogoutIcon } from "@/components/icons";
import { Skeleton, SkeletonList } from "@/components/Skeleton";
import { allows, useAccess } from "@/lib/access";
import { timeAgo } from "@/lib/admin-data";
import { logout } from "@/lib/auth";
import { openMobileMenu, useMobileMenu } from "@/lib/mobile-menu";
import { fetchNotifications, hrefFor, markSeen, newestAt, onSeen, readSeenAt, type AdminNotification } from "@/lib/notifications-data";
import { createClient } from "@/lib/supabase/client";
import styles from "./DashboardTopbar.module.css";

type Account = { name: string; email: string };

const REFRESH_MS = 60_000;
const PREVIEW = 8;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** Closes a popover on outside click or Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

function useAccount(): Account | null {
  const [account, setAccount] = useState<Account | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from("profiles").select("full_name, email").eq("id", session.user.id).single();
      const email = data?.email ?? session.user.email ?? "";
      const name = data?.full_name?.trim() || email.split("@")[0];
      if (active) setAccount({ name, email });
    })();
    return () => {
      active = false;
    };
  }, []);
  return account;
}

function useLatestNotifications(enabled: boolean) {
  const [notices, setNotices] = useState<AdminNotification[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const load = async () => {
      try {
        const rows = await fetchNotifications({ limit: PREVIEW });
        if (!active) return;
        setFailed(false);
        setNotices(rows);
      } catch {
        if (active) setFailed(true);
      }
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [enabled]);

  return { notices, failed };
}

function roleLabel(role: "admin" | "staff", staffRoleName: string | null) {
  if (role === "admin") return "Administrador";
  return staffRoleName ?? "Equipo";
}

export default function DashboardTopbar() {
  const router = useRouter();
  const menuOpen = useMobileMenu();
  const access = useAccess();
  const account = useAccount();
  const canSeeSales = allows(access, "ventas");
  const canSeeSettings = allows(access, "configuracion");
  const { notices, failed } = useLatestNotifications(canSeeSales);

  const [panel, setPanel] = useState<"none" | "notifications" | "account">("none");
  const close = () => setPanel("none");
  const notifRef = useDismiss(panel === "notifications", close);
  const accountRef = useDismiss(panel === "account", close);

  // seenAt drives the badge; markFrom keeps the "new" dots on what was unseen
  // when the panel was opened, so they don't vanish the moment it opens.
  // The topbar only renders after AuthGuard authorizes on the client, so
  // reading localStorage in the initializer can't cause a hydration mismatch.
  const [seenAt, setSeenAt] = useState(readSeenAt);
  const [markFrom, setMarkFrom] = useState(0);
  // The notifications page marks everything as seen; follow it.
  useEffect(() => onSeen(setSeenAt), []);
  const unread = (notices ?? []).filter((n) => new Date(n.at).getTime() > seenAt).length;

  const toggleNotifications = () => {
    if (panel === "notifications") {
      close();
      return;
    }
    setMarkFrom(seenAt);
    setPanel("notifications");
    if (notices) markSeen(newestAt(notices));
  };

  const handleLogout = async () => {
    close();
    await logout();
    router.push("/login-admin/");
  };

  const name = account?.name ?? "";
  const role = roleLabel(access.role, access.staffRoleName);

  return (
    <header className={styles.topbar}>
      {/* Only on small screens, where the sidebar is hidden. */}
      <button
        type="button"
        className={styles.menuButton}
        onClick={openMobileMenu}
        aria-label="Abrir menú"
        aria-controls="admin-sidebar"
        aria-expanded={menuOpen}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={styles.menuIcon}>
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <div className={styles.actions}>
        {canSeeSales && (
          <div className={styles.popoverAnchor} ref={notifRef}>
            <button
              type="button"
              className={`${styles.notifButton} ${panel === "notifications" ? styles.isOpen : ""}`}
              onClick={toggleNotifications}
              aria-label={unread > 0 ? `Notificaciones: ${unread} nuevas` : "Notificaciones"}
              aria-haspopup="dialog"
              aria-expanded={panel === "notifications"}
            >
              <BellIcon className={styles.notifIcon} />
              {unread > 0 && <span className={styles.notifBadge}>{unread > 9 ? "9+" : unread}</span>}
            </button>

            {panel === "notifications" && (
              <div className={`${styles.popover} ${styles.notifPanel}`} role="dialog" aria-label="Notificaciones">
                <div className={styles.popoverHeader}>
                  <span>Notificaciones</span>
                </div>
                {failed && !notices ? (
                  <p className={styles.empty}>No pudimos cargar las notificaciones.</p>
                ) : notices === null ? (
                  <div className={styles.noticeList}>
                    <SkeletonList rows={3} thumb="none" card={false} label="Cargando notificaciones…" />
                  </div>
                ) : notices.length === 0 ? (
                  <p className={styles.empty}>Todavía no hay notificaciones.</p>
                ) : (
                  <ul className={styles.noticeList}>
                    {notices.map((n) => {
                      const isNew = new Date(n.at).getTime() > markFrom;
                      return (
                        <li key={`${n.type}-${n.id}`}>
                          <Link href={hrefFor(n, allows(access, "eventos"))} className={styles.notice} onClick={close}>
                            <span className={`${styles.noticeDot} ${isNew ? styles.noticeDotNew : ""}`} data-type={n.type} aria-hidden="true" />
                            <span className={styles.noticeBody}>
                              <span className={styles.noticeTitle}>{n.title}</span>
                              <span className={styles.noticeMeta}>
                                {n.detail.split(" · ")[0]} · {timeAgo(n.at)}
                              </span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <Link href="/notificaciones/" className={styles.popoverFooter} onClick={close}>
                  Ver todas las notificaciones
                </Link>
              </div>
            )}
          </div>
        )}

        {canSeeSales && <div className={styles.divider} aria-hidden="true" />}

        <div className={styles.popoverAnchor} ref={accountRef}>
          <button
            type="button"
            className={`${styles.profile} ${panel === "account" ? styles.isOpen : ""}`}
            onClick={() => setPanel(panel === "account" ? "none" : "account")}
            aria-haspopup="menu"
            aria-expanded={panel === "account"}
          >
            <span className={styles.avatar} aria-hidden="true">
              {account ? initials(name) : ""}
            </span>
            <span className={styles.profileText}>
              <span className={styles.profileName}>{account ? name : <Skeleton width={110} height={12} />}</span>
              <span className={styles.profileRole}>{role}</span>
            </span>
            <ChevronDownIcon className={styles.chevron} />
          </button>

          {panel === "account" && (
            <div className={`${styles.popover} ${styles.accountPanel}`} role="menu">
              <div className={styles.accountHeader}>
                <span className={styles.accountName}>{name}</span>
                <span className={styles.accountEmail}>{account?.email}</span>
                <span className={styles.accountRole}>{role}</span>
              </div>
              {canSeeSettings && (
                <Link href="/configuracion/" className={styles.menuItem} role="menuitem" onClick={close}>
                  <GearIcon className={styles.menuItemIcon} />
                  Configuración
                </Link>
              )}
              <button type="button" className={`${styles.menuItem} ${styles.menuItemDanger}`} role="menuitem" onClick={handleLogout}>
                <LogoutIcon className={styles.menuItemIcon} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
