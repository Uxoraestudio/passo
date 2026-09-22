"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarsIcon,
  CalendarIcon,
  ClockIcon,
  GearIcon,
  HomeIcon,
  PaletteIcon,
  ScanIcon,
  TeamIcon,
  TicketIcon,
  UsersIcon,
} from "@/components/icons";
import styles from "./AppSidebar.module.css";

const navItems = [
  { href: "/inicio/", label: "Resumen", icon: HomeIcon },
  { href: "/eventos/", label: "Eventos", icon: CalendarIcon },
  { href: "#", label: "Ventas", icon: BarsIcon },
  { href: "/entradas/", label: "Entradas", icon: TicketIcon },
  { href: "/validar-ticket/", label: "Validación", icon: ScanIcon },
  { href: "#", label: "Clientes", icon: UsersIcon },
  { href: "#", label: "Reportes", icon: ClockIcon },
  { href: "#", label: "Equipo", icon: TeamIcon },
  { href: "/apariencia/", label: "Apariencia", icon: PaletteIcon },
  { href: "#", label: "Configuración", icon: GearIcon },
];

export default function AppSidebar() {
  const pathname = usePathname();

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
          const active = item.href !== "#" && pathname === item.href;
          return (
            <Link
              key={item.label}
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
