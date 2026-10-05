import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AccountNav, { type AccountSection } from "@/components/account/AccountNav";
import MyTickets, { type TicketView } from "@/components/account/MyTickets";
import AccountFavorites from "@/components/account/AccountFavorites";
import AccountProfileForm from "@/components/account/AccountProfileForm";
import AccountNotifications, { type NotificationPrefs } from "@/components/account/AccountNotifications";
import { requireUser } from "@/lib/auth-redirect";
import { getAllEvents } from "@/lib/events-data";
import { getAccountTickets } from "@/lib/account-tickets";
import { accountDisplayName, initialsOf } from "@/lib/account-user";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Mi cuenta | Passo",
  robots: { index: false },
};

const SECTIONS: Record<AccountSection, { title: string; subtitle: string }> = {
  entradas: { title: "Mis entradas", subtitle: "Todas tus experiencias, siempre contigo." },
  favoritos: { title: "Favoritos", subtitle: "Los eventos que guardaste para no perdértelos." },
  datos: { title: "Datos personales", subtitle: "Así aparecerás en tus entradas y comprobantes." },
  pagos: { title: "Métodos de pago", subtitle: "Tus tarjetas para comprar más rápido." },
  notificaciones: { title: "Notificaciones", subtitle: "Elige qué te avisamos y cuándo." },
};

const TICKET_VIEWS: { id: TicketView; label: string }[] = [
  { id: "proximas", label: "Próximas" },
  { id: "pasadas", label: "Pasadas" },
  { id: "canceladas", label: "Canceladas" },
];

function isSection(value: unknown): value is AccountSection {
  return typeof value === "string" && value in SECTIONS;
}

export default async function MiCuentaPage({ searchParams }: PageProps<"/mi-cuenta">) {
  const query = await searchParams;
  const section: AccountSection = isSection(query?.seccion) ? query.seccion : "entradas";
  const view: TicketView = TICKET_VIEWS.some((v) => v.id === query?.estado) ? (query.estado as TicketView) : "proximas";
  const user = await requireUser(section === "entradas" ? "/mi-cuenta/" : `/mi-cuenta/?seccion=${section}`);

  const name = accountDisplayName(user);
  const email = user.email ?? "";
  const { title, subtitle } = SECTIONS[section];

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.layout}>
          <AccountNav name={name} email={email} initials={initialsOf(name)} active={section} />

          <header className={styles.pageHeader}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
            {section === "entradas" && (
              <nav className={styles.tabs} aria-label="Filtrar entradas">
                {TICKET_VIEWS.map((option) => (
                  <Link
                    key={option.id}
                    href={option.id === "proximas" ? "/mi-cuenta/" : `/mi-cuenta/?estado=${option.id}`}
                    className={styles.tab}
                    aria-current={view === option.id ? "page" : undefined}
                    scroll={false}
                  >
                    {option.label}
                  </Link>
                ))}
              </nav>
            )}
          </header>

          <aside className={styles.helpCard} aria-labelledby="ayuda-titulo">
            <span className={styles.helpIcon} aria-hidden="true">
              <svg viewBox="0 0 40 40" fill="none">
                <rect x="2" y="4" width="24" height="18" rx="5" fill="var(--color-purple)" />
                <path d="M8 11h12M8 15.5h7" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                <rect x="14" y="16" width="24" height="18" rx="5" fill="var(--color-orange)" />
                <path d="M20 23h12M20 27.5h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <h2 id="ayuda-titulo" className={styles.helpTitle}>
              ¿Necesitas ayuda?
            </h2>
            <p className={styles.helpText}>Estamos aquí para ayudarte en todo momento.</p>
            <Link href="/proximamente/?title=Centro%20de%20ayuda" className={styles.helpButton}>
              Centro de ayuda
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3.3 8h9.4M8.7 4 12.7 8l-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </aside>

          <section className={styles.content} aria-label={title}>
            {section === "entradas" && <MyTickets view={view} tickets={await getAccountTickets()} />}
            {section === "favoritos" && <AccountFavorites events={await getAllEvents()} />}
            {section === "datos" && <AccountProfileForm initialName={name} email={email} />}
            {section === "pagos" && (
              <div className={styles.emptyPanel}>
                <span className={styles.emptyIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="5.5" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M3 10h18M7 15h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </span>
                <h2>Aún no tienes tarjetas guardadas</h2>
                <p>
                  Pagas de forma segura con Webpay Plus, Redcompra, débito o crédito en cada compra. Pronto podrás guardar tus
                  tarjetas para comprar con un toque.
                </p>
                <Link href="/eventos" className={styles.emptyAction}>
                  Explorar eventos
                </Link>
              </div>
            )}
            {section === "notificaciones" && (
              <AccountNotifications initialPrefs={(user.user_metadata?.notification_prefs as NotificationPrefs | undefined) ?? null} />
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
