"use client";

import { useState } from "react";
import { sportOptions } from "@/lib/group-creation-options";
import type { GroupPageData, GroupUpdateInput } from "@/modules/groups/contracts";
import { updateGroupDetailsAction } from "./actions";

const field = "rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-4 py-3 font-normal outline-none focus:ring-4 focus:ring-[rgba(242,106,61,0.18)]";

export function GroupEditor({ group }: { group: GroupPageData }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const next = group.nextTraining;
  if (!group.viewer.canEdit || !next) return null;
  const startsAt = next.startsAt ?? new Date().toISOString();
  const endsAt = next.endsAt ?? startsAt;
  const dateValue = next.dateValue ?? startsAt.slice(0, 10);
  const startTimeValue = next.startTimeValue ?? startsAt.slice(11, 16);
  const endTimeValue = next.endTimeValue ?? endsAt.slice(11, 16);

  async function save(formData: FormData) {
    setMessage(null);
    const input: GroupUpdateInput = { sport: String(formData.get("sport")), title: String(formData.get("title")), date: String(formData.get("date")), startTime: String(formData.get("startTime")), endTime: String(formData.get("endTime")), venue: String(formData.get("venue")) };
    const result = await updateGroupDetailsAction(group.slug, input);
    setMessage(result.ok ? "Next training updated." : result.message);
    if (result.ok) setOpen(false);
  }

  return (
    <section className="mt-5 rounded-2xl border border-[var(--line-strong)] bg-[var(--surface-muted)] p-4">
      <button aria-expanded={open} className="text-sm font-extrabold text-[var(--accent-strong)]" onClick={() => setOpen((value) => !value)} type="button">Edit group</button>
      {open ? <form action={save} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-extrabold sm:col-span-2">Sport<select className={field} defaultValue={group.sport} name="sport">{sportOptions.map((sport) => <option key={sport}>{sport}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-extrabold sm:col-span-2">Next training title<input className={field} defaultValue={next.title ?? "Training"} name="title" required /></label>
        <label className="grid gap-2 text-sm font-extrabold">Date<input className={field} defaultValue={dateValue} name="date" type="date" required /></label>
        <label className="grid gap-2 text-sm font-extrabold">Venue<input className={field} defaultValue={next.venue} name="venue" required /></label>
        <label className="grid gap-2 text-sm font-extrabold">Starts<input className={field} defaultValue={startTimeValue} name="startTime" type="time" required /></label>
        <label className="grid gap-2 text-sm font-extrabold">Ends<input className={field} defaultValue={endTimeValue} name="endTime" type="time" required /></label>
        <button className="w-fit rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-extrabold text-white" type="submit">Save next training</button>
        {message ? <p aria-live="polite" className="text-sm text-[var(--muted)] sm:col-span-2">{message}</p> : null}
      </form> : null}
    </section>
  );
}
