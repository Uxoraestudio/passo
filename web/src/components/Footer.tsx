import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";
import NewsletterForm from "./NewsletterForm";
import styles from "./Footer.module.css";

const exploreLinks = [
  { label: "Eventos", href: "/eventos" },
  { label: "Ciudades", href: "/eventos" },
  { label: "Categorías", href: "/eventos" },
  { label: "Ayuda", href: "/proximamente?title=Ayuda" },
];
const aboutLinks = [
  { label: "Nosotros", href: "/proximamente?title=Nosotros" },
  { label: "Para organizadores", href: "/organizadores" },
  { label: "Trabaja con nosotros", href: "/proximamente?title=Trabaja%20con%20nosotros" },
  { label: "Prensa", href: "/proximamente?title=Prensa" },
];
const legalLinks = [
  { label: "Términos y condiciones", href: "/proximamente?title=Términos%20y%20condiciones" },
  { label: "Política de privacidad", href: "/proximamente?title=Política%20de%20privacidad" },
  { label: "Política de cookies", href: "/proximamente?title=Política%20de%20cookies" },
  { label: "Centro de ayuda", href: "/proximamente?title=Centro%20de%20ayuda" },
];

const socials = [
  {
    name: "Instagram",
    path: "M10 1.8025C12.67 1.8025 12.9867 1.8125 14.0417 1.86083C16.7517 1.98417 18.0175 3.27 18.1408 5.96C18.1892 7.01417 18.1983 7.33083 18.1983 10.0008C18.1983 12.6717 18.1883 12.9875 18.1408 14.0417C18.0167 16.7292 16.7542 18.0175 14.0417 18.1408C12.9867 18.1892 12.6717 18.1992 10 18.1992C7.33 18.1992 7.01333 18.1892 5.95917 18.1408C3.2425 18.0167 1.98333 16.725 1.86 14.0408C1.81167 12.9867 1.80167 12.6708 1.80167 10C1.80167 7.33 1.8125 7.01417 1.86 5.95917C1.98417 3.27 3.24667 1.98333 5.95917 1.86C7.01417 1.8125 7.33 1.8025 10 1.8025V1.8025M10 0C7.28417 0 6.94417 0.0116667 5.8775 0.06C2.24583 0.226667 0.2275 2.24167 0.0608333 5.87667C0.0116667 6.94417 0 7.28417 0 10C0 12.7158 0.0116667 13.0567 0.06 14.1233C0.226667 17.755 2.24167 19.7733 5.87667 19.94C6.94417 19.9883 7.28417 20 10 20C12.7158 20 13.0567 19.9883 14.1233 19.94C17.7517 19.7733 19.775 17.7583 19.9392 14.1233C19.9883 13.0567 20 12.7158 20 10C20 7.28417 19.9883 6.94417 19.94 5.8775C19.7767 2.24917 17.7592 0.2275 14.1242 0.0608333C13.0567 0.0116667 12.7158 0 10 0V0M10 4.865C7.16417 4.865 4.865 7.16417 4.865 10C4.865 12.8358 7.16417 15.1358 10 15.1358C12.8358 15.1358 15.135 12.8367 15.135 10C15.135 7.16417 12.8358 4.865 10 4.865V4.865M10 13.3333C8.15917 13.3333 6.66667 11.8417 6.66667 10C6.66667 8.15917 8.15917 6.66667 10 6.66667C11.8408 6.66667 13.3333 8.15917 13.3333 10C13.3333 11.8417 11.8408 13.3333 10 13.3333V13.3333M15.3383 3.4625C14.675 3.4625 14.1375 4 14.1375 4.6625C14.1375 5.325 14.675 5.8625 15.3383 5.8625C16.0008 5.8625 16.5375 5.325 16.5375 4.6625C16.5375 4 16.0008 3.4625 15.3383 3.4625V3.4625",
  },
  {
    name: "TikTok",
    path: "M16.325 5.575C14.6208 5.20024 13.3522 3.77008 13.1833 2.03333V1.66667H10.3083V13.0583C10.1451 14.257 9.11803 15.1485 7.90833 15.1417C6.57825 15.1417 5.5 14.0634 5.5 12.7333C5.5 11.4032 6.57825 10.325 7.90833 10.325C8.14167 10.325 8.35833 10.3583 8.56667 10.4083V7.50833C8.34831 7.48072 8.12843 7.46681 7.90833 7.46667C4.99043 7.46667 2.625 9.8321 2.625 12.75C2.625 15.6679 4.99043 18.0333 7.90833 18.0333C10.823 18.0287 13.1833 15.6647 13.1833 12.75V7.24167C14.3434 8.06894 15.7335 8.51192 17.1583 8.50833V5.63333C16.2917 5.63333 15.4667 5.31667 14.825 5.575H16.325",
  },
  {
    name: "YouTube",
    path: "M10 0C4.4775 0 0 4.4775 0 10C0 15.5225 4.4775 20 10 20C15.5225 20 20 15.5225 20 10C20 4.4775 15.5225 0 10 0V0M14.6008 14.45C14.4008 14.7492 14.0508 14.85 13.75 14.65C11.4 13.2 8.45 12.8992 4.94917 13.6992C4.60083 13.8008 4.3 13.55 4.2 13.25C4.1 12.8992 4.35 12.6 4.65 12.5C8.45 11.6492 11.75 12 14.35 13.6C14.7 13.75 14.7492 14.1492 14.6008 14.45V14.45M15.8008 11.7C15.55 12.05 15.1 12.2 14.7492 11.95C12.05 10.3 7.95 9.8 4.8 10.8C4.40083 10.9 3.95 10.7 3.85 10.3C3.75 9.9 3.95 9.44917 4.35 9.34917C8 8.25 12.5 8.80083 15.6 10.7C15.9008 10.8508 16.05 11.35 15.8008 11.7V11.7M15.9008 8.9C12.7 7 7.35 6.8 4.3 7.75083C3.8 7.9 3.3 7.6 3.15 7.15C3 6.64917 3.3 6.15 3.75 5.99917C7.3 4.94917 13.15 5.14917 16.8508 7.35C17.3 7.6 17.45 8.2 17.2 8.65C16.9508 9.00083 16.35 9.14917 15.9008 8.9V8.9",
  },
  {
    name: "Spotify",
    path: "M9.33333 3.33333L14 8M14 8L9.33333 12.6667M14 8H2",
  },
];

export default async function Footer() {
  const settings = await getSiteSettings();
  const darkLogo = settings.logoDarkUrl ?? settings.logoPrimaryUrl;

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brandCol}>
            <Link href="/" className={styles.logo}>
              {darkLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={darkLogo} alt="Passo" className={styles.logoImage} />
              ) : (
                "passo"
              )}
            </Link>
            <p className={styles.tagline}>
              TU LUGAR EN LO
              <br />
              EXTRAORDINARIO.
            </p>
            <div className={styles.socials}>
              {socials.map((social) => (
                <a
                  key={social.name}
                  href="#"
                  aria-label={social.name}
                  title={social.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                >
                  <svg viewBox="0 0 20 20" fill="white" aria-hidden="true">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
          <div className={styles.col}>
            <h4>Explora</h4>
            <ul>
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.col}>
            <h4>Sobre AFORIQ</h4>
            <ul>
              {aboutLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.col}>
            <h4>Legal</h4>
            <ul>
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.newsletterCol}>
            <h4>Sé parte de lo extraordinario</h4>
            <p>
              Recibe novedades, eventos y experiencias
              <br />
              exclusivas en tu correo.
            </p>
            <NewsletterForm />
          </div>
        </div>
        <div className={styles.bottom}>
          <p className={styles.copyright}>© 2025 PASSO. Todos los derechos reservados.</p>
          <p className={styles.signature}>La vida se vive aquí.</p>
        </div>
      </div>
    </footer>
  );
}
