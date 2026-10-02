import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";
import styles from "./LoginHeader.module.css";

export default async function LoginHeader({ next = null }: { next?: string | null }) {
  const settings = await getSiteSettings();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          {settings.logoPrimaryUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoPrimaryUrl} alt="Passo" className={styles.logoImage} />
          ) : (
            "passo"
          )}
        </Link>
        <p className={styles.signupHint}>
          ¿No tienes cuenta? <a href={next ? `/registro/?next=${encodeURIComponent(next)}` : "/registro/"}>Crear cuenta</a>
        </p>
      </div>
    </header>
  );
}
