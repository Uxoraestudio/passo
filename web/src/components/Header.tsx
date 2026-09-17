import Link from "next/link";
import styles from "./Header.module.css";

const navLinks = ["Eventos", "Ciudades", "Categorías", "Ayuda"];

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Link href="/" className={styles.logo}>
            passo
          </Link>
          <nav className={styles.nav}>
            {navLinks.map((link) => (
              <a key={link} href="#" className={styles.navLink}>
                {link}
              </a>
            ))}
          </nav>
        </div>
        <div className={styles.right}>
          <div className={styles.search}>
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M14 14L11.1 11.1M11.1 7.33333C11.1 9.41221 9.41221 11.1 7.33333 11.1C5.25445 11.1 3.56667 9.41221 3.56667 7.33333C3.56667 5.25445 5.25445 3.56667 7.33333 3.56667C9.41221 3.56667 11.1 5.25445 11.1 7.33333L14 14"
                stroke="#9CA3AF"
                strokeWidth="1.46667"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="text"
              placeholder="Busca artistas, eventos o ciudades"
              className={styles.searchInput}
            />
            <button type="button" className={styles.searchButton} aria-label="Buscar">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M13.3333 5.83333C13.3333 7.67305 11.8397 9.16667 10 9.16667C8.16028 9.16667 6.66667 7.67305 6.66667 5.83333C6.66667 3.99362 8.16028 2.5 10 2.5C11.8397 2.5 13.3333 3.99362 13.3333 5.83333V5.83333M10 11.6667C6.7805 11.6667 4.16667 14.2805 4.16667 17.5H15.8333C15.8333 14.2805 13.2195 11.6667 10 11.6667V11.6667"
                  stroke="white"
                  strokeWidth="1.83333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <button type="button" className={styles.accountButton} aria-label="Mi cuenta">
            <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M12.25 12.25L9.7125 9.7125M9.7125 6.41667C9.7125 8.23569 8.23569 9.7125 6.41667 9.7125C4.59765 9.7125 3.12083 8.23569 3.12083 6.41667C3.12083 4.59765 4.59765 3.12083 6.41667 3.12083C8.23569 3.12083 9.7125 4.59765 9.7125 6.41667L12.25 12.25"
                stroke="#374151"
                strokeWidth="1.45833"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <a href="#" className={styles.loginButton}>
            Iniciar sesión
          </a>
        </div>
      </div>
    </header>
  );
}
