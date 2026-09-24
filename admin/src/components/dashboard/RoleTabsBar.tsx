"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/icons";
import { roleTabs, security2fa } from "@/lib/roles-data";
import styles from "./RoleTabsBar.module.css";

export default function RoleTabsBar() {
  const [activeTab, setActiveTab] = useState(roleTabs[0].id);

  return (
    <div className={styles.card}>
      <div className={styles.tabGroup}>
        {roleTabs.map((tab) => (
          <button key={tab.id} type="button" className={styles.tabButton} data-active={tab.id === activeTab} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
            <span className={styles.tabCount}>{tab.count}</span>
          </button>
        ))}
      </div>
      <div className={styles.securityBadge}>
        <MaterialIcon name="verified_user" className={styles.securityIcon} />
        <div className={styles.securityText}>
          <span className={styles.securityLabel}>Seguridad 2FA Activa</span>
          <span className={styles.securityValue}>
            {security2fa.active}/{security2fa.total} usuarios
          </span>
        </div>
      </div>
    </div>
  );
}
