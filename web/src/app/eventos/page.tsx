import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import SortSelect from "@/components/SortSelect";
import { allEvents, cities, searchEvents } from "@/lib/events";
import styles from "./page.module.css";

const categoryOptions = ["Música", "Deportes", "Teatro", "Comedia", "Festivales", "Danza", "Fútbol"];

function parsePrice(price: string): number {
  return Number(price.replace(/[^0-9]/g, "")) || 0;
}

export default async function EventosPage({ searchParams }: PageProps<"/eventos">) {
  const params = await searchParams;
  const q = typeof params?.q === "string" ? params.q : "";
  const rawCategory = typeof params?.category === "string" ? params.category : "";
  const category = rawCategory === "todas" ? "" : rawCategory;
  const city = typeof params?.city === "string" ? params.city : "Santiago";
  const sort = typeof params?.sort === "string" ? params.sort : "proximos";
  const minPrice = typeof params?.minPrice === "string" ? Number(params.minPrice) : undefined;
  const maxPrice = typeof params?.maxPrice === "string" ? Number(params.maxPrice) : undefined;
  const onlyAvailable = params?.available !== "false";

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
  if (minPrice) {
    results = results.filter((event) => parsePrice(event.price) >= minPrice);
  }
  if (maxPrice) {
    results = results.filter((event) => parsePrice(event.price) <= maxPrice);
  }
  if (sort === "precio-asc") {
    results = [...results].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
  } else if (sort === "precio-desc") {
    results = [...results].sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
  }

  const hasActiveFilters = Boolean(category || (city && city !== "Santiago") || minPrice || maxPrice || !onlyAvailable);

  return (
    <>
      <Header />
      <main>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
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
          </div>
          <div className={styles.heroBadge} aria-hidden="true">
            <span className={styles.heroBracket}>[</span>
            <span className={styles.heroHeart}>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 21s-6.716-4.35-9.428-8.09C.94 10.49 1.2 7.36 3.6 5.6a5.5 5.5 0 0 1 7.2.66l1.2 1.24 1.2-1.24a5.5 5.5 0 0 1 7.2-.66c2.4 1.76 2.66 4.89 1.03 7.31C18.716 16.65 12 21 12 21z" />
              </svg>
            </span>
            <span className={styles.heroBracket}>]</span>
            <span className={styles.heroTagline}>La vida se vive aquí.</span>
          </div>
        </section>

        <section className={styles.resultsSection}>
          <div className={styles.layout}>
            <aside className={styles.sidebar}>
              <div className={styles.sidebarHeader}>
                <h2>Filtros</h2>
                {hasActiveFilters && (
                  <Link href="/eventos" className={styles.clearFilters}>
                    Limpiar filtros
                  </Link>
                )}
              </div>
              <form className={styles.filterForm} action="/eventos" method="get">
                {q && <input type="hidden" name="q" value={q} />}
                {sort !== "proximos" && <input type="hidden" name="sort" value={sort} />}

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

                <div className={styles.filterField}>
                  <span>Precio</span>
                  <div className={styles.priceRow}>
                    <input
                      type="number"
                      name="minPrice"
                      min={0}
                      defaultValue={minPrice || ""}
                      placeholder="Mínimo"
                      inputMode="numeric"
                    />
                    <span className={styles.priceDash}>–</span>
                    <input
                      type="number"
                      name="maxPrice"
                      min={0}
                      defaultValue={maxPrice || ""}
                      placeholder="Máximo"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <label className={styles.filterToggleRow}>
                  <span>Solo disponibles</span>
                  <span className={styles.toggleSwitch}>
                    <input type="checkbox" name="available" value="true" defaultChecked={onlyAvailable} />
                    <span className={styles.toggleTrack} aria-hidden="true">
                      <span className={styles.toggleThumb} />
                    </span>
                  </span>
                </label>

                <button type="submit" className={styles.filterApply}>
                  Aplicar filtros
                </button>
              </form>
            </aside>

            <div className={styles.content}>
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
                <SortSelect defaultValue={sort} />
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

              {results.length > 0 && (
                <nav className={styles.pagination} aria-label="Paginación">
                  <button type="button" className={styles.pageArrow} aria-label="Página anterior" disabled>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M15.75 19.5 8.25 12l7.5-7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button type="button" className={`${styles.pageNumber} ${styles.pageNumberActive}`}>
                    1
                  </button>
                  <button type="button" className={styles.pageArrow} aria-label="Página siguiente" disabled>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="m8.25 4.5 7.5 7.5-7.5 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </nav>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
