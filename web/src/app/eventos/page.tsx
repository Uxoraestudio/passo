import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import { allEvents } from "@/lib/events";
import styles from "./page.module.css";

export default function EventosPage() {
  return (
    <>
      <Header />
      <main>
        <section className={styles.hero}>
          <nav className={styles.breadcrumb} aria-label="Migas de pan">
            <Link href="/">Inicio</Link>
            <span>/</span>
            <span className={styles.breadcrumbCurrent}>Eventos</span>
          </nav>
          <h1 className={styles.title}>
            Encuentra tu próxima <span className={styles.titleAccent}>experiencia</span>
          </h1>
          <p className={styles.subtitle}>Conciertos, deportes, teatro y mucho más, en un solo lugar.</p>
          <form className={styles.searchForm}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input type="text" placeholder="Busca artistas, eventos o ciudades" />
            <button type="submit">Buscar</button>
          </form>
        </section>

        <section className={styles.resultsSection}>
          <div className={styles.resultsHeader}>
            <div>
              <h2 className={styles.resultsTitle}>
                Eventos en <span className={styles.resultsCity}>Santiago</span>
              </h2>
              <p className={styles.resultsCount}>Se encontraron {allEvents.length} eventos</p>
            </div>
            <details className={styles.filtersDetails}>
              <summary className={styles.filtersToggle}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Filtros
              </summary>
              <div className={styles.filtersPanel}>
                <label className={styles.filterField}>
                  <span>Fecha</span>
                  <select defaultValue="todas">
                    <option value="todas">Todas las fechas</option>
                    <option value="hoy">Hoy</option>
                    <option value="finde">Este fin de semana</option>
                    <option value="mes">Este mes</option>
                  </select>
                </label>
                <label className={styles.filterField}>
                  <span>Ciudad</span>
                  <select defaultValue="santiago">
                    <option value="santiago">Santiago</option>
                    <option value="vina">Viña del Mar</option>
                    <option value="concepcion">Concepción</option>
                    <option value="valparaiso">Valparaíso</option>
                  </select>
                </label>
                <label className={styles.filterField}>
                  <span>Categoría</span>
                  <select defaultValue="todas">
                    <option value="todas">Todas las categorías</option>
                    <option value="musica">Música</option>
                    <option value="deportes">Deportes</option>
                    <option value="teatro">Teatro</option>
                    <option value="comedia">Comedia</option>
                    <option value="festivales">Festivales</option>
                  </select>
                </label>
                <label className={styles.filterToggleRow}>
                  <input type="checkbox" defaultChecked />
                  <span>Solo disponibles</span>
                </label>
              </div>
            </details>
          </div>

          <div className={styles.grid}>
            {allEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          <nav className={styles.pagination} aria-label="Paginación">
            <button type="button" className={styles.pageArrow} aria-label="Página anterior">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15.75 19.5 8.25 12l7.5-7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" className={`${styles.pageNumber} ${styles.pageNumberActive}`}>1</button>
            <button type="button" className={styles.pageNumber}>2</button>
            <button type="button" className={styles.pageNumber}>3</button>
            <span className={styles.pageEllipsis}>...</span>
            <button type="button" className={styles.pageNumber}>22</button>
            <button type="button" className={styles.pageArrow} aria-label="Página siguiente">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m8.25 4.5 7.5 7.5-7.5 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </nav>
        </section>
      </main>
      <Footer />
    </>
  );
}
