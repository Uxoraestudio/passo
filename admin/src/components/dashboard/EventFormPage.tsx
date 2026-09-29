"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/icons";
import {
  createEvent,
  getEvent,
  listEventSectors,
  updateEvent,
  type EventInput,
  type EventRecord,
  type EventStatus,
} from "@/lib/events-data";
import { createVenue, getVenueById, listVenues, sectorCountFor, venueCapacity, type Venue } from "@/lib/venues-data";
import { LAYOUTS } from "@/lib/venue-layouts";
import EventImageField from "./EventImageField";
import PerimetryEditor, { type SectorDraft } from "./PerimetryEditor";
import styles from "./EventFormPage.module.css";

const statusOptions: { value: EventStatus; label: string; hint: string }[] = [
  { value: "borrador", label: "Borrador", hint: "Solo visible para tu equipo." },
  { value: "proximamente", label: "Próximamente", hint: "Visible, sin venta habilitada." },
  { value: "en-venta", label: "En venta", hint: "Publicado y vendiendo entradas." },
  { value: "casi-agotado", label: "Casi agotado", hint: "Quedan pocas entradas disponibles." },
  { value: "finalizado", label: "Finalizado", hint: "El evento ya ocurrió." },
];

const steps = [
  { key: "info", label: "Información" },
  { key: "venue", label: "Recinto" },
  { key: "map", label: "Perimetría" },
  { key: "fecha", label: "Fecha y hora" },
  { key: "img", label: "Imágenes" },
  { key: "conf", label: "Configuración" },
];

type FormState = {
  title: string;
  subtitle: string;
  category: string;
  artist: string;
  description: string;
  date: string;
  time: string;
  doorsOpen: string;
  image_url: string;
  hero_image_url: string;
  banner_image_url: string;
  sold: number;
  saleStart: string;
  maxTicketsPerOrder: number;
  qrValidation: boolean;
  ageRestriction: boolean;
  showInHero: boolean;
  status: EventStatus;
  address: string;
};

function emptyForm(): FormState {
  return {
    title: "",
    subtitle: "",
    category: "Concierto",
    artist: "",
    description: "",
    date: "",
    time: "21:00",
    doorsOpen: "19:30",
    image_url: "",
    hero_image_url: "",
    banner_image_url: "",
    sold: 0,
    saleStart: "",
    maxTicketsPerOrder: 6,
    qrValidation: true,
    ageRestriction: false,
    showInHero: false,
    status: "borrador",
    address: "",
  };
}

function toDateTimeLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formFromEvent(event: EventRecord): FormState {
  const d = new Date(event.event_date);
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = Number.isNaN(d.getTime()) ? "" : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const timeStr = Number.isNaN(d.getTime()) ? "21:00" : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return {
    title: event.title,
    subtitle: event.subtitle ?? "",
    category: event.category ?? "Concierto",
    artist: event.artist ?? "",
    description: event.description ?? "",
    date: dateStr,
    time: timeStr,
    doorsOpen: event.doors_open ? event.doors_open.slice(0, 5) : "19:30",
    image_url: event.image_url ?? "",
    hero_image_url: event.hero_image_url ?? "",
    banner_image_url: event.banner_image_url ?? "",
    sold: event.sold,
    saleStart: toDateTimeLocal(event.sale_start),
    maxTicketsPerOrder: event.max_tickets_per_order,
    qrValidation: event.qr_validation,
    ageRestriction: event.age_restriction,
    showInHero: event.show_in_hero,
    status: event.status,
    address: event.address ?? "",
  };
}

function sectorsFromVenue(venue: Venue): SectorDraft[] {
  if (venue.is_custom || venue.layout_key === "custom") {
    return [
      {
        key: crypto.randomUUID(),
        name: "General",
        short_label: "General",
        capacity: "",
        price: "",
        color: "#ff6a2b",
        shape_rect: null,
        shape_path: null,
        label_x: null,
        label_y: null,
        is_active: true,
      },
    ];
  }
  const layout = LAYOUTS[venue.layout_key];
  return layout.sectors.map((t) => ({
    key: crypto.randomUUID(),
    name: t.name,
    short_label: t.short,
    capacity: Math.round((t.cap * venue.scale) / 100) * 100,
    price: t.price,
    color: t.color,
    shape_rect: t.rect ?? null,
    shape_path: t.path ?? null,
    label_x: t.labelX ?? null,
    label_y: t.labelY ?? null,
    is_active: true,
  }));
}

const currency = (value: number) => `$${value.toLocaleString("es-CL")}`;
const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
function fmtDate(date: string, time: string) {
  if (!date) return "";
  const [y, m, dd] = date.split("-");
  return `${Number(dd)} ${months[Number(m) - 1]} ${y}${time ? ` • ${time} hrs` : ""}`;
}

export default function EventFormPage({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const mode = eventId ? "edit" : "create";

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormState>(emptyForm);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueSearch, setVenueSearch] = useState("");
  const [venue, setVenue] = useState<Venue | null>(null);
  const [sectors, setSectors] = useState<SectorDraft[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCity, setCustomCity] = useState("Santiago");

  const [activeStep, setActiveStep] = useState("info");
  const [toast, setToast] = useState("");
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [dirty, setDirty] = useState(false);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    let active = true;
    listVenues()
      .then((v) => active && setVenues(v))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !eventId) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const [event, sectorRows] = await Promise.all([getEvent(eventId), listEventSectors(eventId)]);
        if (!active || !event) return;
        setForm(formFromEvent(event));
        if (event.venue_id) {
          const v = await getVenueById(event.venue_id);
          if (active) setVenue(v);
        }
        if (active) {
          setSectors(
            sectorRows.map((s) => ({
              key: s.id,
              id: s.id,
              name: s.name,
              short_label: s.short_label,
              capacity: s.capacity,
              price: s.price,
              color: s.color,
              shape_rect: s.shape_rect,
              shape_path: s.shape_path,
              label_x: s.label_x,
              label_y: s.label_y,
              is_active: s.is_active,
            }))
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [mode, eventId]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const filteredVenues = useMemo(() => {
    const q = venueSearch.trim().toLowerCase();
    return venues.filter((v) => !q || `${v.name} ${v.city}`.toLowerCase().includes(q));
  }, [venues, venueSearch]);

  const selectVenue = (v: Venue) => {
    setVenue(v);
    setSectors(sectorsFromVenue(v));
    setShowCustomForm(false);
    setDirty(true);
  };

  const handleCreateCustomVenue = async () => {
    if (!customName.trim()) return;
    try {
      const v = await createVenue({ name: customName.trim(), city: customCity.trim() || "Santiago" });
      setVenues((prev) => [...prev, v]);
      selectVenue(v);
    } catch {
      window.alert("No pudimos crear el recinto. Intenta de nuevo.");
    }
  };

  const activeSectors = sectors.filter((s) => s.is_active);
  const prices = activeSectors.map((s) => Number(s.price) || 0).filter((p) => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const perimetryReady = sectors.length > 0 && activeSectors.length > 0 && activeSectors.every((s) => Number(s.capacity) > 0 && Number(s.price) > 0);

  const checks = [
    { key: "info", label: "Título del evento", ok: !!form.title.trim() },
    { key: "venue", label: "Recinto seleccionado", ok: !!venue },
    { key: "map", label: "Perimetría: sectores con capacidad y precio", ok: perimetryReady },
    { key: "fecha", label: "Fecha y hora", ok: !!(form.date && form.time) },
    { key: "img", label: "Banner Hero (16:9)", ok: !!form.hero_image_url },
    { key: "img", label: "Banner interno (2.5:1)", ok: !!form.banner_image_url },
    { key: "img", label: "Imagen de tarjeta (4:3)", ok: !!form.image_url },
  ];
  const okCount = checks.filter((c) => c.ok).length;
  const ready = okCount === checks.length;
  const doneSteps = new Set(steps.filter((s) => s.key !== "conf" && checks.filter((c) => c.key === s.key).every((c) => c.ok)).map((s) => s.key));

  const buildInput = (statusOverride?: EventStatus): EventInput => ({
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    description: form.description.trim(),
    venue_id: venue?.id ?? null,
    venue: venue?.name ?? "",
    city: venue?.city ?? "",
    address: form.address,
    category: form.category,
    artist: form.artist,
    event_date: form.date && form.time ? new Date(`${form.date}T${form.time}`).toISOString() : "",
    doors_open: form.doorsOpen,
    image_url: form.image_url,
    hero_image_url: form.hero_image_url,
    banner_image_url: form.banner_image_url,
    sold: form.sold,
    status: statusOverride ?? form.status,
    show_in_hero: form.showInHero,
    sale_start: form.saleStart ? new Date(form.saleStart).toISOString() : "",
    max_tickets_per_order: form.maxTicketsPerOrder,
    qr_validation: form.qrValidation,
    age_restriction: form.ageRestriction,
    sectors: sectors.map((s, i) => ({
      id: s.id,
      name: s.name,
      short_label: s.short_label,
      capacity: Number(s.capacity) || 0,
      price: Number(s.price) || 0,
      color: s.color,
      shape_rect: s.shape_rect,
      shape_path: s.shape_path,
      label_x: s.label_x,
      label_y: s.label_y,
      is_active: s.is_active,
      sort_order: i,
    })),
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const save = async (asDraft: boolean) => {
    if (!form.title.trim()) {
      showToast("Agrega al menos un título");
      setActiveStep("info");
      return;
    }
    if (!asDraft && !ready) {
      const missing = checks.filter((c) => !c.ok).map((c) => c.label);
      showToast(`Falta: ${missing.slice(0, 2).join(", ")}${missing.length > 2 ? "…" : ""}`);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const input = buildInput(asDraft ? "borrador" : undefined);
      if (mode === "edit" && eventId) {
        await updateEvent(eventId, input);
      } else {
        await createEvent(input);
      }
      setDirty(false);
      router.push("/eventos");
    } catch {
      setError("No pudimos guardar el evento. Revisa los datos e intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const tryLeave = () => {
    if (dirty) {
      setShowLeaveModal(true);
      return;
    }
    router.push("/eventos");
  };

  const scrollTo = (key: string) => {
    setActiveStep(key);
    sectionRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const key = Object.entries(sectionRefs.current).find(([, el]) => el === entry.target)?.[0];
            if (key) setActiveStep(key);
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [loading]);

  if (loading) {
    return <div className={styles.page}>Cargando evento...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.stickyBar}>
        <div className={styles.crumb}>
          <button type="button" onClick={tryLeave}>
            Eventos
          </button>
          <span>/</span>
          <span className={styles.crumbCurrent}>{mode === "edit" ? "Editar evento" : "Nuevo evento"}</span>
        </div>
        <div className={styles.headRow}>
          <div className={styles.titleRow}>
            <button type="button" className={styles.back} onClick={tryLeave} title="Volver">
              <MaterialIcon name="arrow_back" />
            </button>
            <div>
              <h1 className={styles.liveTitle}>{form.title || (mode === "edit" ? "Editar evento" : "Nuevo evento")}</h1>
              <p className={styles.liveSubtitle}>Completa la información para {mode === "edit" ? "actualizar" : "crear y publicar"} tu evento.</p>
            </div>
          </div>
          <div className={styles.headActions}>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={tryLeave}>
              Cancelar
            </button>
            <button type="button" className={`${styles.btn} ${styles.btnSoft}`} onClick={() => save(true)} disabled={saving}>
              <MaterialIcon name="drafts" className={styles.btnIcon} />
              Guardar borrador
            </button>
            <button type="button" className={`${styles.btn} ${styles.btnOrange}`} onClick={() => save(false)} disabled={saving}>
              <MaterialIcon name="check" className={styles.btnIcon} />
              {saving ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Crear evento"}
            </button>
          </div>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.grid}>
        <nav className={styles.steps}>
          {steps.map((s, i) => (
            <a
              key={s.key}
              href={`#s-${s.key}`}
              className={styles.stepLink}
              data-active={activeStep === s.key}
              data-done={doneSteps.has(s.key)}
              onClick={(e) => {
                e.preventDefault();
                scrollTo(s.key);
              }}
            >
              <span className={styles.stepNumber}>{i + 1}</span>
              {s.label}
            </a>
          ))}
        </nav>

        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <div className={styles.sec} id="s-info" ref={(el) => { sectionRefs.current.info = el; }}>
            <div className={styles.secHead}>
              <div className={styles.secIcon} style={{ background: "#ffe7dc", color: "var(--color-orange)" }}>
                <MaterialIcon name="reorder" />
              </div>
              <div>
                <h2 className={styles.secTitle}>Información básica</h2>
                <p className={styles.secDesc}>El título y subtítulo se muestran en la portada y en la ficha del evento.</p>
              </div>
            </div>
            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.label}>
                  Título <i>*</i>
                  <small className={styles.counter}>{form.title.length}/80</small>
                </span>
                <input type="text" maxLength={80} value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Ej: Beéle en Chile — Gira 2026" />
              </label>
            </div>
            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.label}>
                  Subtítulo
                  <small className={styles.counter}>{form.subtitle.length}/120</small>
                </span>
                <input type="text" maxLength={120} value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} placeholder="Ej: Una noche única en Santiago" />
              </label>
            </div>
            <div className={`${styles.row} ${styles.c2}`}>
              <label className={styles.field}>
                <span className={styles.label}>Categoría</span>
                <select value={form.category} onChange={(e) => update("category", e.target.value)}>
                  {["Concierto", "Festival", "Teatro", "Stand-up", "Deportes", "Otro"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Artista / Organizador</span>
                <input type="text" value={form.artist} onChange={(e) => update("artist", e.target.value)} placeholder="Ej: Beéle" />
              </label>
            </div>
            <div className={styles.row}>
              <label className={styles.field}>
                <span className={styles.label}>Descripción</span>
                <textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Cuenta de qué se trata el evento, line-up, horarios de apertura de puertas, restricciones de edad…" />
              </label>
            </div>
          </div>

          <div className={styles.sec} id="s-venue" ref={(el) => { sectionRefs.current.venue = el; }}>
            <div className={styles.secHead}>
              <div className={styles.secIcon} style={{ background: "#e9e3ff", color: "var(--color-purple)" }}>
                <MaterialIcon name="location_on" />
              </div>
              <div>
                <h2 className={styles.secTitle}>
                  Recinto <span style={{ color: "var(--color-orange)" }}>*</span>
                </h2>
                <p className={styles.secDesc}>Elige dónde se realiza el evento. Su perimetría (plano y sectores) se carga automáticamente.</p>
              </div>
            </div>
            <div className={styles.venueSearch}>
              <MaterialIcon name="search" className={styles.venueIcon} />
              <input type="text" value={venueSearch} onChange={(e) => setVenueSearch(e.target.value)} placeholder="Buscar recinto o ciudad…" />
            </div>
            <div className={styles.venues}>
              {filteredVenues.map((v) => (
                <button key={v.id} type="button" className={styles.venueCard} data-active={venue?.id === v.id} data-custom={v.is_custom} onClick={() => (v.is_custom ? setShowCustomForm(true) : selectVenue(v))}>
                  <div className={styles.venueThumb} style={{ background: v.is_custom ? "#f8f9fa" : `linear-gradient(135deg, ${v.gradient})`, color: v.is_custom ? "#797488" : undefined }}>
                    <MaterialIcon name={v.is_custom ? "add" : "stadium"} />
                  </div>
                  <div className={styles.venueBody}>
                    <span className={styles.venueName}>{v.name}</span>
                    <span className={styles.venueCity}>{v.city}</span>
                    <div className={styles.venueTags}>
                      <span className={styles.venueTag}>{v.type}</span>
                      {!v.is_custom && (
                        <>
                          <span className={styles.venueTag}>{(venueCapacity(v) ?? 0).toLocaleString("es-CL")} pers.</span>
                          <span className={styles.venueTag}>{sectorCountFor(v)} sectores</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={styles.venueCheck}>
                    <MaterialIcon name="check" />
                  </span>
                </button>
              ))}
              <button type="button" className={styles.venueCard} data-custom="true" data-active={showCustomForm} onClick={() => setShowCustomForm(true)}>
                <div className={styles.venueThumb} style={{ background: "#f8f9fa", color: "#797488" }}>
                  <MaterialIcon name="add" />
                </div>
                <div className={styles.venueBody}>
                  <span className={styles.venueName}>Otro recinto</span>
                  <span className={styles.venueCity}>Define tu propio recinto</span>
                  <div className={styles.venueTags}>
                    <span className={styles.venueTag}>Manual</span>
                  </div>
                </div>
              </button>
            </div>
            {showCustomForm && (
              <div style={{ marginTop: 20 }}>
                <div className={`${styles.row} ${styles.c2}`}>
                  <label className={styles.field}>
                    <span className={styles.label}>
                      Nombre del recinto <i>*</i>
                    </span>
                    <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Ej: Club Chocolate" />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>
                      Ciudad <i>*</i>
                    </span>
                    <input type="text" value={customCity} onChange={(e) => setCustomCity(e.target.value)} />
                  </label>
                </div>
                <div className={styles.row}>
                  <label className={styles.field}>
                    <span className={styles.label}>Dirección</span>
                    <input type="text" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Calle y número" />
                  </label>
                </div>
                <button type="button" className={`${styles.btn} ${styles.btnOrange}`} onClick={handleCreateCustomVenue} disabled={!customName.trim()}>
                  Usar este recinto
                </button>
              </div>
            )}
          </div>

          <div className={styles.sec} id="s-map" ref={(el) => { sectionRefs.current.map = el; }}>
            <div className={styles.secHead}>
              <div className={styles.secIcon} style={{ background: "#ffe7dc", color: "var(--color-orange)" }}>
                <MaterialIcon name="grid_on" />
              </div>
              <div>
                <h2 className={styles.secTitle}>Perimetría y entradas</h2>
                <p className={styles.secDesc}>Activa los sectores que se venderán y define la capacidad y el precio de cada uno. El aforo total se calcula solo.</p>
              </div>
            </div>
            <PerimetryEditor venue={venue} sectors={sectors} onChange={setSectors} />
          </div>

          <div className={styles.sec} id="s-fecha" ref={(el) => { sectionRefs.current.fecha = el; }}>
            <div className={styles.secHead}>
              <div className={styles.secIcon} style={{ background: "#e6ecff", color: "var(--color-info)" }}>
                <MaterialIcon name="calendar_month" />
              </div>
              <div>
                <h2 className={styles.secTitle}>Fecha y hora</h2>
                <p className={styles.secDesc}>Cuándo ocurre el evento.</p>
              </div>
            </div>
            <div className={`${styles.row} ${styles.c3}`}>
              <label className={styles.field}>
                <span className={styles.label}>
                  Fecha <i>*</i>
                </span>
                <input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>
                  Hora de inicio <i>*</i>
                </span>
                <input type="time" value={form.time} onChange={(e) => update("time", e.target.value)} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Apertura de puertas</span>
                <input type="time" value={form.doorsOpen} onChange={(e) => update("doorsOpen", e.target.value)} />
              </label>
            </div>
          </div>

          <div className={styles.sec} id="s-img" ref={(el) => { sectionRefs.current.img = el; }}>
            <div className={styles.secHead}>
              <div className={styles.secIcon} style={{ background: "#dcf7e9", color: "var(--color-success)" }}>
                <MaterialIcon name="image" />
              </div>
              <div>
                <h2 className={styles.secTitle}>Imágenes del evento</h2>
                <p className={styles.secDesc}>Sube una imagen distinta para cada lugar donde aparece el evento.</p>
              </div>
            </div>
            <div className={styles.tip}>
              <MaterialIcon name="info" />
              <span>
                En cada imagen, mantén el elemento principal <b>centrado</b> — es el área segura que se conserva al recortar. Evita textos o rostros cerca de los bordes.
              </span>
            </div>
            <div className={styles.imageGroup}>
              <EventImageField label="Banner Hero del home — 1600 × 900 px · 16:9" hint="Se usa en el carrusel principal de la portada." value={form.hero_image_url} onChange={(url) => update("hero_image_url", url)} />
              <EventImageField label="Banner interno del evento — 1280 × 500 px · ~2.5:1" hint="Cabecera de la página de detalle del evento." value={form.banner_image_url} onChange={(url) => update("banner_image_url", url)} />
              <EventImageField label="Tarjeta destacada / listado — 800 × 560 px · 4:3" hint="Eventos destacados, Cerca de ti y listado de eventos." value={form.image_url} onChange={(url) => update("image_url", url)} />
            </div>
          </div>

          <div className={styles.sec} id="s-conf" ref={(el) => { sectionRefs.current.conf = el; }}>
            <div className={styles.secHead}>
              <div className={styles.secIcon} style={{ background: "#f3f4f9", color: "#4a4c66" }}>
                <MaterialIcon name="tune" />
              </div>
              <div>
                <h2 className={styles.secTitle}>Configuración de venta</h2>
                <p className={styles.secDesc}>Opciones de visibilidad y reglas de compra.</p>
              </div>
            </div>
            <div className={`${styles.row} ${styles.c2}`}>
              <label className={styles.field}>
                <span className={styles.label}>Inicio de venta</span>
                <input type="datetime-local" value={form.saleStart} onChange={(e) => update("saleStart", e.target.value)} />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Máx. entradas por compra</span>
                <input type="number" min={1} value={form.maxTicketsPerOrder} onChange={(e) => update("maxTicketsPerOrder", Number(e.target.value))} />
              </label>
            </div>
            {mode === "edit" && (
              <div className={`${styles.row} ${styles.c2}`}>
                <label className={styles.field}>
                  <span className={styles.label}>Entradas vendidas (manual)</span>
                  <input type="number" min={0} value={form.sold} onChange={(e) => update("sold", Number(e.target.value))} />
                </label>
              </div>
            )}
            <div className={styles.switch}>
              <div className={styles.switchText}>
                <b>Mostrar en banner Hero del home</b>
                <small>El evento aparecerá en el carrusel principal de la portada.</small>
              </div>
              <button type="button" className={styles.tg} data-checked={form.showInHero} onClick={() => update("showInHero", !form.showInHero)} />
            </div>
            <div className={styles.switch}>
              <div className={styles.switchText}>
                <b>Validación con QR en puerta</b>
                <small>Habilita el check-in desde la app de Validación.</small>
              </div>
              <button type="button" className={styles.tg} data-checked={form.qrValidation} onClick={() => update("qrValidation", !form.qrValidation)} />
            </div>
            <div className={styles.switch}>
              <div className={styles.switchText}>
                <b>Evento para mayores de 18</b>
                <small>Se solicitará confirmación de edad al comprar.</small>
              </div>
              <button type="button" className={styles.tg} data-checked={form.ageRestriction} onClick={() => update("ageRestriction", !form.ageRestriction)} />
            </div>
          </div>
        </form>

        <aside className={styles.aside}>
          <div className={styles.box}>
            <h3 className={styles.boxTitle}>Estado</h3>
            <div className={styles.radio}>
              {statusOptions.map((opt) => (
                <label key={opt.value} className={styles.radioOption} data-checked={form.status === opt.value}>
                  <input type="radio" name="status" checked={form.status === opt.value} onChange={() => update("status", opt.value)} />
                  <div>
                    <b>{opt.label}</b>
                    <small>{opt.hint}</small>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.box}>
            <h3 className={styles.boxTitle}>Vista previa</h3>
            <div className={styles.preview}>
              <div className={styles.previewImage} style={form.image_url ? { backgroundImage: `url(${form.image_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
                <span className={styles.previewBadge}>{{ borrador: "BORRADOR", proximamente: "PRÓXIMAMENTE", "en-venta": "EN VENTA", "casi-agotado": "CASI AGOTADO", finalizado: "FINALIZADO" }[form.status]}</span>
                {!form.image_url && <MaterialIcon name="image" />}
              </div>
              <div className={styles.previewBody}>
                <h4>{form.title || "Título del evento"}</h4>
                <p>
                  <MaterialIcon name="calendar_month" />
                  <span>{fmtDate(form.date, form.time) || "Fecha por definir"}</span>
                </p>
                <p>
                  <MaterialIcon name="location_on" />
                  <span>{venue ? `${venue.name}, ${venue.city}` : "Recinto, Ciudad"}</span>
                </p>
                <div className={styles.previewPrice}>{minPrice ? `Desde ${currency(minPrice)}` : "Desde $—"}</div>
              </div>
            </div>
          </div>

          <div className={styles.box}>
            <h3 className={styles.boxTitle}>Checklist de publicación</h3>
            <div className={styles.progress}>
              <span className={styles.progressFill} style={{ width: `${(okCount / checks.length) * 100}%` }} />
            </div>
            <div className={styles.checklist}>
              {checks.map((c, i) => (
                <div key={i} className={styles.checkItem} data-ok={c.ok}>
                  <span className={styles.checkDot}>{c.ok && <MaterialIcon name="check" />}</span>
                  {c.label}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {showLeaveModal && (
        <div className={styles.overlay} onClick={() => setShowLeaveModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>
              <MaterialIcon name="warning" />
            </div>
            <h3>¿Salir sin guardar?</h3>
            <p>
              Tienes cambios sin guardar en este evento. Si sales ahora, <b>perderás toda la información ingresada</b>.
            </p>
            <div className={styles.modalActions}>
              <button type="button" className={`${styles.btn} ${styles.btnOrange}`} onClick={() => setShowLeaveModal(false)}>
                Seguir editando
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnSoft}`} onClick={() => save(true)}>
                Guardar como borrador y salir
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={() => router.push("/eventos")}>
                Salir y descartar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={styles.toast} data-show={!!toast}>
          {toast}
        </div>
      )}
    </div>
  );
}

