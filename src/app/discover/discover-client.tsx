"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { sports } from "@/lib/group-catalog";
import type { PublicGroupCard } from "@/modules/groups/contracts";
import { AccountControl } from "@/components/account-control";
import { StartGroupLink } from "@/components/start-group-link";

const audienceFilters = [
  { label: "Everyone", value: "all" },
  { label: "Women only", value: "Women only" },
  { label: "Men only", value: "Men only" },
  { label: "Mixed group", value: "Mixed group" },
  { label: "Open to all", value: "Open to all" },
] as const;

function DiscoverContent({ groups }: { groups: PublicGroupCard[] }) {
  const searchParams = useSearchParams();
  const sportFromUrl = searchParams.get("sport");
  const initialSport = sports.some((sport) => sport.value === sportFromUrl) ? sportFromUrl! : "all";
  const [selectedSport, setSelectedSport] = useState(initialSport);
  const [location, setLocation] = useState("");
  const [audience, setAudience] = useState<(typeof audienceFilters)[number]["value"]>("all");

  const normalizedLocation = location.trim().toLowerCase();
  const visibleGroups = groups
    .filter((group) => selectedSport === "all" || group.sportSlug === selectedSport)
    .filter((group) => !normalizedLocation || group.location.toLowerCase().includes(normalizedLocation))
    .filter((group) => audience === "all" || group.audience === audience);

  return (
    <main className="min-h-[100dvh] bg-[var(--paper)] text-[var(--ink)]">
      <nav className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-5 py-5 sm:px-8 lg:grid lg:grid-cols-[1fr_minmax(30rem,34rem)_1fr] lg:px-12">
        <Link className="font-display text-[1.65rem] font-black tracking-[-0.08em] lg:justify-self-start" href="/">
          Sportship<span className="text-[var(--accent-strong)]">.</span>
        </Link>
        <div className="main-nav__menu hidden text-sm font-semibold text-[var(--muted)] lg:flex lg:w-full lg:items-center lg:justify-between lg:gap-8">
          <Link className="inline-flex min-h-11 items-center px-3 text-[var(--ink)]" href="/discover">Discover</Link>
          <Link className="inline-flex min-h-11 items-center px-3 transition-colors hover:text-[var(--ink)]" href="/#sports">Sports</Link>
          <Link className="inline-flex min-h-11 items-center px-3 transition-colors hover:text-[var(--ink)]" href="/#for-organizers">For organizers</Link>
        </div>
        <div className="main-nav__account flex justify-end lg:justify-self-end">
          <AccountControl />
        </div>
      </nav>

      <section className="mx-auto max-w-[1400px] px-5 pb-16 pt-10 sm:px-8 lg:px-12 lg:pb-24 lg:pt-16">
        <div className="max-w-3xl">
          <Link className="text-sm font-extrabold text-[var(--accent-strong)] underline decoration-2 underline-offset-4" href="/">← Back home</Link>
          <h1 className="mt-8 font-display text-5xl font-black leading-[0.95] tracking-[-0.07em] sm:text-7xl">Find a group that fits your week.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">Browse public groups anywhere, then narrow the list by sport, place, and who you want to play with.</p>
          <StartGroupLink className="mt-7 inline-flex rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-extrabold text-[var(--accent-foreground)] transition-transform hover:-translate-y-0.5" />
        </div>

        <div className="mt-12 rounded-[1.5rem] border border-[var(--line-strong)] bg-[var(--surface-muted)] p-5 sm:p-7">
          <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
            <label className="block text-sm font-extrabold" htmlFor="location">
              Search by location
              <input aria-label="Location" className="mt-2 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-3.5 font-normal text-[var(--ink)] outline-none transition-shadow placeholder:text-[var(--muted)] focus:ring-4 focus:ring-[rgba(242,106,61,0.18)]" id="location" onChange={(event) => setLocation(event.target.value)} placeholder="Country, city, or area" type="search" value={location} />
            </label>
            <label className="block text-sm font-extrabold" htmlFor="sport">
              Sport
              <select aria-label="Sport" className="mt-2 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-3.5 font-normal text-[var(--ink)] outline-none focus:ring-4 focus:ring-[rgba(242,106,61,0.18)]" id="sport" onChange={(event) => setSelectedSport(event.target.value)} value={selectedSport}>
                {sports.map((sport) => <option key={sport.value} value={sport.value}>{sport.label}</option>)}
              </select>
            </label>
          </div>

          <fieldset className="mt-6">
            <legend className="text-sm font-extrabold">Participation</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {audienceFilters.map((filter) => {
                const isSelected = audience === filter.value;

                return (
                  <button aria-pressed={isSelected} className={`rounded-full border px-4 py-2.5 text-sm font-bold transition-all hover:outline hover:outline-2 hover:outline-offset-2 hover:outline-[var(--ink)] ${isSelected ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink)]"}`} key={filter.value} onClick={() => setAudience(filter.value)} type="button">
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="mt-16 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-4xl font-black tracking-[-0.065em]">Recommended groups</h2>
            <p className="mt-3 text-[var(--muted)]">A friendly place to start, wherever you are looking.</p>
          </div>
          <p className="text-sm font-bold text-[var(--muted)]">{visibleGroups.length} {visibleGroups.length === 1 ? "group" : "groups"} found</p>
        </div>

        {visibleGroups.length > 0 ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {visibleGroups.map((group) => (
              <article className="group rounded-[1.5rem] border border-[var(--line-strong)] bg-[var(--surface-muted)] p-6 shadow-[0_10px_30px_rgba(41,52,58,0.06)] transition-all hover:-translate-y-1 hover:outline hover:outline-2 hover:outline-offset-2 hover:outline-[var(--ink)]" key={group.slug}>
                <div className="flex items-start justify-between gap-4">
                  <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: group.accent, color: group.tone }}>{group.sport}</span>
                  <span className="text-sm font-extrabold text-[var(--muted)]">{group.members}</span>
                </div>
                <h3 className="mt-12 font-display text-3xl font-black tracking-[-0.065em]">{group.name}</h3>
                <div className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                  <p>{group.location}</p>
                  <p className="font-bold text-[var(--ink)]">{group.time}</p>
                  <p><span className="font-bold text-[var(--ink)]">Rhythm:</span> {group.schedule}</p>
                </div>
                <div className="mt-7 flex items-center justify-between gap-4">
                  <span className="text-sm font-bold text-[var(--muted)]">{group.audience}</span>
                  <Link className="border-b-2 border-transparent pb-1 text-sm font-extrabold transition-colors group-hover:border-[var(--accent)] group-hover:text-[var(--accent-strong)]" href={`/groups/${group.slug}`}>View group</Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[1.5rem] border border-dashed border-[var(--line-strong)] bg-[var(--surface-muted)] px-6 py-16 text-center">
            <h3 className="font-display text-3xl font-black tracking-[-0.06em]">No groups match those filters</h3>
            <p className="mx-auto mt-3 max-w-md text-[var(--muted)]">Try another location, sport, or participation type. New groups are joining every week.</p>
            <button className="mt-6 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-extrabold text-[var(--accent-foreground)]" onClick={() => { setSelectedSport("all"); setLocation(""); setAudience("all"); }} type="button">Clear filters</button>
          </div>
        )}
      </section>
    </main>
  );
}

export function DiscoverClient({ groups }: { groups: PublicGroupCard[] }) {
  return (
    <Suspense fallback={<main className="min-h-[100dvh] bg-[var(--paper)] p-8 text-[var(--ink)]">Loading groups…</main>}>
      <DiscoverContent groups={groups} />
    </Suspense>
  );
}
