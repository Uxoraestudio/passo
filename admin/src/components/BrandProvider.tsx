"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Brand } from "@/lib/brand";

const BrandContext = createContext<Brand>({ logo: null, logoDark: null, isotype: null, favicon: null });

export function BrandProvider({ brand, children }: { brand: Brand; children: ReactNode }) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export const useBrand = () => useContext(BrandContext);

/** The site's logo for dark backgrounds, or the name in text while none is uploaded. */
export function BrandLogo({ className, imageClassName }: { className?: string; imageClassName?: string }) {
  const { logoDark } = useBrand();
  if (!logoDark) return <span className={className}>aforiq</span>;
  // eslint-disable-next-line @next/next/no-img-element -- remote SVG from Supabase Storage
  return <img src={logoDark} alt="Aforiq" className={imageClassName} />;
}
