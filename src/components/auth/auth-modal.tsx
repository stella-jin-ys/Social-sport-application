"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { clearPendingJoin, readPendingJoin } from "@/lib/pending-join";

export function AuthModal() {
  const [variant, setVariant] = useState<"sign-in" | "sign-up">("sign-in");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const preservesPendingJoin = useRef(false);
  const pendingCleanup = useRef<number | null>(null);
  const router = useRouter();

  function closeModal() {
    dialogRef.current?.close();
    clearPendingJoin();
    router.back();
  }

  async function completePendingJoin() {
    const intent = readPendingJoin();

    if (!intent) {
      dialogRef.current?.close();
      router.back();
      router.refresh();
      return;
    }

    preservesPendingJoin.current = true;
    dialogRef.current?.close();
    window.location.replace(intent.returnTo);
  }

  useEffect(() => {
    if (pendingCleanup.current !== null) {
      window.clearTimeout(pendingCleanup.current);
      pendingCleanup.current = null;
    }
    dialogRef.current?.showModal();

    return () => {
      if (!preservesPendingJoin.current) {
        pendingCleanup.current = window.setTimeout(clearPendingJoin);
      }
    };
  }, []);

  return (
    <dialog aria-labelledby="auth-modal-title" onCancel={(event) => {
      event.preventDefault();
      closeModal();
    }} ref={dialogRef}>
      <h1 id="auth-modal-title">Join group</h1>
      <button aria-label="Close" onClick={closeModal} type="button">Close</button>
      <AuthForm onAuthenticated={completePendingJoin} variant={variant} />
      <button onClick={() => setVariant((current) => current === "sign-in" ? "sign-up" : "sign-in")} type="button">
        {variant === "sign-in" ? "Create an account" : "Sign in instead"}
      </button>
    </dialog>
  );
}
