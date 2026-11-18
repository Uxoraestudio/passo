"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { FaqCategory } from "@/lib/faqs";
import styles from "./FaqBrowser.module.css";

const ALL = "todas";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function FaqBrowser({ categories }: { categories: FaqCategory[] }) {
  const [active, setActive] = useState(ALL);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  // Deep links like /preguntas-frecuentes/#olvide-contrasena open that answer.
  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (!hash) return;
    const category = categories.find((c) => c.id === hash || c.faqs.some((f) => f.id === hash));
    if (!category) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the hash is only readable after mount
    setActive(category.id);
    if (category.id !== hash) setOpenId(hash);
    window.setTimeout(() => document.getElementById(hash)?.scrollIntoView({ block: "center" }), 50);
  }, [categories]);

  const term = normalize(query.trim());
  const visible = useMemo(() => {
    return categories
      .filter((c) => term || active === ALL || c.id === active)
      .map((c) => ({
        ...c,
        faqs: term ? c.faqs.filter((f) => normalize(`${f.q} ${f.a.join(" ")}`).includes(term)) : c.faqs,
      }))
      .filter((c) => c.faqs.length > 0);
  }, [categories, active, term]);

  const total = visible.reduce((n, c) => n + c.faqs.length, 0);

  return (
    <div className={styles.wrap}>
      <div className={styles.searchRow}>
        <label className={styles.search}>
          <span className={styles.srOnly}>Buscar una pregunta</span>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-4.2-4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca tu duda…"
            autoComplete="off"
          />
        </label>
      </div>

      <div className={styles.layout}>
        <nav className={styles.categories} aria-label="Temas">
          <button type="button" className={styles.chip} aria-pressed={!term && active === ALL} onClick={() => { setActive(ALL); setQuery(""); }}>
            Todas
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={styles.chip}
              aria-pressed={!term && active === c.id}
              onClick={() => {
                setActive(c.id);
                setQuery("");
              }}
            >
              {c.label}
              <span className={styles.count}>{c.faqs.length}</span>
            </button>
          ))}
        </nav>

        <div className={styles.results} aria-live="polite">
          {term && (
            <p className={styles.resultNote}>
              {total === 0 ? "Sin resultados" : `${total} ${total === 1 ? "resultado" : "resultados"}`} para «{query.trim()}»
            </p>
          )}

          {visible.length === 0 ? (
            <div className={styles.empty}>
              <p>No encontramos una pregunta con esas palabras.</p>
              <Link href="/contacto/">Escríbenos tu consulta →</Link>
            </div>
          ) : (
            visible.map((c) => (
              <section key={c.id} id={c.id} className={styles.group} aria-labelledby={`${c.id}-title`}>
                <header className={styles.groupHeader}>
                  <h2 id={`${c.id}-title`}>{c.label}</h2>
                  <p>{c.summary}</p>
                </header>
                <div className={styles.list}>
                  {c.faqs.map((f) => (
                    <details
                      key={f.id}
                      id={f.id}
                      className={styles.item}
                      open={openId === f.id || Boolean(term)}
                      onToggle={(e) => {
                        const isOpen = (e.currentTarget as HTMLDetailsElement).open;
                        if (isOpen) setOpenId(f.id);
                        else if (openId === f.id) setOpenId(null);
                      }}
                    >
                      <summary>
                        <span>{f.q}</span>
                        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                          <path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </summary>
                      <div className={styles.answer}>
                        {f.a.map((p) => (
                          <p key={p.slice(0, 32)}>{p}</p>
                        ))}
                        {f.links && (
                          <div className={styles.links}>
                            {f.links.map((l) => (
                              <Link key={l.href} href={l.href}>
                                {l.label} →
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
