import { redirect } from "next/navigation";

// The admin has no landing page: go straight to the dashboard (AuthGuard sends
// visitors who aren't signed in to /login-admin/).
export default function Home() {
  redirect("/inicio/");
}
