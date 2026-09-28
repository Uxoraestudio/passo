"use client";

import { useState, type FormEvent } from "react";
import { MaterialIcon } from "@/components/icons";
import type { EventInput, EventRecord, EventStatus } from "@/lib/events-data";
import EventImageField from "./EventImageField";
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
    hero_image_url: "",
    banner_image_url: "",
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
    hero_image_url: event.hero_image_url ?? "",
    banner_image_url: event.banner_image_url ?? "",
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

  const handleSubmit = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    onSubmit({ ...form, event_date: form.event_date ? new Date(form.event_date).toISOString() : "" });
  };

  const update = <K extends keyof EventInput>(key: K, value: EventInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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

          <div className={styles.imageGroup}>
            <span className={styles.imageGroupTitle}>Imágenes del evento</span>
            <p className={styles.imageGroupHint}>
              Sube una imagen distinta para cada lugar. En cada una, mantén el elemento principal
              centrado — es el área segura que se conserva al recortar; evita textos o rostros cerca
              de los bordes.
            </p>

            <EventImageField
              label="Banner Hero del home"
              hint="Recomendado: 1600 × 900 px (16:9). Se usa en el carrusel principal de la portada."
              value={form.hero_image_url}
              onChange={(url) => update("hero_image_url", url)}
            />

            <EventImageField
              label="Tarjeta destacada / listado"
              hint="Recomendado: 800 × 560 px (4:3). Se usa en Eventos destacados, Cerca de ti y el listado de eventos."
              value={form.image_url}
              onChange={(url) => update("image_url", url)}
            />

            <EventImageField
              label="Banner interno del evento"
              hint="Recomendado: 1280 × 500 px (~2.5:1). Se usa en la página de detalle del evento."
              value={form.banner_image_url}
              onChange={(url) => update("banner_image_url", url)}
            />
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
