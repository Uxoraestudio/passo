"use client";

import { useRouter } from "next/navigation";
import { BellIcon, ChevronDownIcon, LogoutIcon, SearchIcon } from "@/components/icons";
import { logout } from "@/lib/auth";
import styles from "./DashboardTopbar.module.css";

export default function DashboardTopbar() {
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login-admin/");
  };

  return (
    <header className={styles.topbar}>
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
