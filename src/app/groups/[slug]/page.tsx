import Link from "next/link";
import { GroupDetail } from "./group-detail";
import { getCurrentUser } from "@/lib/current-user";
import { getGroupPageData } from "@/modules/groups/group-queries";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const group = await getGroupPageData(slug, user?.id);

  if (!group) return <GroupNotFound />;

  return <GroupDetail group={group} />;
}

function GroupNotFound() {
  return (
    <main className="min-h-[100dvh] bg-[var(--paper)] px-5 py-16 text-center text-[var(--ink)]">
      <h1 className="font-display text-5xl font-black tracking-[-0.06em]">Group not found</h1>
      <p className="mx-auto mt-4 max-w-md text-[var(--muted)]">This group may have moved or is no longer public.</p>
      <Link className="mt-7 inline-block rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-extrabold text-[var(--accent-foreground)]" href="/discover">Browse public groups</Link>
    </main>
  );
}
