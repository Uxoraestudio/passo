import type { Metadata } from "next";
import { BrandProvider } from "@/components/BrandProvider";
import { getBrand } from "@/lib/brand";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  // The favicon and isotype uploaded in Apariencia; /favicon.ico in public/ is the fallback.
  const icon = [
    ...(brand.favicon ? [{ url: brand.favicon, type: "image/png", sizes: "32x32" }] : []),
    ...(brand.isotype ? [{ url: brand.isotype, type: "image/svg+xml", sizes: "any" }] : []),
  ];
  return {
    title: "Aforiq Admin",
    description: "Panel administrativo de Aforiq.",
    icons: icon.length ? { icon, shortcut: brand.favicon ?? undefined } : { icon: "/favicon.ico" },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const brand = await getBrand();
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Caveat:wght@700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <BrandProvider brand={brand}>{children}</BrandProvider>
      </body>
    </html>
  );
}
