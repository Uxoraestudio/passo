import { redirect } from "next/navigation";

// Las cortesías y la prensa ahora se emiten dentro de cada evento; la ruta se mantiene para enlaces antiguos.
export default function EntradasPage() {
  redirect("/eventos/");
}
