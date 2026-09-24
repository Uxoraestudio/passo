"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/icons";
import { auditedRoleOptions, permissionModules, type PermissionLevel } from "@/lib/roles-data";
import styles from "./PermissionsMatrix.module.css";

function PermissionCell({ level }: { level: PermissionLevel }) {
  return (
    <span className={styles.permissionCell} data-level={level}>
      <MaterialIcon name={level === "granted" ? "check" : "remove"} className={styles.permissionIcon} />
    </span>
  );
}

export default function PermissionsMatrix() {
  const [auditedRole, setAuditedRole] = useState(auditedRoleOptions[1]);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIconBox}>
            <MaterialIcon name="rule" className={styles.headerIcon} />
          </span>
          <div>
            <h2 className={styles.title}>Matriz Granular de Permisos por Módulo</h2>
            <p className={styles.subtitle}>Visualiza los privilegios CRUD (Lectura, Escritura, Borrado y Exportación de Datos) configurados por cada rol del sistema.</p>
          </div>
        </div>
        <label className={styles.roleSelectWrap}>
          <span className={styles.roleSelectLabel}>Rol Auditado</span>
          <select className={styles.roleSelect} value={auditedRole} onChange={(event) => setAuditedRole(event.target.value)}>
            {auditedRoleOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <MaterialIcon name="expand_more" className={styles.roleSelectIcon} />
        </label>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Módulo Funcional</th>
              <th className={styles.center}>Lectura (Read)</th>
              <th className={styles.center}>Escritura (Create/Edit)</th>
              <th className={styles.center}>Eliminación (Delete)</th>
              <th className={styles.center}>Exportar Datos (CSV/PDF)</th>
            </tr>
          </thead>
          <tbody>
            {permissionModules.map((module) => (
              <tr key={module.id}>
                <td>
                  <div className={styles.moduleCell}>
                    <span className={styles.moduleIconBox} data-tone={module.tone}>
                      <MaterialIcon name={module.icon} className={styles.moduleIcon} />
                    </span>
                    <div>
                      <span className={styles.moduleName}>{module.name}</span>
                      <span className={styles.moduleDescription}>{module.description}</span>
                    </div>
                  </div>
                </td>
                <td className={styles.center}>
                  <PermissionCell level={module.read} />
                </td>
                <td className={styles.center}>
                  <PermissionCell level={module.write} />
                </td>
                <td className={styles.center}>
                  <PermissionCell level={module.deleteAccess} />
                </td>
                <td className={styles.center}>
                  <PermissionCell level={module.exportAccess} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} data-tone="granted" />
            Concedido de forma explícita
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} data-tone="restricted" />
            Restringido / Inaccesible
          </span>
        </div>
        <button type="button" className={styles.customizeLink}>
          Personalizar perfil de rol personalizado
        </button>
      </div>
    </div>
  );
}
