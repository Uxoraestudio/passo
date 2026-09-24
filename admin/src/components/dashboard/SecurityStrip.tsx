"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/icons";
import styles from "./SecurityStrip.module.css";

export default function SecurityStrip() {
  const [syncing, setSyncing] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 1500);
  };

  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <MaterialIcon name="lock" className={styles.lockIcon} />
        <span>Cifrado bancario TLS 1.3 con custodia y retención legal tributaria según normativa SII Chile</span>
      </div>
      <div className={styles.right}>
        <span>Último corte de cierre: Hoy, 18:42 hrs</span>
        <button type="button" className={styles.syncButton} onClick={handleSync}>
          <MaterialIcon name="sync" className={syncing ? styles.spinIcon : styles.syncIcon} />
          <span>Sincronizar Ahora</span>
        </button>
      </div>
    </div>
  );
}
