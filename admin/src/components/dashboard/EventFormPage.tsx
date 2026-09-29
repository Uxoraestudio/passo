"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/icons";
import {
  EVENTS_FLASH_KEY,
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
import ConfirmDialog from "./ConfirmDialog";
import EventImageField from "./EventImageField";
import PerimetryEditor, { sectorIssue, type SectorDraft } from "./PerimetryEditor";
import styles from "./EventFormPage.module.css";

const statusOptions: { value: EventStatus; label: string; hint: string; editOnly?: boolean }[] = [
  { value: "borrador", label: "Borrador", hint: "Solo visible para tu equipo." },
  { value: "proximamente", label: "Próximamente", hint: "Visible, sin venta habilitada." },
  { value: "en-venta", label: "En venta", hint: "Publicado y vendiendo entradas." },
  { value: "casi-agotado", label: "Casi agotado", hint: "Quedan pocas entradas disponibles.", editOnly: true },
  { value: "finalizado", label: "Finalizado", hint: "El evento ya ocurrió.", editOnly: true },
];

const statusBadge: Record<EventStatus, string> = {
  borrador: "BORRADOR",
  proximamente: "PRÓXIMAMENTE",
  "en-venta": "EN VENTA",
  "casi-agotado": "CASI AGOTADO",
  finalizado: "FINALIZADO",
};

const steps = [
  { key: "info", label: "Información" },
  { key: "venue", label: "Recinto" },
  { key: "map", label: "Perimetría" },
  { key: "fecha", label: "Fecha y hora" },
  { key: "img", label: "Imágenes" },
  { key: "conf", label: "Configuración" },
] as const;

type StepKey = (typeof steps)[number]["key"];

const areaLabels: Record<StepKey | "status", string> = {
  info: "Información del evento",
  venue: "Recinto",
  map: "Perimetría y precios",
  fecha: "Fecha y hora",
  img: "Imágenes",
  conf: "Configuración de venta",
  status: "Estado",
};

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
  sold: number | "";
  saleStart: string;
  maxTicketsPerOrder: number | "";
  qrValidation: boolean;
  ageRestriction: boolean;
  showInHero: boolean;
  status: EventStatus;
  address: string;
};

type Issue = { id: string; step: StepKey; target: string; label: string };
type SaveLevel = "minimal" | "full";
type LoadState = "loading" | "ready" | "not-found" | "error";

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

const pad = (n: number) => String(n).padStart(2, "0");

function toDateTimeLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formFromEvent(event: EventRecord): FormState {
  const d = new Date(event.event_date);
  const valid = !Number.isNaN(d.getTime());
  return {
    title: event.title,
    subtitle: event.subtitle ?? "",
    category: event.category ?? "Concierto",
    artist: event.artist ?? "",
    description: event.description ?? "",
    date: valid ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : "",
    time: valid ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : "21:00",
    doorsOpen: event.doors_open ? event.doors_open.slice(0, 5) : "",
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
  return LAYOUTS[venue.layout_key].sectors.map((t) => ({
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

function sectorsSignature(sectors: SectorDraft[]) {
  return JSON.stringify(
    sectors.map((s) => [s.name, s.short_label, s.capacity, s.price, s.color, s.shape_rect, s.shape_path, s.label_x, s.label_y, s.is_active])
  );
}

function partsOf(form: FormState, venueId: string | null, sectors: SectorDraft[]): Record<keyof typeof areaLabels, string> {
  return {
    info: JSON.stringify([form.title, form.subtitle, form.category, form.artist, form.description]),
    venue: JSON.stringify([venueId, form.address]),
    map: sectorsSignature(sectors),
    fecha: JSON.stringify([form.date, form.time, form.doorsOpen]),
    img: JSON.stringify([form.hero_image_url, form.banner_image_url, form.image_url]),
    conf: JSON.stringify([form.saleStart, form.maxTicketsPerOrder, form.sold, form.qrValidation, form.ageRestriction, form.showInHero]),
    status: form.status,
  };
}

const currency = (value: number) => `$${value.toLocaleString("es-CL")}`;
const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function fmtDate(date: string, time: string) {
  if (!date) return "";
  const [y, m, dd] = date.split("-");
  return `${Number(dd)} ${months[Number(m) - 1]} ${y}${time ? ` • ${time} hrs` : ""}`;
}

function toWhole(raw: string): number | "" {
  if (raw === "") return "";
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) ? Math.max(0, n) : "";
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function EventFormPage({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const mode = eventId ? "edit" : "create";

  const [loadState, setLoadState] = useState<LoadState>(eventId ? "loading" : "ready");
  const [loadToken, setLoadToken] = useState(0);
  const [loadedEvent, setLoadedEvent] = useState<EventRecord | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [sectors, setSectors] = useState<SectorDraft[]>([]);
  const [baseline, setBaseline] = useState(() => (eventId ? null : partsOf(emptyForm(), null, [])));

  const [venues, setVenues] = useState<Venue[]>([]);
  const [venuesError, setVenuesError] = useState(false);
  const [venuesToken, setVenuesToken] = useState(0);
  const [venueSearch, setVenueSearch] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCity, setCustomCity] = useState("Santiago");
  const [customError, setCustomError] = useState("");
  const [creatingVenue, setCreatingVenue] = useState(false);
  const [pendingVenue, setPendingVenue] = useState<Venue | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [attemptLevel, setAttemptLevel] = useState<SaveLevel | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<StepKey>("info");

  const pageRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const leavingRef = useRef(false);

  useEffect(() => {
    let active = true;
    listVenues()
      .then((v) => {
        if (!active) return;
        setVenues(v);
        setVenuesError(false);
      })
      .catch(() => active && setVenuesError(true));
    return () => {
      active = false;
    };
  }, [venuesToken]);

  useEffect(() => {
    if (!eventId) return;
    let active = true;

    const load = async () => {
      setLoadState("loading");
      try {
        const [event, rows] = await Promise.all([getEvent(eventId), listEventSectors(eventId)]);
        if (!active) return;
        if (!event) {
          setLoadState("not-found");
          return;
        }
        const v = event.venue_id ? await getVenueById(event.venue_id) : null;
        if (!active) return;
        const loadedForm = formFromEvent(event);
        const loadedSectors: SectorDraft[] = rows.map((s) => ({
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
        }));
        setLoadedEvent(event);
        setForm(loadedForm);
        setVenue(v);
        setSectors(loadedSectors);
        setBaseline(partsOf(loadedForm, v?.id ?? null, loadedSectors));
        setLoadState("ready");
      } catch {
        if (active) setLoadState("error");
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [eventId, loadToken]);

  // Keep sticky offsets in sync with the real height of the sticky bar (it grows when alerts show).
  useEffect(() => {
    const bar = stickyRef.current;
    const page = pageRef.current;
    if (!bar || !page) return;
    const observer = new ResizeObserver(() => {
      page.style.setProperty("--sticky-h", `${Math.ceil(bar.getBoundingClientRect().height)}px`);
    });
    observer.observe(bar);
    return () => observer.disconnect();
  }, [loadState]);

  useEffect(() => {
    if (loadState !== "ready") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const key = steps.find((s) => `s-${s.key}` === entry.target.id)?.key;
          if (key) setActiveStep(key);
        });
      },
      { rootMargin: "-35% 0px -60% 0px" }
    );
    steps.forEach((s) => {
      const el = document.getElementById(`s-${s.key}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [loadState]);

  const current = useMemo(() => partsOf(form, venue?.id ?? null, sectors), [form, venue, sectors]);
  const changedAreas = useMemo(
    () => (baseline ? (Object.keys(current) as (keyof typeof areaLabels)[]).filter((k) => current[k] !== baseline[k]) : []),
    [current, baseline]
  );
  const dirty = loadState === "ready" && changedAreas.length > 0;

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (leavingRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    // Intercept in-app links (sidebar, topbar) so leaving always goes through the confirmation.
    const onClick = (e: MouseEvent) => {
      if (leavingRef.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.hash) return;
      e.preventDefault();
      e.stopPropagation();
      setLeaveTarget(url.pathname + url.search + url.hash);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaveError("");
  };

  const filteredVenues = useMemo(() => {
    const q = venueSearch.trim().toLowerCase();
    return venues.filter((v) => !q || `${v.name} ${v.city}`.toLowerCase().includes(q));
  }, [venues, venueSearch]);

  // Events saved before the venue catalog (or whose venue no longer exists): keep their stored venue/capacity/price.
  const legacy = loadedEvent && !venue ? loadedEvent : null;
  const isCustomVenue = !!venue && (venue.is_custom || venue.layout_key === "custom");
  const activeSectors = sectors.filter((s) => s.is_active);
  const perimetryReady = activeSectors.length > 0 && sectors.every((s) => !sectorIssue(s, isCustomVenue));
  const legacyPerimetryOk = !!legacy && legacy.capacity > 0 && legacy.price_base > 0;
  const hasVenue = !!venue || !!legacy?.venue;
  const perimetryOk = venue ? perimetryReady : legacyPerimetryOk;

  const effectiveCapacity = sectors.length > 0 ? activeSectors.reduce((sum, s) => sum + (Number(s.capacity) || 0), 0) : legacy?.capacity ?? 0;
  const prices = sectors.length > 0 ? activeSectors.map((s) => Number(s.price) || 0).filter((p) => p > 0) : legacy ? [legacy.price_base].filter((p) => p > 0) : [];
  const minPrice = prices.length ? Math.min(...prices) : 0;

  const doorsAfterStart = !!(form.doorsOpen && form.time && form.doorsOpen > form.time);
  const saleAfterEvent = !!(form.saleStart && form.date && form.time && new Date(form.saleStart) > new Date(`${form.date}T${form.time}`));

  const issuesFor = (level: SaveLevel): Issue[] => {
    const list: Issue[] = [];
    if (!form.title.trim()) list.push({ id: "title", step: "info", target: "f-title", label: "Título del evento" });
    if (!form.date) list.push({ id: "date", step: "fecha", target: "f-date", label: "Fecha del evento" });
    if (!form.time) list.push({ id: "time", step: "fecha", target: "f-time", label: "Hora de inicio" });
    if (level === "full") {
      if (!hasVenue) list.push({ id: "venue", step: "venue", target: "h-venue", label: "Recinto" });
      else if (!perimetryOk) list.push({ id: "map", step: "map", target: "h-map", label: "Sectores activos con capacidad y precio" });
    }
    if (!(Number(form.maxTicketsPerOrder) >= 1)) list.push({ id: "max", step: "conf", target: "f-max", label: "Máx. entradas por compra (mínimo 1)" });
    if (mode === "edit" && effectiveCapacity > 0 && Number(form.sold) > effectiveCapacity) {
      list.push({ id: "sold", step: "conf", target: "f-sold", label: `Entradas vendidas superan el aforo (${effectiveCapacity.toLocaleString("es-CL")})` });
    }
    return list;
  };

  const levelForSubmit: SaveLevel = mode === "create" || form.status !== "borrador" ? "full" : "minimal";
  const issues = attemptLevel ? issuesFor(attemptLevel) : [];
  const issueIds = new Set(issues.map((i) => i.id));
  const invalid = (id: string) => issueIds.has(id);

  const checks = [
    { key: "info" as const, label: "Título del evento", ok: !!form.title.trim() },
    { key: "venue" as const, label: "Recinto seleccionado", ok: hasVenue },
    { key: "map" as const, label: "Sectores con capacidad y precio", ok: perimetryOk },
    { key: "fecha" as const, label: "Fecha y hora", ok: !!(form.date && form.time) },
    { key: "img" as const, label: "Banner Hero (16:9)", ok: !!form.hero_image_url, optional: true },
    { key: "img" as const, label: "Banner interno (2.5:1)", ok: !!form.banner_image_url, optional: true },
    { key: "img" as const, label: "Imagen de tarjeta (4:3)", ok: !!form.image_url, optional: true },
  ];
  const okCount = checks.filter((c) => c.ok).length;
  const doneSteps = new Set(steps.filter((s) => s.key !== "conf" && checks.some((c) => c.key === s.key) && checks.filter((c) => c.key === s.key).every((c) => c.ok)).map((s) => s.key));
  const errorSteps = new Set(issues.map((i) => i.step));

  const scrollToStep = (key: StepKey) => {
    setActiveStep(key);
    document.getElementById(`s-${key}`)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  };

  const focusIssue = (issue: Issue) => {
    scrollToStep(issue.step);
    window.setTimeout(() => document.getElementById(issue.target)?.focus({ preventScroll: true }), prefersReducedMotion() ? 0 : 350);
  };

  const buildInput = (status: EventStatus): EventInput => ({
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    description: form.description.trim(),
    venue_id: venue?.id ?? null,
    venue: venue?.name ?? legacy?.venue ?? "",
    city: venue?.city ?? legacy?.city ?? "",
    address: form.address.trim(),
    category: form.category,
    artist: form.artist.trim(),
    event_date: new Date(`${form.date}T${form.time}`).toISOString(),
    doors_open: form.doorsOpen,
    image_url: form.image_url,
    hero_image_url: form.hero_image_url,
    banner_image_url: form.banner_image_url,
    sold: Number(form.sold) || 0,
    status,
    show_in_hero: form.showInHero,
    sale_start: form.saleStart ? new Date(form.saleStart).toISOString() : "",
    max_tickets_per_order: Number(form.maxTicketsPerOrder) || 1,
    qr_validation: form.qrValidation,
    age_restriction: form.ageRestriction,
    sectors: sectors.map((s, i) => ({
      id: s.id,
      name: s.name.trim(),
      short_label: s.short_label.trim() || s.name.trim(),
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
    capacity: loadedEvent?.capacity ?? 0,
    price_base: loadedEvent?.price_base ?? 0,
  });

  const save = async (kind: "draft" | "submit", thenHref = "/eventos") => {
    const level: SaveLevel = kind === "draft" ? "minimal" : levelForSubmit;
    const status: EventStatus = kind === "draft" ? "borrador" : form.status;
    const found = issuesFor(level);
    if (found.length > 0) {
      setAttemptLevel(level);
      setLeaveTarget(null);
      focusIssue(found[0]);
      return;
    }

    setSaving(true);
    setSaveError("");
    try {
      const input = buildInput(status);
      if (mode === "edit" && eventId) {
        await updateEvent(eventId, input);
      } else {
        await createEvent(input);
      }
      const flash = mode === "edit" ? `Cambios guardados en «${input.title}»` : status === "borrador" ? `Borrador «${input.title}» guardado` : `Evento «${input.title}» creado`;
      try {
        sessionStorage.setItem(EVENTS_FLASH_KEY, flash);
      } catch {
        // storage unavailable: the save still succeeded
      }
      leavingRef.current = true;
      router.push(thenHref);
    } catch {
      setLeaveTarget(null);
      setSaveError("No pudimos guardar el evento. Revisa tu conexión e inténtalo de nuevo; tus cambios siguen aquí.");
      setSaving(false);
    }
  };

  const requestLeave = (href = "/eventos") => {
    if (dirty && !leavingRef.current) {
      setLeaveTarget(href);
      return;
    }
    leavingRef.current = true;
    router.push(href);
  };

  const discardAndLeave = () => {
    const target = leaveTarget ?? "/eventos";
    leavingRef.current = true;
    setLeaveTarget(null);
    router.push(target);
  };

  const applyVenue = (v: Venue) => {
    setVenue(v);
    setSectors(sectorsFromVenue(v));
    setShowCustomForm(false);
    setPendingVenue(null);
  };

  const selectVenue = (v: Venue) => {
    if (venue?.id === v.id) return;
    const touched = venue ? sectorsSignature(sectors) !== sectorsSignature(sectorsFromVenue(venue)) : sectors.length > 0;
    if (touched) {
      setPendingVenue(v);
      return;
    }
    applyVenue(v);
  };

  const handleCreateCustomVenue = async () => {
    const name = customName.trim();
    const city = customCity.trim();
    if (!name || !city) {
      setCustomError(!name ? "Escribe el nombre del recinto." : "Escribe la ciudad del recinto.");
      return;
    }
    setCreatingVenue(true);
    setCustomError("");
    try {
      const v = await createVenue({ name, city });
      setVenues((prev) => [...prev, v]);
      setCustomName("");
      selectVenue(v);
      setShowCustomForm(false);
    } catch {
      setCustomError("No pudimos crear el recinto. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setCreatingVenue(false);
    }
  };

  if (loadState === "loading") {
    return (
      <div className={styles.page}>
        <div className={styles.stateCard} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          Cargando evento…
        </div>
      </div>
    );
  }

  if (loadState === "not-found" || loadState === "error") {
    const notFound = loadState === "not-found";
    return (
      <div className={styles.page}>
        <div className={styles.stateCard} role="alert">
          <MaterialIcon decorative name={notFound ? "search_off" : "cloud_off"} className={styles.stateIcon} />
          <h1 className={styles.stateTitle}>{notFound ? "No encontramos este evento" : "No pudimos cargar el evento"}</h1>
          <p className={styles.stateText}>
            {notFound ? "Puede que se haya eliminado o que el enlace esté incompleto." : "Revisa tu conexión e inténtalo de nuevo."}
          </p>
          <div className={styles.stateActions}>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => router.push("/eventos")}>
              Volver a eventos
            </button>
            {!notFound && (
              <button type="button" className={`${styles.btn} ${styles.btnOrange}`} onClick={() => setLoadToken((t) => t + 1)}>
                Reintentar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const visibleStatuses = statusOptions.filter((o) => mode === "edit" || !o.editOnly);
  const pageTitle = mode === "edit" ? "Editar evento" : "Nuevo evento";

  return (
    <div className={styles.page} ref={pageRef}>
      <div className={styles.stickyBar} ref={stickyRef}>
        <nav className={styles.crumb} aria-label="Ruta">
          <button type="button" onClick={() => requestLeave("/eventos")}>
            Eventos
          </button>
          <MaterialIcon decorative name="chevron_right" className={styles.crumbSep} />
          <span className={styles.crumbCurrent} aria-current="page">
            {pageTitle}
          </span>
        </nav>
        <div className={styles.headRow}>
          <div className={styles.titleRow}>
            <button type="button" className={styles.back} onClick={() => requestLeave("/eventos")} aria-label="Volver a eventos">
              <MaterialIcon decorative name="arrow_back" />
            </button>
            <div className={styles.titleText}>
              <h1 className={styles.liveTitle}>{form.title.trim() || pageTitle}</h1>
              <p className={styles.liveSubtitle}>
                {dirty ? (
                  <span className={styles.unsaved}>
                    <span className={styles.unsavedDot} aria-hidden="true" />
                    Cambios sin guardar
                  </span>
                ) : mode === "edit" ? (
                  "Todos los cambios están guardados."
                ) : (
                  "Completa la información para crear y publicar tu evento."
                )}
              </p>
            </div>
          </div>
          <div className={styles.headActions}>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => requestLeave("/eventos")} disabled={saving}>
              Cancelar
            </button>
            {mode === "create" && (
              <button type="button" className={`${styles.btn} ${styles.btnSoft}`} onClick={() => save("draft")} disabled={saving}>
                <MaterialIcon decorative name="draft" className={styles.btnIcon} />
                Guardar borrador
              </button>
            )}
            <button type="button" className={`${styles.btn} ${styles.btnOrange}`} onClick={() => save("submit")} disabled={saving}>
              <MaterialIcon decorative name={saving ? "progress_activity" : "check"} className={`${styles.btnIcon} ${saving ? styles.spin : ""}`} />
              {saving ? "Guardando…" : mode === "edit" ? "Guardar cambios" : "Crear evento"}
            </button>
          </div>
        </div>

        {saveError && (
          <div className={styles.alert} role="alert">
            <MaterialIcon decorative name="error" className={styles.alertIcon} />
            <p>{saveError}</p>
          </div>
        )}

        {issues.length > 0 && (
          <div className={styles.alert} role="alert">
            <MaterialIcon decorative name="error" className={styles.alertIcon} />
            <div>
              <p className={styles.alertTitle}>
                {attemptLevel === "minimal" ? "Para guardar el borrador falta completar:" : "Para guardar el evento falta completar:"}
              </p>
              <ul className={styles.alertList}>
                {issues.map((i) => (
                  <li key={i.id}>
                    <button type="button" onClick={() => focusIssue(i)}>
                      {i.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className={styles.grid}>
        <nav className={styles.steps} aria-label="Secciones del formulario">
          {steps.map((s, i) => (
            <a
              key={s.key}
              href={`#s-${s.key}`}
              className={styles.stepLink}
              data-active={activeStep === s.key}
              data-done={doneSteps.has(s.key)}
              data-error={errorSteps.has(s.key)}
              aria-current={activeStep === s.key ? "step" : undefined}
              onClick={(e) => {
                e.preventDefault();
                scrollToStep(s.key);
              }}
            >
              <span className={styles.stepNumber} aria-hidden="true">
                {errorSteps.has(s.key) ? "!" : doneSteps.has(s.key) ? <MaterialIcon decorative name="check" /> : i + 1}
              </span>
              {s.label}
              {errorSteps.has(s.key) && <span className={styles.srOnly}> (tiene errores)</span>}
            </a>
          ))}
        </nav>

        <form className={styles.form} onSubmit={(e) => e.preventDefault()} noValidate>
          <section className={styles.sec} id="s-info" aria-labelledby="h-info">
            <div className={styles.secHead}>
              <div className={styles.secIcon} data-tone="orange" aria-hidden="true">
                <MaterialIcon decorative name="notes" />
              </div>
              <div>
                <h2 className={styles.secTitle} id="h-info" tabIndex={-1}>
                  Información básica
                </h2>
                <p className={styles.secDesc}>El título y subtítulo se muestran en la portada y en la ficha del evento.</p>
              </div>
            </div>
            <div className={styles.row}>
              <label className={styles.field} htmlFor="f-title">
                <span className={styles.label}>
                  <span>
                    Título <i aria-hidden="true">*</i>
                  </span>
                  <small className={styles.counter}>{form.title.length}/80</small>
                </span>
                <input
                  id="f-title"
                  type="text"
                  maxLength={80}
                  required
                  aria-required="true"
                  aria-invalid={invalid("title")}
                  aria-describedby={invalid("title") ? "e-title" : undefined}
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="Ej: Beéle en Chile — Gira 2026"
                />
                {invalid("title") && (
                  <span className={styles.fieldError} id="e-title">
                    Escribe un título para identificar el evento.
                  </span>
                )}
              </label>
            </div>
            <div className={styles.row}>
              <label className={styles.field} htmlFor="f-subtitle">
                <span className={styles.label}>
                  <span>Subtítulo</span>
                  <small className={styles.counter}>{form.subtitle.length}/120</small>
                </span>
                <input id="f-subtitle" type="text" maxLength={120} value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} placeholder="Ej: Una noche única en Santiago" />
              </label>
            </div>
            <div className={`${styles.row} ${styles.c2}`}>
              <label className={styles.field} htmlFor="f-category">
                <span className={styles.label}>Categoría</span>
                <select id="f-category" value={form.category} onChange={(e) => update("category", e.target.value)}>
                  {["Concierto", "Festival", "Teatro", "Stand-up", "Deportes", "Otro"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className={styles.field} htmlFor="f-artist">
                <span className={styles.label}>Artista / Organizador</span>
                <input id="f-artist" type="text" maxLength={80} value={form.artist} onChange={(e) => update("artist", e.target.value)} placeholder="Ej: Beéle" />
              </label>
            </div>
            <div className={styles.row}>
              <label className={styles.field} htmlFor="f-description">
                <span className={styles.label}>Descripción</span>
                <textarea
                  id="f-description"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Cuenta de qué se trata el evento, line-up, horarios de apertura de puertas, restricciones de edad…"
                />
              </label>
            </div>
          </section>

          <section className={styles.sec} id="s-venue" aria-labelledby="h-venue" data-invalid={invalid("venue")}>
            <div className={styles.secHead}>
              <div className={styles.secIcon} data-tone="purple" aria-hidden="true">
                <MaterialIcon decorative name="location_on" />
              </div>
              <div>
                <h2 className={styles.secTitle} id="h-venue" tabIndex={-1}>
                  Recinto <i className={styles.req} aria-hidden="true">*</i>
                </h2>
                <p className={styles.secDesc}>Elige dónde se realiza el evento. Su perimetría (plano y sectores) se carga automáticamente.</p>
              </div>
            </div>

            {invalid("venue") && <p className={styles.fieldError}>Elige un recinto para poder vender entradas.</p>}

            {legacy && (
              <div className={styles.notice}>
                <MaterialIcon decorative name="history" className={styles.noticeIcon} />
                <p>
                  Este evento se creó antes del catálogo de recintos. Hoy figura en <b>{[legacy.venue, legacy.city].filter(Boolean).join(", ") || "sin recinto"}</b>
                  {legacy.capacity > 0 && (
                    <>
                      {" "}
                      con aforo <b>{legacy.capacity.toLocaleString("es-CL")}</b> y precio base <b>{currency(legacy.price_base)}</b>
                    </>
                  )}
                  . Elige un recinto para configurar sus sectores; si no, se conservan estos valores.
                </p>
              </div>
            )}

            <label className={styles.venueSearch}>
              <MaterialIcon decorative name="search" className={styles.venueIcon} />
              <span className={styles.srOnly}>Buscar recinto</span>
              <input type="search" value={venueSearch} onChange={(e) => setVenueSearch(e.target.value)} placeholder="Buscar recinto o ciudad…" />
            </label>

            {venuesError && (
              <div className={styles.inlineError} role="alert">
                <span>No pudimos cargar los recintos.</span>
                <button type="button" onClick={() => setVenuesToken((t) => t + 1)}>
                  Reintentar
                </button>
              </div>
            )}

            <div className={styles.venues}>
              {filteredVenues.map((v) => {
                const selected = venue?.id === v.id;
                return (
                  <button key={v.id} type="button" className={styles.venueCard} data-active={selected} aria-pressed={selected} onClick={() => selectVenue(v)}>
                    <div
                      className={styles.venueThumb}
                      data-custom={v.is_custom}
                      style={v.is_custom || !v.gradient ? undefined : { background: `linear-gradient(135deg, ${v.gradient})` }}
                      aria-hidden="true"
                    >
                      <MaterialIcon decorative name={v.is_custom ? "location_city" : "stadium"} />
                    </div>
                    <div className={styles.venueBody}>
                      <span className={styles.venueName}>{v.name}</span>
                      <span className={styles.venueCity}>{v.city}</span>
                      <div className={styles.venueTags}>
                        <span className={styles.venueTag}>{v.is_custom ? "Personalizado" : v.type}</span>
                        {!v.is_custom && (
                          <>
                            <span className={styles.venueTag}>{(venueCapacity(v) ?? 0).toLocaleString("es-CL")} pers.</span>
                            <span className={styles.venueTag}>{sectorCountFor(v)} sectores</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className={styles.venueCheck} aria-hidden="true">
                      <MaterialIcon decorative name="check" />
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                className={styles.venueCard}
                data-dashed="true"
                data-active={showCustomForm}
                aria-expanded={showCustomForm}
                aria-controls="custom-venue"
                onClick={() => setShowCustomForm((s) => !s)}
              >
                <div className={styles.venueThumb} data-custom="true" aria-hidden="true">
                  <MaterialIcon decorative name="add" />
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

            {filteredVenues.length === 0 && venueSearch && !venuesError && (
              <p className={styles.hint}>No hay recintos que coincidan con «{venueSearch}». Usa «Otro recinto» para crearlo.</p>
            )}

            {showCustomForm && (
              <div className={styles.customVenue} id="custom-venue">
                <div className={`${styles.row} ${styles.c2}`}>
                  <label className={styles.field} htmlFor="f-cv-name">
                    <span className={styles.label}>
                      <span>
                        Nombre del recinto <i aria-hidden="true">*</i>
                      </span>
                    </span>
                    <input id="f-cv-name" type="text" maxLength={80} value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Ej: Club Chocolate" />
                  </label>
                  <label className={styles.field} htmlFor="f-cv-city">
                    <span className={styles.label}>
                      <span>
                        Ciudad <i aria-hidden="true">*</i>
                      </span>
                    </span>
                    <input id="f-cv-city" type="text" maxLength={60} value={customCity} onChange={(e) => setCustomCity(e.target.value)} />
                  </label>
                </div>
                <div className={styles.row}>
                  <label className={styles.field} htmlFor="f-address">
                    <span className={styles.label}>Dirección</span>
                    <input id="f-address" type="text" maxLength={120} value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Calle y número" />
                  </label>
                </div>
                {customError && (
                  <p className={styles.fieldError} role="alert">
                    {customError}
                  </p>
                )}
                <div className={styles.customActions}>
                  <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowCustomForm(false)} disabled={creatingVenue}>
                    Cancelar
                  </button>
                  <button type="button" className={`${styles.btn} ${styles.btnOrange}`} onClick={handleCreateCustomVenue} disabled={creatingVenue}>
                    {creatingVenue ? "Creando…" : "Crear y usar este recinto"}
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className={styles.sec} id="s-map" aria-labelledby="h-map" data-invalid={invalid("map")}>
            <div className={styles.secHead}>
              <div className={styles.secIcon} data-tone="orange" aria-hidden="true">
                <MaterialIcon decorative name="grid_on" />
              </div>
              <div>
                <h2 className={styles.secTitle} id="h-map" tabIndex={-1}>
                  Perimetría y entradas
                </h2>
                <p className={styles.secDesc}>Activa los sectores que se venderán y define la capacidad y el precio de cada uno. El aforo total se calcula solo.</p>
              </div>
            </div>
            {invalid("map") && <p className={styles.fieldError}>Cada sector activo necesita capacidad y precio mayores a cero.</p>}
            <PerimetryEditor venue={venue} sectors={sectors} onChange={setSectors} showErrors={invalid("map")} />
          </section>

          <section className={styles.sec} id="s-fecha" aria-labelledby="h-fecha">
            <div className={styles.secHead}>
              <div className={styles.secIcon} data-tone="blue" aria-hidden="true">
                <MaterialIcon decorative name="calendar_month" />
              </div>
              <div>
                <h2 className={styles.secTitle} id="h-fecha" tabIndex={-1}>
                  Fecha y hora
                </h2>
                <p className={styles.secDesc}>Cuándo ocurre el evento. La fecha es obligatoria incluso para borradores.</p>
              </div>
            </div>
            <div className={`${styles.row} ${styles.c3}`}>
              <label className={styles.field} htmlFor="f-date">
                <span className={styles.label}>
                  <span>
                    Fecha <i aria-hidden="true">*</i>
                  </span>
                </span>
                <input id="f-date" type="date" required aria-required="true" aria-invalid={invalid("date")} value={form.date} onChange={(e) => update("date", e.target.value)} />
                {invalid("date") && <span className={styles.fieldError}>Elige la fecha del evento.</span>}
              </label>
              <label className={styles.field} htmlFor="f-time">
                <span className={styles.label}>
                  <span>
                    Hora de inicio <i aria-hidden="true">*</i>
                  </span>
                </span>
                <input id="f-time" type="time" required aria-required="true" aria-invalid={invalid("time")} value={form.time} onChange={(e) => update("time", e.target.value)} />
                {invalid("time") && <span className={styles.fieldError}>Indica a qué hora comienza.</span>}
              </label>
              <label className={styles.field} htmlFor="f-doors">
                <span className={styles.label}>Apertura de puertas</span>
                <input id="f-doors" type="time" value={form.doorsOpen} onChange={(e) => update("doorsOpen", e.target.value)} aria-describedby={doorsAfterStart ? "w-doors" : undefined} />
                {doorsAfterStart && (
                  <span className={styles.fieldWarn} id="w-doors">
                    Las puertas abren después del inicio. ¿Es correcto?
                  </span>
                )}
              </label>
            </div>
          </section>

          <section className={styles.sec} id="s-img" aria-labelledby="h-img">
            <div className={styles.secHead}>
              <div className={styles.secIcon} data-tone="green" aria-hidden="true">
                <MaterialIcon decorative name="image" />
              </div>
              <div>
                <h2 className={styles.secTitle} id="h-img" tabIndex={-1}>
                  Imágenes del evento
                </h2>
                <p className={styles.secDesc}>Sube una imagen distinta para cada lugar donde aparece el evento. Si falta alguna, el sitio usa una imagen genérica.</p>
              </div>
            </div>
            <div className={styles.tip}>
              <MaterialIcon decorative name="info" className={styles.tipIcon} />
              <span>
                En cada imagen, mantén el elemento principal <b>centrado</b> — es el área segura que se conserva al recortar. Evita textos o rostros cerca de los bordes.
              </span>
            </div>
            <div className={styles.imageGroup}>
              <EventImageField label="Banner Hero del home — 1600 × 900 px · 16:9" hint="Se usa en el carrusel principal de la portada." value={form.hero_image_url} onChange={(url) => update("hero_image_url", url)} />
              <EventImageField label="Banner interno del evento — 1280 × 500 px · ~2.5:1" hint="Cabecera de la página de detalle del evento." value={form.banner_image_url} onChange={(url) => update("banner_image_url", url)} />
              <EventImageField label="Tarjeta destacada / listado — 800 × 560 px · 4:3" hint="Eventos destacados, Cerca de ti y listado de eventos." value={form.image_url} onChange={(url) => update("image_url", url)} />
            </div>
          </section>

          <section className={styles.sec} id="s-conf" aria-labelledby="h-conf">
            <div className={styles.secHead}>
              <div className={styles.secIcon} data-tone="neutral" aria-hidden="true">
                <MaterialIcon decorative name="tune" />
              </div>
              <div>
                <h2 className={styles.secTitle} id="h-conf" tabIndex={-1}>
                  Configuración de venta
                </h2>
                <p className={styles.secDesc}>Opciones de visibilidad y reglas de compra.</p>
              </div>
            </div>
            <div className={`${styles.row} ${styles.c2}`}>
              <label className={styles.field} htmlFor="f-sale">
                <span className={styles.label}>Inicio de venta</span>
                <input id="f-sale" type="datetime-local" value={form.saleStart} onChange={(e) => update("saleStart", e.target.value)} aria-describedby={saleAfterEvent ? "w-sale" : "h-sale"} />
                {saleAfterEvent ? (
                  <span className={styles.fieldWarn} id="w-sale">
                    La venta empieza después del evento. Revisa la fecha.
                  </span>
                ) : (
                  <span className={styles.hint} id="h-sale">
                    Déjalo vacío para vender en cuanto publiques.
                  </span>
                )}
              </label>
              <label className={styles.field} htmlFor="f-max">
                <span className={styles.label}>Máx. entradas por compra</span>
                <input
                  id="f-max"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  aria-invalid={invalid("max")}
                  value={form.maxTicketsPerOrder}
                  onChange={(e) => update("maxTicketsPerOrder", toWhole(e.target.value))}
                />
                {invalid("max") && <span className={styles.fieldError}>Debe ser 1 o más.</span>}
              </label>
            </div>
            {mode === "edit" && (
              <div className={`${styles.row} ${styles.c2}`}>
                <label className={styles.field} htmlFor="f-sold">
                  <span className={styles.label}>Entradas vendidas (manual)</span>
                  <input
                    id="f-sold"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    aria-invalid={invalid("sold")}
                    value={form.sold}
                    onChange={(e) => update("sold", toWhole(e.target.value))}
                  />
                  {invalid("sold") ? (
                    <span className={styles.fieldError}>No puede superar el aforo habilitado ({effectiveCapacity.toLocaleString("es-CL")}).</span>
                  ) : (
                    <span className={styles.hint}>Aforo habilitado: {effectiveCapacity.toLocaleString("es-CL")} personas.</span>
                  )}
                </label>
              </div>
            )}
            {[
              { key: "showInHero" as const, id: "t-hero", title: "Mostrar en banner Hero del home", desc: "El evento aparecerá en el carrusel principal de la portada." },
              { key: "qrValidation" as const, id: "t-qr", title: "Validación con QR en puerta", desc: "Habilita el check-in desde la app de Validación." },
              { key: "ageRestriction" as const, id: "t-age", title: "Evento para mayores de 18", desc: "Se solicitará confirmación de edad al comprar." },
            ].map((t) => (
              <div key={t.key} className={styles.switch}>
                <div className={styles.switchText}>
                  <b id={`${t.id}-label`}>{t.title}</b>
                  <small id={`${t.id}-desc`}>{t.desc}</small>
                </div>
                <button
                  type="button"
                  role="switch"
                  className={styles.tg}
                  aria-checked={form[t.key]}
                  aria-labelledby={`${t.id}-label`}
                  aria-describedby={`${t.id}-desc`}
                  data-checked={form[t.key]}
                  onClick={() => update(t.key, !form[t.key])}
                />
              </div>
            ))}
          </section>
        </form>

        <aside className={styles.aside} aria-label="Resumen del evento">
          <div className={styles.box}>
            <h3 className={styles.boxTitle} id="estado-title">
              Estado
            </h3>
            <div className={styles.radio} role="radiogroup" aria-labelledby="estado-title">
              {visibleStatuses.map((opt) => (
                <label key={opt.value} className={styles.radioOption} data-checked={form.status === opt.value}>
                  <input type="radio" name="status" value={opt.value} checked={form.status === opt.value} onChange={() => update("status", opt.value)} />
                  <span>
                    <b>{opt.label}</b>
                    <small>{opt.hint}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.box}>
            <h3 className={styles.boxTitle}>Vista previa</h3>
            <div className={styles.preview}>
              <div className={styles.previewImage} style={form.image_url ? { backgroundImage: `url("${form.image_url}")` } : undefined}>
                <span className={styles.previewBadge}>{statusBadge[form.status]}</span>
                {!form.image_url && <MaterialIcon decorative name="image" className={styles.previewPlaceholder} />}
              </div>
              <div className={styles.previewBody}>
                <h4>{form.title.trim() || "Título del evento"}</h4>
                <p>
                  <MaterialIcon decorative name="calendar_month" />
                  <span>{fmtDate(form.date, form.time) || "Fecha por definir"}</span>
                </p>
                <p>
                  <MaterialIcon decorative name="location_on" />
                  <span>{venue ? `${venue.name}, ${venue.city}` : legacy?.venue ? `${legacy.venue}, ${legacy.city}` : "Recinto por definir"}</span>
                </p>
                <div className={styles.previewPrice}>{minPrice ? `Desde ${currency(minPrice)}` : "Precio por definir"}</div>
              </div>
            </div>
          </div>

          <div className={styles.box}>
            <h3 className={styles.boxTitle}>Checklist de publicación</h3>
            <div
              className={styles.progress}
              role="progressbar"
              aria-label="Avance de la configuración"
              aria-valuemin={0}
              aria-valuemax={checks.length}
              aria-valuenow={okCount}
              aria-valuetext={`${okCount} de ${checks.length} completados`}
            >
              <span className={styles.progressFill} style={{ transform: `scaleX(${okCount / checks.length})` }} />
            </div>
            <ul className={styles.checklist}>
              {checks.map((c) => (
                <li key={c.label}>
                  <button type="button" className={styles.checkItem} data-ok={c.ok} onClick={() => scrollToStep(c.key)}>
                    <span className={styles.checkDot} aria-hidden="true">
                      {c.ok && <MaterialIcon decorative name="check" />}
                    </span>
                    <span className={styles.checkLabel}>
                      {c.label}
                      <span className={styles.srOnly}>{c.ok ? " (listo)" : " (pendiente)"}</span>
                    </span>
                    {c.optional && !c.ok && <span className={styles.optionalTag}>Recomendado</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={leaveTarget !== null}
        title="¿Salir sin guardar?"
        details={changedAreas.map((a) => areaLabels[a])}
        busy={saving}
        onClose={() => setLeaveTarget(null)}
        actions={[
          { label: "Seguir editando", variant: "primary", autoFocus: true, onClick: () => setLeaveTarget(null) },
          {
            label: mode === "edit" ? "Guardar cambios y salir" : "Guardar como borrador y salir",
            busyLabel: "Guardando…",
            variant: "soft",
            onClick: () => save(mode === "edit" ? "submit" : "draft", leaveTarget ?? "/eventos"),
          },
          { label: "Salir sin guardar", variant: "danger", onClick: discardAndLeave },
        ]}
      >
        <p>
          {mode === "edit" ? (
            <>
              Tienes cambios sin guardar en <b>«{form.title.trim() || loadedEvent?.title}»</b>. Si sales ahora, se perderán.
            </>
          ) : (
            "Tienes un evento nuevo sin guardar. Si sales ahora, se perderá lo que ingresaste."
          )}
        </p>
        {changedAreas.length > 0 && <p className={styles.modalLead}>Secciones con cambios:</p>}
      </ConfirmDialog>

      <ConfirmDialog
        open={pendingVenue !== null}
        icon="swap_horiz"
        title="¿Cambiar de recinto?"
        onClose={() => setPendingVenue(null)}
        actions={[
          { label: "Mantener recinto actual", variant: "soft", autoFocus: true, onClick: () => setPendingVenue(null) },
          { label: `Cambiar a ${pendingVenue?.name ?? "otro recinto"}`, variant: "danger", onClick: () => pendingVenue && applyVenue(pendingVenue) },
        ]}
      >
        <p>
          Los sectores, capacidades y precios que configuraste{venue ? <> para <b>{venue.name}</b></> : null} se reemplazarán por los de <b>{pendingVenue?.name}</b>.
        </p>
      </ConfirmDialog>
    </div>
  );
}
