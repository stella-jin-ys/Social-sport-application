import Link from "next/link";
import { AccountControl } from "@/components/account-control";
import { HomeDashboard } from "@/components/home/home-dashboard";
import { HomeFinder } from "@/components/home/home-finder";
import { getCurrentUser } from "@/lib/current-user";
import { listJoinedGroups, listPublicGroups, listRecommendedGroups, listUpcomingActivities } from "@/modules/groups/group-queries";
import type { HomeDashboardData } from "@/modules/groups/contracts";

export default async function HomePage() {
  const user = await getCurrentUser();
  const publicGroups = await listPublicGroups();

  if (!user) {
    return <><PublicNav /><HomeFinder groups={publicGroups} /></>;
  }

  let dashboardData: HomeDashboardData;

  try {
    const [joinedGroups, upcomingActivities, recommendedGroups] = await Promise.all([
      listJoinedGroups(user.id),
      listUpcomingActivities(user.id),
      listRecommendedGroups(user.id),
    ]);
    dashboardData = { joinedGroups, upcomingActivities, recommendedGroups };
  } catch (error) {
    console.error("Failed to load home dashboard", error);
    return <><PublicNav /><div className="mx-auto max-w-[1400px] px-5 pt-8 text-sm font-bold text-[var(--muted)]">Your groups are temporarily unavailable. You can still browse public groups below.</div><HomeFinder groups={publicGroups} /></>;
  }

  return <><DashboardNav /><HomeDashboard data={dashboardData} userName={user.name} /></>;
}

function PublicNav() {
  return <nav className="app-nav mx-auto flex max-w-[1400px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12"><Link className="font-display text-[1.7rem] font-black tracking-[-0.08em]" href="/">Sportship<span className="text-[var(--accent-strong)]">.</span></Link><div className="hidden items-center gap-3 text-sm font-bold text-[var(--muted)] lg:flex"><a className="rounded-full px-4 py-2 hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]" href="#groups">Discover</a><a className="rounded-full px-4 py-2 hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]" href="#sports">Sports</a></div><AccountControl /></nav>;
}

function DashboardNav() {
  return <nav className="app-nav mx-auto flex max-w-[1400px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12"><Link className="font-display text-[1.7rem] font-black tracking-[-0.08em]" href="/">Sportship<span className="text-[var(--accent-strong)]">.</span></Link><Link className="text-sm font-extrabold text-[var(--accent-strong)]" href="/discover">Discover groups →</Link><AccountControl /></nav>;
}
