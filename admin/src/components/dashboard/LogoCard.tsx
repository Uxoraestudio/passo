"use client";

import { useRef, useState } from "react";
import { TrashIcon } from "@/components/icons";
import type { LogoSlot } from "@/lib/appearance-data";
import styles from "./LogoCard.module.css";

export default function LogoCard({ slot }: { slot: LogoSlot }) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const handleRemove = () => {
    setFileUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
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
        {fileUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl} alt={`Vista previa de ${slot.title}`} className={styles.previewImage} />
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
        <button type="button" className={styles.changeButton} onClick={() => inputRef.current?.click()}>
          Cambiar
          <br />
          archivo
        </button>
        <button type="button" className={styles.removeButton} onClick={handleRemove} aria-label={`Eliminar ${slot.title}`}>
          <TrashIcon className={styles.removeIcon} />
        </button>
      </div>

      <input ref={inputRef} type="file" accept="image/*" className={styles.hiddenInput} onChange={handleFile} />
    </div>
  );
}
