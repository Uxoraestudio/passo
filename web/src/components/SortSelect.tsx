"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "@/app/eventos/page.module.css";

const options = [
  { value: "proximos", label: "Más próximos" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
];

export default function SortSelect({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "proximos") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className={styles.sortSelectWrap}>
      <select
        defaultValue={defaultValue}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Ordenar eventos"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
