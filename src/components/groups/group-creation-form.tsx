"use client";

import { useActionState, useState } from "react";
import { participationOptions, sportOptions } from "@/lib/group-creation-options";
import { PendingProgress } from "@/components/pending-progress";

type GroupCreationFormProps = {
  action: (formData: FormData) => Promise<void>;
};

const fieldClassName = "rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-4 py-3.5 font-normal outline-none focus:ring-4 focus:ring-[rgba(242,106,61,0.18)]";

export function GroupCreationForm({ action }: GroupCreationFormProps) {
  const [isRecurring, setIsRecurring] = useState(false);
  const [, submitAction, isPending] = useActionState(async (_state: null, formData: FormData) => {
    await action(formData);
    return null;
  }, null);

  return (
    <form action={submitAction} aria-busy={isPending} aria-label="Create group" className="mt-10 grid gap-5 rounded-[1.75rem] border border-[var(--line-strong)] bg-[var(--surface)] p-6 sm:p-8">
      <label className="grid gap-2 text-sm font-extrabold">
        Group name
        <input className={fieldClassName} name="name" placeholder="Söder Sparks" required />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-extrabold">
          Sport
          <select className={fieldClassName} defaultValue="" name="sport" required>
            <option disabled value="">Choose a sport</option>
            {sportOptions.map((sport) => <option key={sport}>{sport}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-extrabold">
          City
          <input className={fieldClassName} name="city" placeholder="Stockholm" required />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-extrabold">
        Who can join?
        <select className={fieldClassName} defaultValue="OPEN" name="participation">
          {participationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <fieldset className="rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] p-4 sm:p-5">
        <label className="flex cursor-pointer items-start gap-3 text-sm font-extrabold">
          <input checked={isRecurring} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)]" name="recurring" onChange={(event) => setIsRecurring(event.target.checked)} type="checkbox" />
          <span>
            Recurring schedule
            <span className="mt-1 block font-normal leading-6 text-[var(--muted)]">Choose this when the group usually meets on the same rhythm.</span>
          </span>
        </label>
        {isRecurring ? (
          <label className="mt-4 grid gap-2 text-sm font-extrabold">
            Schedule rhythm
            <input className={fieldClassName} name="rhythm" placeholder="Every Wednesday evening" required />
          </label>
        ) : null}
      </fieldset>
      <label className="grid gap-2 text-sm font-extrabold">
        Description
        <textarea className={`${fieldClassName} min-h-32`} name="description" placeholder="Tell people what makes this group welcoming." required />
      </label>
      <PendingProgress active={isPending} label="Creating group" />
      <button className="w-fit rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-extrabold text-[var(--accent-foreground)] disabled:cursor-wait disabled:opacity-65" disabled={isPending} type="submit">
        Create group
      </button>
    </form>
  );
}
