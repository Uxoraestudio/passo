import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";
import SearchBar from "./SearchBar";
import styles from "./Header.module.css";

const navLinks = [
  { label: "Eventos", href: "/eventos" },
  { label: "Ciudades", href: "#" },
  { label: "Categorías", href: "#" },
  { label: "Ayuda", href: "#" },
];

export default async function Header() {
  const settings = await getSiteSettings();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Link href="/" className={styles.logo}>
            {settings.logoPrimaryUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoPrimaryUrl} alt="Passo" className={styles.logoImage} />
            ) : (
              "passo"
            )}
          </Link>
          <nav className={styles.nav}>
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className={styles.navLink}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className={styles.right}>
          <SearchBar />
          <Link href="/login-usuario/" className={styles.accountButton} aria-label="Mi cuenta">
            <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M12.25 12.25L9.7125 9.7125M9.7125 6.41667C9.7125 8.23569 8.23569 9.7125 6.41667 9.7125C4.59765 9.7125 3.12083 8.23569 3.12083 6.41667C3.12083 4.59765 4.59765 3.12083 6.41667 3.12083C8.23569 3.12083 9.7125 4.59765 9.7125 6.41667L12.25 12.25"
                stroke="#374151"
                strokeWidth="1.45833"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link href="/login-usuario/" className={styles.loginButton}>
            Iniciar sesión
          </Link>
        </div>
      </div>
    </header>
  );
}
