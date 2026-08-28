"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { joinGroupAction, setAttendanceAction } from "./actions";
import { clearPendingJoin, readPendingJoin, setPendingJoin } from "@/lib/pending-join";
import type { AttendanceChoice, GroupPageData } from "@/modules/groups/contracts";

type GroupActionsProps = {
  groupSlug: string;
  organizer?: string;
  isAuthenticated: boolean;
  isMember: boolean;
  memberCount: number;
  nextTraining: GroupPageData["nextTraining"];
  attendanceStatus: AttendanceChoice | null;
  scope?: "all" | "membership" | "attendance";
};

export function GroupActions({
  groupSlug,
  organizer,
  isAuthenticated,
  isMember,
  memberCount,
  nextTraining,
  attendanceStatus,
  scope = "all",
}: GroupActionsProps) {
  const router = useRouter();
  const [joined, setJoined] = useState(false);
  const [currentMemberCount, setCurrentMemberCount] = useState(memberCount);
  const [currentAttendance, setCurrentAttendance] = useState(attendanceStatus);
  const [goingCount, setGoingCount] = useState(nextTraining?.goingCount ?? 0);
  const [pendingControl, setPendingControl] = useState<"join" | "attendance" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const member = isMember || joined;
  const coming = currentAttendance === "GOING";

  const persistJoin = useCallback(async () => {
    setError(null);
    setPendingControl("join");
    try {
      const result = await joinGroupAction(groupSlug);

      if (result.ok) {
        setJoined(true);
        setCurrentMemberCount(result.memberCount);
        router.refresh();
        return;
      }

      setError(result.message);
    } catch {
      setError("We could not join this group. Please try again.");
    } finally {
      setPendingControl(null);
    }
  }, [groupSlug, router]);

  useEffect(() => {
    if (!isAuthenticated || scope === "attendance") return;

    const intent = readPendingJoin();
    if (!intent || intent.groupSlug !== groupSlug) return;

    clearPendingJoin();
    queueMicrotask(() => void persistJoin());
  }, [groupSlug, isAuthenticated, persistJoin, scope]);

  async function joinGroup() {
    setError(null);

    if (!isAuthenticated) {
      setPendingJoin({ groupSlug, returnTo: `/groups/${groupSlug}` });
      router.push(`/sign-in?returnTo=${encodeURIComponent(`/groups/${groupSlug}`)}`);
      return;
    }

    await persistJoin();
  }

  async function updateAttendance() {
    if (!member || !nextTraining) return;

    setError(null);
    setPendingControl("attendance");
    try {
      const result = await setAttendanceAction(nextTraining.id, coming ? "NOT_GOING" : "GOING");

      if (result.ok) {
        setCurrentAttendance(result.status);
        setGoingCount(result.goingCount);
        return;
      }

      setError(result.message);
    } catch {
      setError("We could not save your response. Please try again.");
    } finally {
      setPendingControl(null);
    }
  }

  const membershipControls = (
    <>
      <div>
        <p className="font-display text-4xl font-black tracking-[-0.06em]">{currentMemberCount}</p>
        {organizer ? <p className="mt-3 text-[var(--muted)]">Organized by {organizer}</p> : null}
      </div>
      <div className="mt-14">
        <button
          aria-pressed={member}
          className={`w-full rounded-full px-6 py-3.5 text-sm font-extrabold transition-all hover:-translate-y-0.5 ${member ? "bg-[var(--ink)] text-white" : "bg-[var(--accent)] text-[var(--accent-foreground)]"}`}
          disabled={pendingControl === "join"}
          onClick={joinGroup}
          type="button"
        >
          {pendingControl === "join" ? "Joining…" : member ? "Joined" : "Join group"}
        </button>
        <p aria-live="polite" className="mt-4 text-sm leading-6 text-[var(--muted)]">Join instantly. The organizer can moderate membership afterward.</p>
        {error && scope !== "attendance" ? <p className="mt-4 text-sm text-[var(--accent-strong)]" role="alert">{error}</p> : null}
      </div>
    </>
  );

  const attendanceControls = nextTraining ? (
    <section className={scope === "all" ? "mt-8" : "mt-16"} aria-labelledby="next-training">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-4xl font-black tracking-[-0.065em] sm:text-5xl" id="next-training">Next training</h2>
          <p className="mt-3 text-[var(--muted)]">Confirm once. Everyone sees an accurate attendance list.</p>
        </div>
        <p aria-live="polite" className="text-sm font-extrabold text-[var(--muted)]">{goingCount} going</p>
      </div>

      <article className="mt-8 grid gap-8 rounded-[1.75rem] border border-[var(--line-strong)] bg-[var(--surface-muted)] p-7 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="font-display text-3xl font-black tracking-[-0.05em]">{nextTraining.date}</p>
          <div className="mt-5 flex flex-col gap-2 text-[var(--muted)] sm:flex-row sm:gap-8">
            <p className="font-extrabold text-[var(--ink)]">{nextTraining.time}</p>
            <p>{nextTraining.venue}</p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 lg:items-end">
          {!member ? <p className="text-sm text-[var(--muted)]">Join the group to respond</p> : null}
          <button
            aria-pressed={coming}
            className={`w-fit rounded-full border px-6 py-3.5 text-sm font-extrabold transition-all hover:outline hover:outline-2 hover:outline-offset-2 hover:outline-[var(--ink)] ${coming ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink)]"}`}
            disabled={!member || pendingControl === "attendance"}
            onClick={updateAttendance}
            type="button"
          >
            {pendingControl === "attendance" ? "Saving…" : coming ? "You're coming" : "I'm coming"}
          </button>
          {error && scope === "attendance" ? <p className="text-sm text-[var(--accent-strong)]" role="alert">{error}</p> : null}
        </div>
      </article>
    </section>
  ) : null;

  return (
    <>
      {scope !== "attendance" ? membershipControls : null}
      {scope !== "membership" ? attendanceControls : null}
    </>
  );
}
