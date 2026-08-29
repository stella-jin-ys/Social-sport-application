"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { clearPendingJoin, readPendingJoin } from "@/lib/pending-join";

export function AuthModal() {
  const [variant, setVariant] = useState<"sign-in" | "sign-up">("sign-in");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
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
    headingRef.current?.focus();

    return () => {
      if (!preservesPendingJoin.current) {
        pendingCleanup.current = window.setTimeout(clearPendingJoin);
      }
    };
  }, []);

  return (
    <dialog aria-labelledby="auth-modal-title" className="auth-modal" onCancel={(event) => {
      event.preventDefault();
      closeModal();
    }} ref={dialogRef}>
      <div className="auth-modal__header">
        <h1 className="font-display" id="auth-modal-title" ref={headingRef} tabIndex={-1}>Join group</h1>
        <button aria-label="Close" className="auth-modal__close" onClick={closeModal} type="button">Close</button>
      </div>
      <p className="auth-modal__intro">Sign in to join this group and respond to upcoming sessions.</p>
      <AuthForm onAuthenticated={completePendingJoin} variant={variant} />
      <div className="auth-modal__switch">
        <span>{variant === "sign-in" ? "New to Sportship?" : "Already have an account?"}</span>
        <button onClick={() => setVariant((current) => current === "sign-in" ? "sign-up" : "sign-in")} type="button">
          {variant === "sign-in" ? "Create an account" : "Sign in instead"}
        </button>
      </div>
    </dialog>
  );
}
