import Link from "next/link";
import type { JoinedGroupCard } from "@/modules/groups/contracts";

export function JoinedGroupCard({ group }: { group: JoinedGroupCard }) {
  return <article className="joined-group-card rounded-[1.5rem] bg-[var(--ink)] p-5 text-[var(--surface)] shadow-[0_18px_40px_rgba(24,35,34,0.14)] sm:p-6"><div className="flex items-start justify-between gap-4"><span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-[var(--accent-foreground)]">{group.sport}</span><span className="text-sm font-bold text-[var(--surface-muted)]">Member</span></div><h3 className="font-display mt-7 text-2xl font-black tracking-[-0.06em]">{group.name}</h3><p className="mt-2 text-sm text-[var(--surface-muted)]">{group.location}</p><Link className="mt-6 inline-flex text-sm font-extrabold text-[var(--accent)] underline decoration-2 underline-offset-4" href={`/groups/${group.slug}`}>View group <span aria-hidden="true" className="ml-2">→</span></Link></article>;
}
