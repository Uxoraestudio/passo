import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import { allEvents, cities, searchEvents } from "@/lib/events";
import styles from "./page.module.css";

const categoryOptions = ["Música", "Deportes", "Teatro", "Comedia", "Festivales", "Danza", "Fútbol"];

export default async function EventosPage({ searchParams }: PageProps<"/eventos">) {
  const params = await searchParams;
  const q = typeof params?.q === "string" ? params.q : "";
  const category = typeof params?.category === "string" ? params.category : "";
  const city = typeof params?.city === "string" ? params.city : "Santiago";

  let results = allEvents;
  if (q) results = searchEvents(q, results);
  if (category) {
    results = results.filter((event) =>
      event.tags.some((tag) => tag.label.toLowerCase() === category.toLowerCase())
    );
  }
  if (city && city !== "Santiago") {
    results = results.filter((event) => event.city === city);
  }

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
          <form className={styles.searchForm} action="/eventos" method="get">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input type="text" name="q" defaultValue={q} placeholder="Busca artistas, eventos o ciudades" />
            <button type="submit">Buscar</button>
          </form>
        </section>

        <section className={styles.resultsSection}>
          <div className={styles.resultsHeader}>
            <div>
              <h2 className={styles.resultsTitle}>
                Eventos en <span className={styles.resultsCity}>{city}</span>
              </h2>
              <p className={styles.resultsCount}>
                {q
                  ? `${results.length} resultados para "${q}"`
                  : `Se encontraron ${results.length} eventos`}
              </p>
            </div>
            <details className={styles.filtersDetails} open={Boolean(category || (city && city !== "Santiago"))}>
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
              <form className={styles.filtersPanel} action="/eventos" method="get">
                {q && <input type="hidden" name="q" value={q} />}
                <label className={styles.filterField}>
                  <span>Fecha</span>
                  <select name="date" defaultValue="todas">
                    <option value="todas">Todas las fechas</option>
                    <option value="hoy">Hoy</option>
                    <option value="finde">Este fin de semana</option>
                    <option value="mes">Este mes</option>
                  </select>
                </label>
                <label className={styles.filterField}>
                  <span>Ciudad</span>
                  <select name="city" defaultValue={city}>
                    {cities.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.filterField}>
                  <span>Categoría</span>
                  <select name="category" defaultValue={category || "todas"}>
                    <option value="todas">Todas las categorías</option>
                    {categoryOptions.map((option) => (
                      <option key={option} value={option.toLowerCase()}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.filterToggleRow}>
                  <input type="checkbox" defaultChecked />
                  <span>Solo disponibles</span>
                </label>
                <button type="submit" className={styles.filterApply}>
                  Aplicar filtros
                </button>
              </form>
            </details>
          </div>

          {results.length > 0 ? (
            <div className={styles.grid}>
              {results.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className={styles.emptyState} role="status" aria-live="polite">
              No encontramos eventos que coincidan con tu búsqueda. Prueba con otro término o
              revisa <Link href="/eventos">todos los eventos</Link>.
            </p>
          )}

          <nav className={styles.pagination} aria-label="Paginación">
            <button type="button" className={styles.pageArrow} aria-label="Página anterior" disabled>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15.75 19.5 8.25 12l7.5-7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" className={`${styles.pageNumber} ${styles.pageNumberActive}`}>1</button>
            <button type="button" className={styles.pageArrow} aria-label="Página siguiente" disabled>
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
