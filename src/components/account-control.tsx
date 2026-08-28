"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function accountInitials(name: string, email: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words.at(-1)?.[0] ?? ""}`.toUpperCase();
  }

  const source = words[0] ?? email.split("@", 1)[0] ?? "";
  return source.slice(0, 2).toUpperCase();
}

export function AccountControl() {
  const { data, isPending } = authClient.useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const controlRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const user = data?.user;

  useEffect(() => {
    if (!isOpen) return;

    function dismiss(event: PointerEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent && event.key === "Escape") {
        setIsOpen(false);
      }

      if (event instanceof PointerEvent && !controlRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", dismiss);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", dismiss);
    };
  }, [isOpen]);

  async function signOut() {
    setError("");
    setIsSigningOut(true);

    try {
      const result = await authClient.signOut();
      if (result.error) throw result.error;
      setIsOpen(false);
      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  if (isPending) {
    return <span aria-hidden="true" className="account-control__skeleton" />;
  }

  if (!user) {
    return <Link className="account-control__sign-in" href="/sign-in">Sign in</Link>;
  }

  return (
    <div className="account-control" ref={controlRef}>
      <button
        aria-controls="account-dropdown"
        aria-expanded={isOpen}
        aria-label="Open account menu"
        className="account-control__avatar"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        {accountInitials(user.name ?? "", user.email ?? "")}
      </button>
      {isOpen ? (
        <section aria-label="Account details" className="account-control__details" id="account-dropdown">
          <p className="account-control__name">{user.name}</p>
          <p className="account-control__email">{user.email}</p>
          {error ? <p className="account-control__error" role="alert">{error}</p> : null}
          <button className="account-control__sign-out" disabled={isSigningOut} onClick={signOut} type="button">
            {isSigningOut ? "Signing out…" : "Sign out"}
          </button>
        </section>
      ) : null}
    </div>
  );
}
