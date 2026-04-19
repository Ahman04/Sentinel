// app/page.tsx — Root route. Redirects to /dashboard.
// Middleware will intercept unauthenticated requests and send them to /login.

import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
