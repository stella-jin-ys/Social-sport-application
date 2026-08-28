import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="auth-page">
      <Link aria-label="Huddle home" className="auth-page__home font-display" href="/">
        huddle<span>.</span>
      </Link>
      <div className="auth-page__card">{children}</div>
    </main>
  );
}
