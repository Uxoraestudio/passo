"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/icons";
import { allows, type Access, type ModuleKey } from "@/lib/access";
import { isOnboardingDone, markOnboardingDone, onOnboardingStart } from "@/lib/onboarding";
import styles from "./OnboardingTour.module.css";

type Step = {
  id: string;
  /** Module the person needs to see this step; none = everyone. */
  module?: ModuleKey;
  /** Element to point at; centered card when missing or hidden (phones). */
  target?: string;
  icon: string;
  title: string;
  text: string;
};

const noSubscribe = () => () => {};

const nav = (href: string) => `#admin-sidebar nav a[href="${href}"]`;

const STEPS: Step[] = [
  { id: "resumen", module: "resumen", target: nav("/inicio/"), icon: "home", title: "Resumen", text: "Tu día a día de un vistazo: ventas e ingresos del período, próximos eventos y la actividad más reciente." },
  {
    id: "eventos",
    module: "eventos",
    target: nav("/eventos/"),
    icon: "event",
    title: "Eventos",
    text: "Crea tus eventos con fecha, sectores y precios. Dentro de cada uno agregas preventas, cupones de descuento y cortesías, y lo publicas cuando esté listo.",
  },
  {
    id: "recintos",
    module: "eventos",
    target: nav("/recintos/"),
    icon: "stadium",
    title: "Recintos",
    text: "Dibuja una vez el plano de cada lugar —sectores, filas y asientos— y reutilízalo en todos los eventos que hagas ahí.",
  },
  { id: "ventas", module: "ventas", target: nav("/ventas/"), icon: "bar_chart", title: "Ventas y reportes", text: "Cada compra pagada, filtrada por evento y fecha. Puedes descargarlo todo en una planilla." },
  {
    id: "validacion",
    module: "validacion",
    target: nav("/validar-ticket/"),
    icon: "qr_code_scanner",
    title: "Validación",
    text: "El día del evento, abre esta sección en el teléfono y escanea el código QR de cada entrada en la puerta. Las entradas falsas o repetidas se rechazan solas.",
  },
  { id: "clientes", module: "clientes", target: nav("/clientes/"), icon: "group", title: "Clientes", text: "Las personas que te han comprado, cuánto han gastado y cuándo fue su última compra." },
  {
    id: "roles",
    module: "roles",
    target: nav("/roles/"),
    icon: "admin_panel_settings",
    title: "Roles",
    text: "Invita a tu equipo y elige qué puede ver o editar cada persona. Por ejemplo, alguien que solo valide entradas en la puerta.",
  },
  { id: "apariencia", module: "apariencia", target: nav("/apariencia/"), icon: "palette", title: "Apariencia", text: "Tu logo y los colores del sitio donde se venden las entradas." },
  { id: "seo", module: "seo", target: nav("/seo/"), icon: "travel_explore", title: "SEO", text: "Cómo aparece tu sitio en Google y cuando alguien comparte el enlace por WhatsApp o redes." },
  {
    id: "campana",
    module: "ventas",
    target: '[data-tour="notifications"]',
    icon: "notifications",
    title: "Notificaciones",
    text: "La campana te avisa de cada venta nueva, de los reembolsos pendientes y de las cortesías emitidas.",
  },
  {
    id: "cuenta",
    target: '[data-tour="account"]',
    icon: "account_circle",
    title: "Tu cuenta",
    text: "Desde aquí cambias tu nombre y tu contraseña, vuelves a ver esta guía o cierras sesión.",
  },
];

type Rect = { top: number; left: number; width: number; height: number };
type Pos = { top: number; left: number; side: "right" | "below" | "center" };

const CARD_W = 360;
const GAP = 16;
const PAD = 6;

function visibleRect(selector?: string): Rect | null {
  if (!selector) return null;
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0 || r.right <= 0 || r.left >= window.innerWidth) return null;
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
}

type Props = { userId: string; name: string; access: Access };

/**
 * Welcome tour: a short introduction, then each section of the panel the
 * person can use, highlighted in place, and a suggested first step.
 */
export default function OnboardingTour({ userId, name, access }: Props) {
  const router = useRouter();
  // Only in the browser: whether the tour was seen lives in localStorage.
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false);
  const [open, setOpen] = useState(() => !isOnboardingDone(userId));
  // -1 = welcome, steps.length = finish.
  const [index, setIndex] = useState(-1);
  const [rect, setRect] = useState<Rect | null>(null);
  const [pos, setPos] = useState<Pos | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const steps = STEPS.filter((s) => !s.module || allows(access, s.module));
  const step = index >= 0 && index < steps.length ? steps[index] : null;
  const canCreateEvents = allows(access, "eventos", "edit");

  useEffect(
    () =>
      onOnboardingStart(() => {
        setIndex(-1);
        setOpen(true);
      }),
    []
  );

  const finish = useCallback(() => {
    markOnboardingDone(userId);
    setOpen(false);
  }, [userId]);

  // Where the highlighted element is, kept up to date on resize/scroll.
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => setRect(visibleRect(step?.target));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, step]);

  // The card goes to the right of sidebar items, under top-bar items, or centered.
  useLayoutEffect(() => {
    if (!open) return;
    const card = cardRef.current;
    const h = card?.offsetHeight ?? 260;
    const w = Math.min(CARD_W, window.innerWidth - 32);
    const clampTop = (t: number) => Math.max(16, Math.min(t, window.innerHeight - h - 16));
    const clampLeft = (l: number) => Math.max(16, Math.min(l, window.innerWidth - w - 16));
    if (!rect) setPos({ side: "center", top: clampTop((window.innerHeight - h) / 2), left: clampLeft((window.innerWidth - w) / 2) });
    else if (rect.left + rect.width + GAP + w <= window.innerWidth - 16 && rect.top > 80)
      setPos({ side: "right", top: clampTop(rect.top + rect.height / 2 - h / 2), left: rect.left + rect.width + GAP });
    else setPos({ side: "below", top: clampTop(rect.top + rect.height + GAP), left: clampLeft(rect.left + rect.width - w) });
  }, [open, rect, index]);

  useEffect(() => {
    if (!open) return;
    cardRef.current?.querySelector<HTMLElement>("[data-primary]")?.focus({ preventScroll: true });
  }, [open, index]);

  // Keys work wherever focus is while the tour is open, and don't reach the page.
  const total = steps.length;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (!["Escape", "ArrowRight", "ArrowLeft", "Tab"].includes(e.key)) return;
      e.stopPropagation();
      if (e.key === "Escape") {
        e.preventDefault();
        finish();
      } else if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, total));
      else if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, -1));
      else {
        // Keep focus inside the card.
        const items = [...(cardRef.current?.querySelectorAll<HTMLElement>("button") ?? [])];
        const i = items.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        items[(i + (e.shiftKey ? -1 : 1) + items.length) % items.length]?.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, finish, total]);

  // Make sure the highlighted item is on screen (long sidebars on short screens).
  useEffect(() => {
    if (!open || !step?.target) return;
    document.querySelector(step.target)?.scrollIntoView({ block: "nearest" });
  }, [open, step]);

  if (!open || !mounted) return null;

  const next = () => setIndex((i) => Math.min(i + 1, steps.length));
  const back = () => setIndex((i) => Math.max(i - 1, -1));

  const firstName = name.trim().split(/\s+/)[0];
  const isWelcome = index === -1;
  const isFinish = index === steps.length;

  return createPortal(
    <div className={styles.layer}>
      {rect ? (
        <div className={styles.spotlight} style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} aria-hidden="true" />
      ) : (
        <div className={styles.backdrop} aria-hidden="true" />
      )}

      <div
        ref={cardRef}
        key={index}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-text"
        className={styles.card}
        data-side={pos?.side ?? "center"}
        style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: Math.min(CARD_W, typeof window === "undefined" ? CARD_W : window.innerWidth - 32) }}
      >
        {isWelcome && (
          <>
            <div className={styles.hero} aria-hidden="true">
              <MaterialIcon decorative name="waving_hand" />
            </div>
            <h2 id="tour-title" className={styles.title}>
              {firstName ? `¡Hola, ${firstName}!` : "¡Hola!"} Te damos la bienvenida a tu panel
            </h2>
            <p id="tour-text" className={styles.text}>
              Desde aquí manejas tus eventos de principio a fin: los creas, vendes las entradas, controlas el acceso en la puerta y ves cuánto llevas recaudado. Te mostramos cada sección en menos de un minuto.
            </p>
            <div className={styles.footer}>
              <button type="button" className={styles.skip} onClick={finish}>
                Ahora no
              </button>
              <button type="button" className={styles.primary} data-primary onClick={next}>
                Empezar recorrido
                <MaterialIcon decorative name="arrow_forward" />
              </button>
            </div>
          </>
        )}

        {step && (
          <>
            <div className={styles.stepHead}>
              <span className={styles.stepIcon} aria-hidden="true">
                <MaterialIcon decorative name={step.icon} />
              </span>
              <span className={styles.count}>
                {index + 1} de {steps.length}
              </span>
            </div>
            <h2 id="tour-title" className={styles.title}>
              {step.title}
            </h2>
            <p id="tour-text" className={styles.text}>
              {step.text}
            </p>
            <div className={styles.progress} aria-hidden="true">
              {steps.map((s, i) => (
                <span key={s.id} data-done={i <= index || undefined} />
              ))}
            </div>
            <div className={styles.footer}>
              <button type="button" className={styles.skip} onClick={finish}>
                Saltar guía
              </button>
              <span className={styles.nav}>
                <button type="button" className={styles.secondary} onClick={back}>
                  Atrás
                </button>
                <button type="button" className={styles.primary} data-primary onClick={next}>
                  Siguiente
                </button>
              </span>
            </div>
          </>
        )}

        {isFinish && (
          <>
            <div className={styles.hero} aria-hidden="true">
              <MaterialIcon decorative name="rocket_launch" />
            </div>
            <h2 id="tour-title" className={styles.title}>
              ¡Listo para empezar!
            </h2>
            <div id="tour-text" className={styles.text}>
              {canCreateEvents ? (
                <>
                  <p>Te recomendamos este orden:</p>
                  <ol className={styles.list}>
                    <li>Crea el recinto y dibuja su plano.</li>
                    <li>Crea tu evento, ponle precios y publícalo.</li>
                    <li>Comparte el enlace y sigue tus ventas aquí.</li>
                  </ol>
                </>
              ) : (
                <p>Ya conoces tu panel. Puedes volver a ver esta guía cuando quieras desde el menú de tu cuenta.</p>
              )}
            </div>
            <div className={styles.footer}>
              <button type="button" className={styles.skip} onClick={back}>
                Atrás
              </button>
              {canCreateEvents ? (
                <span className={styles.nav}>
                  <button type="button" className={styles.secondary} onClick={finish}>
                    Terminar
                  </button>
                  <button
                    type="button"
                    className={styles.primary}
                    data-primary
                    onClick={() => {
                      finish();
                      router.push("/recintos/");
                    }}
                  >
                    Ir a Recintos
                  </button>
                </span>
              ) : (
                <button type="button" className={styles.primary} data-primary onClick={finish}>
                  Terminar
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
