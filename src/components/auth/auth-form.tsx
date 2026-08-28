"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export type AuthFormProps = {
  variant: "sign-in" | "sign-up";
  onAuthenticated?: () => Promise<void>;
};

function localReturnPath(returnTo: string | null) {
  return returnTo?.startsWith("/") && !returnTo.startsWith("//") && !returnTo.includes("\\") ? returnTo : "/";
}

export function AuthForm({ variant, onAuthenticated }: AuthFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignUp = variant === "sign-up";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);
    const retryMessage = isSignUp
      ? "Unable to create your account. Please try again."
      : "Unable to sign in. Please try again.";

    try {
      const result = isSignUp
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(result.error.message ?? retryMessage);
        return;
      }

      if (onAuthenticated) {
        await onAuthenticated();
        return;
      }

      router.push(localReturnPath(searchParams.get("returnTo")));
    } catch {
      setError(retryMessage);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <section className="auth-form">
      <h1 className="auth-form__title">{isSignUp ? "Create an account" : "Sign in"}</h1>
      <form className="auth-form__fields" onSubmit={handleSubmit}>
        {isSignUp ? (
          <label>
            <span>Name</span>
            <input name="name" onChange={(event) => setName(event.target.value)} required value={name} />
          </label>
        ) : null}
        <label>
          <span>Email</span>
          <input name="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
        </label>
        <label>
          <span>Password</span>
          <input name="password" minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
        </label>
        {error ? <p className="auth-form__error" role="alert">{error}</p> : null}
        <button disabled={isPending} type="submit">{isPending ? "Please wait…" : isSignUp ? "Sign up" : "Sign in"}</button>
      </form>
    </section>
  );
}
