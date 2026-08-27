"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { joinGroupAction } from "@/app/groups/[slug]/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { clearPendingJoin, readPendingJoin, setJoinError } from "@/lib/pending-join";

export function AuthModal() {
  const [variant, setVariant] = useState<"sign-in" | "sign-up">("sign-in");
  const dialogRef = useRef<HTMLDialogElement>(null);
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

    const result = await joinGroupAction(intent.groupSlug);
    clearPendingJoin();
    if (!result.ok) setJoinError(result.message);
    dialogRef.current?.close();
    router.back();
    router.refresh();
  }

  useEffect(() => {
    dialogRef.current?.showModal();

    return () => clearPendingJoin();
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
