"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/icons";
import { securityToggles } from "@/lib/settings-data";
import styles from "./SecurityPoliciesCard.module.css";

export default function SecurityPoliciesCard() {
  const [state, setState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(securityToggles.map((t) => [t.id, t.defaultChecked]))
  );

  const toggle = (id: string) => {
    setState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <MaterialIcon name="admin_panel_settings" className={styles.headerIcon} />
        <div>
          <h2 className={styles.title}>Opciones de Seguridad y Políticas por Defecto</h2>
          <p className={styles.subtitle}>Reglas de automatización operacional aplicadas globalmente a cualquier evento nuevo</p>
        </div>
      </div>

      <div className={styles.list}>
        {securityToggles.map((item) => (
          <div key={item.id} className={styles.row}>
            <div className={styles.rowText}>
              <div className={styles.rowTitleLine}>
                <span className={styles.rowTitle}>{item.title}</span>
                <span className={styles.badge} data-tone={item.badgeTone}>
                  {item.badge}
                </span>
              </div>
              <p className={styles.rowDescription}>{item.description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={state[item.id]}
              aria-label={item.title}
              className={styles.switch}
              data-checked={state[item.id]}
              data-color={item.activeColor}
              onClick={() => toggle(item.id)}
            >
              <span className={styles.switchThumb} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
