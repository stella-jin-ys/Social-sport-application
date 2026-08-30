import Link from "next/link";
import type { UpcomingActivity } from "@/modules/groups/contracts";

export function UpcomingActivityItem({ activity }: { activity: UpcomingActivity }) {
  const date = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Stockholm" }).format(new Date(activity.startsAt));
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Stockholm" }).format(new Date(activity.startsAt));

  return <li className="upcoming-activity flex items-center gap-4 border-b border-[var(--line)] py-4 last:border-b-0"><time className="w-16 shrink-0 text-sm font-black text-[var(--accent-strong)]">{date}<span className="mt-1 block text-[var(--ink)]">{time}</span></time><div className="min-w-0 flex-1"><p className="truncate font-extrabold">{activity.title}</p><p className="mt-1 truncate text-sm text-[var(--muted)]">{activity.groupName} · {activity.venue}</p></div><Link aria-label={`View ${activity.groupName}`} className="text-sm font-extrabold text-[var(--accent-strong)]" href={`/groups/${activity.groupSlug}`}>View</Link></li>;
}
