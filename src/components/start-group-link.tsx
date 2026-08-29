"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function StartGroupLink({ className = "" }: { className?: string }) {
  const { data } = authClient.useSession();
  const href = data?.user ? "/groups/new" : "/sign-in?returnTo=%2Fgroups%2Fnew";

  return <Link className={className} href={href}>Start a group</Link>;
}
