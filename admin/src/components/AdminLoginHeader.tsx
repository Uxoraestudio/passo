import Link from "next/link";
import styles from "./AdminLoginHeader.module.css";

export default function AdminLoginHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          passo
        </Link>
        <p className={styles.helpHint}>
          ¿Necesitas credenciales? <a href="#">Solicitar acceso a TI</a>
        </p>
      </div>
    </header>
  );
}
