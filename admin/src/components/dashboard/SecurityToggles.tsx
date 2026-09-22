"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/icons";
import { securityToggles } from "@/lib/tickets-management-data";
import styles from "./SecurityToggles.module.css";

export default function SecurityToggles() {
  const [state, setState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(securityToggles.map((t) => [t.id, t.defaultChecked]))
  );

  const toggle = (id: string) => {
    setState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={styles.card}>
      <div>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerIconBox}>
              <MaterialIcon name="shield" className={styles.headerIcon} />
            </span>
            <h3 className={styles.title}>Reglas de Seguridad</h3>
          </div>
          <span className={styles.levelBadge}>Nivel Protocolo: Alto</span>
        </div>
        <p className={styles.description}>
          Mecanismos automáticos para mitigar reventa informal, suplantación de identidad y clonación de credenciales.
        </p>

        <div className={styles.list}>
          {securityToggles.map((item) => (
            <div key={item.id} className={styles.item}>
              <div className={styles.itemText}>
                <div className={styles.itemHeader}>
                  <span className={styles.itemLabel}>{item.label}</span>
                  <span className={styles.itemDot} style={{ background: item.dotColor }} />
                </div>
                <p className={styles.itemDescription}>{item.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={state[item.id]}
                aria-label={item.label}
                className={styles.switch}
                data-checked={state[item.id]}
                onClick={() => toggle(item.id)}
              >
                <span className={styles.switchThumb} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <MaterialIcon name="verified_user" className={styles.footerIcon} />
          <span>Protección activa con Token AFORIQ Guard™</span>
        </div>
        <button type="button" className={styles.auditButton}>
          Ver Auditoría
        </button>
      </div>
    </div>
  );
}
