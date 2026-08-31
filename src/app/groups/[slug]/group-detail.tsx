import Link from "next/link";
import { AccountControl } from "@/components/account-control";
import { StartGroupLink } from "@/components/start-group-link";
import { GroupActions } from "./group-actions";
import { GroupComments } from "./group-comments";
import type { GroupPageData } from "@/modules/groups/contracts";

export function GroupDetail({ group }: { group: GroupPageData }) {
  return (
    <main className="min-h-[100dvh] bg-[var(--paper)] text-[var(--ink)]">
      <nav className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-5 py-5 sm:px-8 lg:grid lg:grid-cols-[1fr_minmax(30rem,34rem)_1fr] lg:px-12">
        <Link className="font-display text-[1.65rem] font-black tracking-[-0.08em] lg:justify-self-start" href="/">
          Sportship<span className="text-[var(--accent-strong)]">.</span>
        </Link>
        <div className="main-nav__menu hidden items-center justify-center text-sm font-semibold text-[var(--muted)] sm:flex lg:w-full">
          <Link className="inline-flex min-h-11 items-center px-3 transition-colors hover:text-[var(--ink)]" href="/discover">Discover</Link>
        </div>
        <div className="main-nav__account flex justify-end lg:justify-self-end">
          <AccountControl />
        </div>
      </nav>

      <div className="mx-auto max-w-[1400px] px-5 pb-16 pt-8 sm:px-8 lg:px-12 lg:pb-24 lg:pt-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link className="text-sm font-extrabold text-[var(--accent-strong)] underline decoration-2 underline-offset-4" href="/discover">← Back to groups</Link>
          <StartGroupLink className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-extrabold text-[var(--accent-foreground)] transition-transform hover:-translate-y-0.5" />
        </div>

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
        <GroupComments
          comments={group.comments}
          groupSlug={group.slug}
          isAuthenticated={group.viewer.isAuthenticated}
          isMember={group.viewer.isMember}
        />
      </div>
    </main>
  );
}
