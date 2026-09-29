"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { MaterialIcon } from "@/components/icons";
import { uploadEventImage } from "@/lib/events-data";
import styles from "./EventFormPage.module.css";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

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
  const labelId = useId();
  const hintId = useId();
  const errorId = useId();

  const handleFile = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setUploadError("Formato no admitido. Usa JPG, PNG o WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError(`La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. El máximo es 5 MB.`);
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      onChange(await uploadEventImage(file));
    } catch {
      setUploadError("No pudimos subir la imagen. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.field} role="group" aria-labelledby={labelId}>
      <span className={styles.label} id={labelId}>
        {label}
      </span>
      <div className={styles.imageUpload}>
        <div className={styles.imagePreview}>
          {value ? (
            <Image src={value} alt={`Vista previa: ${label}`} fill sizes="88px" className={styles.imagePreviewImage} unoptimized />
          ) : (
            <div className={styles.imagePlaceholder} aria-hidden="true">
              <MaterialIcon decorative name="image" />
            </div>
          )}
        </div>
        <div className={styles.imageActions}>
          <button
            type="button"
            className={styles.uploadButton}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-describedby={uploadError ? `${hintId} ${errorId}` : hintId}
          >
            {uploading ? "Subiendo…" : value ? "Cambiar imagen" : "Subir imagen"}
          </button>
          {value && !uploading && (
            <button type="button" className={styles.removeImageButton} onClick={() => onChange("")}>
              Quitar imagen
            </button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept={ACCEPTED.join(",")} hidden onChange={handleFile} tabIndex={-1} />
      </div>
      {uploadError && (
        <p className={styles.fieldError} id={errorId} role="alert">
          {uploadError}
        </p>
      )}
      <p className={styles.imageSpecsNote} id={hintId}>
        {hint} JPG, PNG o WebP · máx. 5 MB.
      </p>
    </div>
  );
}
