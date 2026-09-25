import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Caveat } from "next/font/google";
import { getSiteSettings } from "@/lib/site-settings";
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

export const metadata: Metadata = {
  title: "Passo",
  description: "Tu lugar en lo extraordinario. Entradas digitales, seguras y al instante.",
};

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
      <body>{children}</body>
    </html>
  );
}
