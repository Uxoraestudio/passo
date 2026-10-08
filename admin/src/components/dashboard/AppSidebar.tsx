"use client";

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

  return (
    <aside className={styles.sidebar}>
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
  );
}
