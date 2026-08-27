import Link from "next/link";
import { GroupActions } from "./group-actions";
import { getCurrentUser } from "@/lib/current-user";
import type { GroupPageData } from "@/modules/groups/contracts";
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

function GroupDetail({ group }: { group: GroupPageData }) {
  return (
    <main className="min-h-[100dvh] bg-[var(--paper)] text-[var(--ink)]">
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link className="font-display text-[1.65rem] font-black tracking-[-0.08em]" href="/">
          huddle<span className="text-[var(--accent-strong)]">.</span>
        </Link>
        <div className="flex items-center gap-3 text-sm font-bold">
          <Link className="hidden px-3 py-2 text-[var(--muted)] transition-colors hover:text-[var(--ink)] sm:block" href="/discover">Discover</Link>
          <Link className="rounded-full bg-[var(--accent)] px-4 py-2.5 text-[var(--accent-foreground)] transition-transform hover:-translate-y-0.5" href="/sign-up">Start a group</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-[1400px] px-5 pb-16 pt-8 sm:px-8 lg:px-12 lg:pb-24 lg:pt-12">
        <Link className="text-sm font-extrabold text-[var(--accent-strong)] underline decoration-2 underline-offset-4" href="/discover">← Back to groups</Link>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-stretch">
          <div className="rounded-[1.75rem] border border-[var(--line-strong)] bg-[var(--surface)] p-7 sm:p-10 lg:p-12">
            <span className="inline-block rounded-full px-3 py-1.5 text-sm font-extrabold" style={{ backgroundColor: group.accent, color: group.tone }}>{group.sport}</span>
            <h1 className="mt-8 font-display text-5xl font-black leading-[0.94] tracking-[-0.07em] sm:text-7xl">{group.name}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">{group.description}</p>

            <dl className="mt-10 grid gap-5 border-t border-[var(--line)] pt-7 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--muted)]">Where</dt>
                <dd className="mt-2 font-extrabold">{group.location}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--muted)]">Who</dt>
                <dd className="mt-2 font-extrabold">{group.audience}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--muted)]">Rhythm</dt>
                <dd className="mt-2 font-extrabold">{group.schedule}</dd>
              </div>
            </dl>
          </div>

          <aside className="flex flex-col justify-between rounded-[1.75rem] border border-[var(--line-strong)] bg-[var(--surface-muted)] p-7 sm:p-9">
            <GroupActions
              attendanceStatus={group.viewer.attendanceStatus}
              groupSlug={group.slug}
              isAuthenticated={group.viewer.isAuthenticated}
              isMember={group.viewer.isMember}
              memberCount={group.memberCount}
              nextTraining={group.nextTraining}
              organizer={group.organizer}
              scope="membership"
            />
          </aside>
        </section>

        <GroupActions
          attendanceStatus={group.viewer.attendanceStatus}
          groupSlug={group.slug}
          isAuthenticated={group.viewer.isAuthenticated}
          isMember={group.viewer.isMember}
          memberCount={group.memberCount}
          nextTraining={group.nextTraining}
          scope="attendance"
        />
      </div>
    </main>
  );
}
