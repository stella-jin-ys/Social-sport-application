import Link from "next/link";
import { AccountControl } from "@/components/account-control";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6">
      <nav className="flex items-center justify-between gap-3">
        <Link className="text-lg font-semibold" href="/">
          Huddle
        </Link>
        <div className="flex items-center gap-3 text-sm font-bold">
          <AccountControl />
          <Link className="rounded-full bg-slate-950 px-4 py-2 text-white" href="/sign-up">Start a group</Link>
        </div>
      </nav>
      <h1 className="text-4xl font-semibold">Find your next sports group</h1>
      <p>Discover a community, join a weekly activity, and keep every update together.</p>
      <Link className="rounded-full bg-slate-950 px-5 py-3 text-center text-white" href="/discover">
        Discover groups
      </Link>
    </main>
  );
}
