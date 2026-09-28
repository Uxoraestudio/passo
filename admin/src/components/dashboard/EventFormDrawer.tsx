"use client";

import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { MaterialIcon } from "@/components/icons";
import { uploadEventImage, type EventInput, type EventRecord, type EventStatus } from "@/lib/events-data";
import styles from "./EventFormDrawer.module.css";

const statusOptions: { value: EventStatus; label: string }[] = [
  { value: "borrador", label: "Borrador" },
  { value: "proximamente", label: "Próximamente" },
  { value: "en-venta", label: "En venta" },
  { value: "casi-agotado", label: "Casi agotado" },
  { value: "finalizado", label: "Finalizado" },
];

function toDateTimeLocal(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function emptyForm(): EventInput {
  return {
    title: "",
    subtitle: "",
    description: "",
    venue: "",
    city: "Santiago",
    event_date: "",
    image_url: "",
    price_base: 0,
    capacity: 0,
    sold: 0,
    status: "borrador",
    show_in_hero: false,
  };
}

function formFromEvent(event: EventRecord | null): EventInput {
  if (!event) return emptyForm();
  return {
    title: event.title,
    subtitle: event.subtitle ?? "",
    description: event.description ?? "",
    venue: event.venue,
    city: event.city,
    event_date: toDateTimeLocal(event.event_date),
    image_url: event.image_url ?? "",
    price_base: event.price_base,
    capacity: event.capacity,
    sold: event.sold,
    status: event.status,
    show_in_hero: event.show_in_hero,
  };
}

export default function EventFormDrawer({
  event,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  event: EventRecord | null;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (input: EventInput) => void;
}) {
  const [form, setForm] = useState<EventInput>(() => formFromEvent(event));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    onSubmit({ ...form, event_date: form.event_date ? new Date(form.event_date).toISOString() : "" });
  };

  const update = <K extends keyof EventInput>(key: K, value: EventInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageFile = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const url = await uploadEventImage(file);
      update("image_url", url);
    } catch {
      setUploadError("No pudimos subir la imagen. Intenta de nuevo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{event ? "Editar evento" : "Nuevo evento"}</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Cerrar">
            <MaterialIcon name="close" className={styles.closeIcon} />
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Título</span>
            <input type="text" value={form.title} onChange={(e) => update("title", e.target.value)} required />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Subtítulo</span>
            <input type="text" value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} />
          </label>

          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span className={styles.label}>Recinto</span>
              <input type="text" value={form.venue} onChange={(e) => update("venue", e.target.value)} required />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Ciudad</span>
              <input type="text" value={form.city} onChange={(e) => update("city", e.target.value)} required />
            </label>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Fecha y hora</span>
            <input type="datetime-local" value={form.event_date} onChange={(e) => update("event_date", e.target.value)} required />
          </label>

          <div className={styles.field}>
            <span className={styles.label}>Imagen del evento</span>
            <div className={styles.imageUpload}>
              <div className={styles.imagePreview}>
                {form.image_url ? (
                  <Image src={form.image_url} alt="Vista previa del evento" fill sizes="88px" className={styles.imagePreviewImage} unoptimized />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <MaterialIcon name="image" />
                  </div>
                )}
              </div>
              <div className={styles.imageActions}>
                <button
                  type="button"
                  className={styles.uploadButton}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Subiendo..." : form.image_url ? "Cambiar imagen" : "Subir imagen"}
                </button>
                {form.image_url && (
                  <button type="button" className={styles.removeImageButton} onClick={() => update("image_url", "")} disabled={uploading}>
                    Quitar imagen
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageFile} />
            </div>
            {uploadError && <p className={styles.error}>{uploadError}</p>}
          </div>

          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span className={styles.label}>Precio base (CLP)</span>
              <input
                type="number"
                min={0}
                value={form.price_base}
                onChange={(e) => update("price_base", Number(e.target.value))}
                required
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Aforo total</span>
              <input
                type="number"
                min={0}
                value={form.capacity}
                onChange={(e) => update("capacity", Number(e.target.value))}
                required
              />
            </label>
          </div>

          <div className={styles.fieldGrid}>
            <label className={styles.field}>
              <span className={styles.label}>Entradas vendidas</span>
              <input type="number" min={0} value={form.sold} onChange={(e) => update("sold", Number(e.target.value))} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Estado</span>
              <select value={form.status} onChange={(e) => update("status", e.target.value as EventStatus)}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Descripción</span>
            <textarea rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />
          </label>

          <div className={styles.switchField}>
            <div className={styles.switchText}>
              <span className={styles.label}>Mostrar en banner Hero del home</span>
              <span className={styles.switchHint}>El evento aparecerá en el carrusel principal de la portada.</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.show_in_hero}
              aria-label="Mostrar en banner Hero del home"
              className={styles.switch}
              data-checked={form.show_in_hero}
              onClick={() => update("show_in_hero", !form.show_in_hero)}
            >
              <span className={styles.switchThumb} />
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.footer}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.saveButton} disabled={saving}>
              {saving ? "Guardando..." : event ? "Guardar cambios" : "Crear evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
