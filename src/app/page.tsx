import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6">
      <h1 className="text-4xl font-semibold">Find your next sports group</h1>
      <p>Discover a community, join a weekly activity, and keep every update together.</p>
      <Link className="rounded-full bg-slate-950 px-5 py-3 text-center text-white" href="/discover">
        Discover groups
      </Link>
    </main>
  );
}
