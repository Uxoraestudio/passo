import Link from "next/link";
import styles from "./LoginHeader.module.css";

export default function LoginHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          passo
        </Link>
        <p className={styles.signupHint}>
          ¿No tienes cuenta? <a href="#">Crear cuenta</a>
        </p>
      </div>
    </header>
  );
}
