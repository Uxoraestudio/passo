"use client";

import { useRef, useState } from "react";
import { TrashIcon } from "@/components/icons";
import type { LogoSlot } from "@/lib/appearance-data";
import { uploadLogo } from "@/lib/site-settings";
import styles from "./LogoCard.module.css";

export default function LogoCard({
  slot,
  value,
  onChange,
}: {
  slot: LogoSlot;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadLogo(slot.id, file);
      onChange(url);
    } catch {
      window.alert("No pudimos subir el archivo. Intenta de nuevo.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={styles.card}>
      <div>
        <h4 className={styles.title}>{slot.title}</h4>
        <p className={styles.description}>{slot.description}</p>
        <p className={styles.recommendation}>{slot.recommendation}</p>
      </div>

      <div className={styles.previewBox} data-dark={slot.previewDark}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={`Vista previa de ${slot.title}`} className={styles.previewImage} />
        ) : slot.id === "favicon" ? (
          <div className={styles.faviconMark}>
            <span>[ ]</span>
          </div>
        ) : slot.id === "isotype" ? (
          <span className={styles.markLarge}>[ ]</span>
        ) : (
          <div className={styles.wordmark}>
            <span className={styles.mark}>[ ]</span>
            <span className={styles.word} data-dark={slot.previewDark}>
              aforiq
            </span>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.changeButton} onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? "Subiendo..." : (
            <>
              Cambiar
              <br />
              archivo
            </>
          )}
        </button>
        <button type="button" className={styles.removeButton} onClick={handleRemove} aria-label={`Eliminar ${slot.title}`} disabled={uploading}>
          <TrashIcon className={styles.removeIcon} />
        </button>
      </div>

      <input ref={inputRef} type="file" accept="image/*" className={styles.hiddenInput} onChange={handleFile} />
    </div>
  );
}
