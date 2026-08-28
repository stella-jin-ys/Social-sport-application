import { Suspense } from "react";
import { AuthModal } from "@/components/auth/auth-modal";

export default function SignInModalPage() {
  return <Suspense fallback={null}><AuthModal /></Suspense>;
}
