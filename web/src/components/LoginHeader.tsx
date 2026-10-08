import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";
import styles from "./LoginHeader.module.css";

type Hint = { text: string; linkLabel: string; href: string };

export default async function LoginHeader({ next = null, hint }: { next?: string | null; hint?: Hint }) {
  const { text, linkLabel, href } = hint ?? {
    text: "¿No tienes cuenta?",
    linkLabel: "Crear cuenta",
    href: next ? `/registro/?next=${encodeURIComponent(next)}` : "/registro/",
  };
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
          {text} <a href={href}>{linkLabel}</a>
        </p>
      </div>
    </header>
  );
}
