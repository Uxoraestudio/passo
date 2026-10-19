import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Caveat } from "next/font/google";
import { getSiteSettings } from "@/lib/site-settings";
import PageTranslator from "@/components/PageTranslator";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const caveat = Caveat({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  // The favicon and isotype uploaded in the admin (Apariencia); /favicon.ico in public/ is the fallback.
  const icon = [
    ...(settings.logoFaviconUrl ? [{ url: settings.logoFaviconUrl, type: "image/png", sizes: "32x32" }] : []),
    ...(settings.logoIsotypeUrl ? [{ url: settings.logoIsotypeUrl, type: "image/svg+xml", sizes: "any" }] : []),
  ];
  return {
    title: "Aforiq",
    description: "Tu lugar en lo extraordinario. Entradas digitales, seguras y al instante.",
    icons: icon.length ? { icon, shortcut: settings.logoFaviconUrl ?? undefined } : { icon: "/favicon.ico" },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSiteSettings();

  const overrides = Object.entries({
    "--color-purple": settings.colorPrimary,
    "--color-orange": settings.colorSecondary,
    "--background": settings.colorBgLight,
    "--foreground": settings.colorTextPrimary,
  })
    .filter(([, value]) => value)
    .map(([token, value]) => `${token}: ${value};`)
    .join(" ");

  return (
    <html lang="es" className={`${plusJakartaSans.variable} ${caveat.variable}`}>
      <head>{overrides && <style>{`:root { ${overrides} }`}</style>}</head>
      <body>
        {children}
        <PageTranslator />
      </body>
    </html>
  );
}
