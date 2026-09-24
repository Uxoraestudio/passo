"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/icons";
import { settingsTabs } from "@/lib/settings-data";
import styles from "./ConfigTabsBar.module.css";

export default function ConfigTabsBar() {
  const [activeTab, setActiveTab] = useState(settingsTabs[0].id);

  return (
    <div className={styles.card}>
      <div className={styles.tabRow}>
        {settingsTabs.map((tab) => (
          <button key={tab.id} type="button" className={styles.tabButton} data-active={tab.id === activeTab} onClick={() => setActiveTab(tab.id)}>
            <MaterialIcon name={tab.icon} className={styles.tabIcon} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
