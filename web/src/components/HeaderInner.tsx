"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SearchBar from "./SearchBar";
import LanguageSwitcher from "./LanguageSwitcher";
import CategoriesMenu from "./CategoriesMenu";
import styles from "./Header.module.css";

const SCROLL_THRESHOLD = 24;

export default function HeaderInner({ logoUrl }: { logoUrl: string | null }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className={styles.header} data-scrolled={scrolled}>
        <div className={styles.container}>
          <div className={styles.left}>
            <Link href="/" className={styles.logo}>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Passo" className={styles.logoImage} />
              ) : (
                "passo"
              )}
            </Link>
            <nav className={styles.nav}>
              <CategoriesMenu />
              <Link href="#" className={styles.navLink}>
                Ayuda
              </Link>
            </nav>
          </div>
          <div className={styles.right}>
            <div className={styles.categoriesMobile}>
              <CategoriesMenu compact />
            </div>
            <SearchBar compact={scrolled} />
            <LanguageSwitcher />
            <Link href="/login-usuario/" className={styles.accountButton} aria-label="Iniciar sesión">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M4.75 19c1.2-3.2 4.1-5 7.25-5s6.05 1.8 7.25 5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </header>
      <div className={styles.spacer} aria-hidden="true" />
    </>
  );
}
