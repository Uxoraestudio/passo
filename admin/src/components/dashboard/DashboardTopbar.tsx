"use client";

import { useRouter } from "next/navigation";
import { BellIcon, ChevronDownIcon, LogoutIcon, SearchIcon } from "@/components/icons";
import { logout } from "@/lib/auth";
import { openMobileMenu, useMobileMenu } from "@/lib/mobile-menu";
import styles from "./DashboardTopbar.module.css";

export default function DashboardTopbar() {
  const router = useRouter();
  const menuOpen = useMobileMenu();

  const handleLogout = async () => {
    await logout();
    router.push("/login-admin/");
  };

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
      <div className={styles.search}>
        <SearchIcon className={styles.searchIcon} />
        <input type="text" placeholder="Buscar eventos, clientes, entradas..." />
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.notifButton} aria-label="Notificaciones">
          <BellIcon className={styles.notifIcon} />
          <span className={styles.notifBadge}>3</span>
        </button>

        <div className={styles.divider} aria-hidden="true" />

        <div className={styles.profile}>
          <span className={styles.avatar}>[ ]</span>
          <span className={styles.profileName}>AFORIQ Producciones</span>
          <ChevronDownIcon className={styles.chevron} />
        </div>

        <button type="button" className={styles.logoutButton} onClick={handleLogout} aria-label="Cerrar sesión">
          <LogoutIcon className={styles.logoutIcon} />
        </button>
      </div>
    </header>
  );
}
