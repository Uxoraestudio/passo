"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarsIcon,
  CalendarIcon,
  GearIcon,
  HomeIcon,
  PaletteIcon,
  ScanIcon,
  SeoIcon,
  ShieldPersonIcon,
  UsersIcon,
  VenueIcon,
} from "@/components/icons";
import { MODULES, allows, useAccess, type ModuleKey } from "@/lib/access";
import { closeMobileMenu, useMobileMenu } from "@/lib/mobile-menu";
import styles from "./AppSidebar.module.css";

const icons: Record<ModuleKey, typeof HomeIcon> = {
  resumen: HomeIcon,
  eventos: CalendarIcon,
  ventas: BarsIcon,
  validacion: ScanIcon,
  clientes: UsersIcon,
  roles: ShieldPersonIcon,
  apariencia: PaletteIcon,
  seo: SeoIcon,
  configuracion: GearIcon,
};

export default function AppSidebar() {
  const pathname = usePathname();
  const access = useAccess();
  // Recintos (venue plans) lives under the "eventos" permission, right after Eventos.
  const navItems = MODULES.filter((m) => allows(access, m.key)).flatMap((m) => {
    const item = { key: m.key as string, href: m.href as string, label: m.label as string, icon: icons[m.key] };
    return m.key === "eventos" ? [item, { key: "recintos", href: "/recintos/", label: "Recintos", icon: VenueIcon }] : [item];
  });

  // Small screens: the sidebar slides in over the page when the top bar's menu button opens it.
  const open = useMobileMenu();
  const asideRef = useRef<HTMLElement>(null);

  // A new page closes the menu.
  useEffect(() => {
    closeMobileMenu();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    asideRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileMenu();
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  return (
    <>
    {open && <div className={styles.backdrop} onClick={closeMobileMenu} aria-hidden="true" />}
    <aside ref={asideRef} id="admin-sidebar" className={styles.sidebar} data-open={open} aria-label="Menú principal">
      <button type="button" className={styles.closeButton} onClick={closeMobileMenu} aria-label="Cerrar menú">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <div className={styles.branding}>
        <span className={styles.logo}>passo</span>
        <p className={styles.tagline}>
          TU LUGAR EN LO
          <br />
          EXTRAORDINARIO.
        </p>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={styles.navLink}
              data-active={active}
              onClick={closeMobileMenu}
            >
              <Icon className={styles.navIcon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.bottomArt}>
        <div className={styles.bottomGlow} aria-hidden="true">
          <img src="/images/sidebar-crowd-lights.svg" alt="" className={styles.bottomDots} />
        </div>
        <div className={styles.bottomGradient} aria-hidden="true" />
        <div className={styles.bottomContent}>
          <p className={styles.handwritten}>
            La vida
            <br />
            se vive aquí.
          </p>
          <div className={styles.bottomDivider}>
            <p className={styles.bottomLabels}>
              EVENTOS
              <br />
              PERSONAS
              <br />
              CULTURA
              <br />
              COMUNIDAD
            </p>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
