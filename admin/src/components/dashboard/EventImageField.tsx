"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { MaterialIcon } from "@/components/icons";
import { uploadEventImage } from "@/lib/events-data";
import styles from "./EventFormPage.module.css";

export default function EventImageField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const url = await uploadEventImage(file);
      onChange(url);
    } catch {
      setUploadError("No pudimos subir la imagen. Intenta de nuevo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.imageUpload}>
        <div className={styles.imagePreview}>
          {value ? (
            <Image src={value} alt={`Vista previa: ${label}`} fill sizes="88px" className={styles.imagePreviewImage} unoptimized />
          ) : (
            <div className={styles.imagePlaceholder}>
              <MaterialIcon name="image" />
            </div>
          )}
        </div>
        <div className={styles.imageActions}>
          <button type="button" className={styles.uploadButton} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? "Subiendo..." : value ? "Cambiar imagen" : "Subir imagen"}
          </button>
          {value && (
            <button type="button" className={styles.removeImageButton} onClick={() => onChange("")} disabled={uploading}>
              Quitar imagen
            </button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFile} />
      </div>
      {uploadError && <p className={styles.error}>{uploadError}</p>}
      <p className={styles.imageSpecsNote}>{hint}</p>
    </div>
  );
}
