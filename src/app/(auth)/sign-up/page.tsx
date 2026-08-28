import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignUpPage() {
  return <Suspense fallback={null}><AuthForm variant="sign-up" /></Suspense>;
}
