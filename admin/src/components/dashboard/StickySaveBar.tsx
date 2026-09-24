"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/icons";
import styles from "./StickySaveBar.module.css";

export default function StickySaveBar() {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const handleSave = () => {
    setStatus("saving");
    setTimeout(() => setStatus("saved"), 900);
  };

  return (
    <div className={styles.bar}>
      <div className={styles.note}>
        <MaterialIcon name="sync_saved_locally" className={styles.noteIcon} />
        <span>
          {status === "saved" ? "Todos los cambios fueron guardados correctamente." : "Hay cambios pendientes sin sincronizar en pasarelas de pago y seguridad."}
        </span>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.discardButton}>
          Descartar cambios
        </button>
        <button type="button" className={styles.saveButton} onClick={handleSave} disabled={status === "saving"}>
          <MaterialIcon name={status === "saving" ? "progress_activity" : status === "saved" ? "check" : "save"} className={status === "saving" ? styles.spinIcon : styles.saveIcon} />
          <span>{status === "saving" ? "Guardando..." : status === "saved" ? "Guardado" : "Guardar configuración"}</span>
        </button>
      </div>
    </div>
  );
}
