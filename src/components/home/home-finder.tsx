"use client";

import Link from "next/link";
import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import type { PublicGroupCard } from "@/modules/groups/contracts";
import { sports } from "@/lib/group-catalog";

const sportColors: Record<string, string> = { innebandy: "#a94330", football: "#3158b7", running: "#8c6110", volleyball: "#347865", cycling: "#804b75", padel: "#4b3488" };

function SportIcon({ sport }: { sport: string }) {
  return <svg aria-hidden="true" className="sport-chip__icon" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" /><path d={sport === "running" ? "M13 5.5 10 10l3 2.5-2.5 5M10 10l-3-1.5M13 12.5l4 1" : sport === "cycling" ? "m7 17 3-7 4 7m-7 0h8m-5-7 2-3m-2 3h4" : sport === "volleyball" ? "M5 13c3-5 8-6 14-3M8 18c1-5 5-8 10-8M12 4c1 3 3 5 7 6" : "M7 7.5a5 5 0 1 0 10 0M9 12l-2 6m8-6 2 6"} /></svg>;
}

export function HomeFinder({ groups }: { groups: PublicGroupCard[] }) {
  const [selectedSport, setSelectedSport] = useState("all");
  const [city, setCity] = useState("Stockholm");
  const [appliedCity, setAppliedCity] = useState("Stockholm");

  const selectSport = (sport: string) => {
    setSelectedSport(sport);
    setAppliedCity(city.trim() || "Stockholm");
  };

  const findGroups = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedCity(city.trim() || "Stockholm");
    document.getElementById("groups")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };

  const filteredGroups = groups.filter((group) => (selectedSport === "all" || group.sportSlug === selectedSport) && group.location.toLowerCase().startsWith(appliedCity.toLowerCase()));
  const selectedSportName = selectedSport === "all" ? undefined : sports.find((sport) => sport.value === selectedSport)?.label;
  const resultLabel = selectedSportName ? `${selectedSportName} groups in ${appliedCity}` : `Groups in ${appliedCity}`;

  return <>
    <section className="app-hero mx-auto max-w-[1400px] px-5 pb-10 pt-4 sm:px-8 sm:pb-14 lg:px-12 lg:pt-12">
      <div className="app-hero__grid grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-16">
        <div><p className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-[var(--accent-strong)]">Your local sports map</p><h1 className="font-display max-w-[10ch] text-[3.7rem] font-black leading-[0.9] tracking-[-0.08em] sm:text-[5rem]">Find your next sport group.</h1><p className="mt-5 max-w-[31rem] text-base leading-7 text-[var(--muted)] sm:text-lg">Choose a sport, add your city, and find people who are ready to play.</p></div>
        <form aria-label="Find sport groups" className="search-panel rounded-[1.5rem] border border-[var(--line-strong)] bg-[var(--surface)] p-4 shadow-[0_18px_50px_rgba(41,52,58,0.10)] sm:p-5" onSubmit={findGroups}><div className="grid gap-3 sm:grid-cols-2"><label className="search-field"><span>Sport</span><select aria-label="Sport" className="search-control" onChange={(event) => setSelectedSport(event.target.value)} value={selectedSport}><option value="all">Any sport</option>{sports.filter((sport) => sport.value !== "all").map((sport) => <option key={sport.value} value={sport.value}>{sport.label}</option>)}</select></label><label className="search-field"><span>City</span><input aria-label="City" className="search-control" onChange={(event) => setCity(event.target.value)} placeholder="e.g. Stockholm" value={city} /></label></div><button className="search-submit mt-3 flex min-h-14 w-full items-center justify-between rounded-xl bg-[var(--accent)] px-5 text-base font-black text-[var(--accent-foreground)] shadow-[0_10px_22px_rgba(242,106,61,0.22)] transition-transform hover:-translate-y-0.5 active:translate-y-px" type="submit"><span>Find groups</span><span aria-hidden="true" className="text-xl">→</span></button></form>
      </div>
    </section>

    <section className="app-sports border-y border-[var(--line)] bg-[var(--surface-muted)]" id="sports"><div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10"><div className="flex items-end justify-between gap-4"><div><h2 className="font-display text-2xl font-black tracking-[-0.06em] sm:text-3xl">Browse by sport</h2><p className="mt-1 text-sm text-[var(--muted)]">Start with what you want to play.</p></div><span className="hidden text-sm font-bold text-[var(--muted)] sm:block">{sports.length - 1} popular sports</span></div><div className="sport-rail mt-5 flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-6 lg:overflow-visible"><button aria-pressed={selectedSport === "all"} className={`sport-chip ${selectedSport === "all" ? "sport-chip--active" : ""}`} onClick={() => selectSport("all")} type="button">Any sport</button>{sports.filter((sport) => sport.value !== "all").map((sport) => <button aria-pressed={selectedSport === sport.value} aria-label={sport.label} className={`sport-chip ${selectedSport === sport.value ? "sport-chip--active" : ""}`} data-sport-icon={sport.value} key={sport.value} onClick={() => selectSport(sport.value)} style={{ "--chip-color": sportColors[sport.value] } as CSSProperties} type="button"><SportIcon sport={sport.value} /><span>{sport.label}</span><small>Explore groups</small></button>)}</div></div></section>

    <section className="app-results mx-auto max-w-[1400px] px-5 py-10 sm:px-8 sm:py-14 lg:px-12" id="groups"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--accent-strong)]">Your results</p><h2 className="font-display mt-2 text-3xl font-black tracking-[-0.065em] sm:text-4xl">{resultLabel}</h2></div><span className="rounded-full bg-[var(--surface-muted)] px-3 py-2 text-sm font-bold text-[var(--muted)]">{filteredGroups.length} found</span></div><div className="mt-7 grid gap-4 lg:grid-cols-3">{filteredGroups.map((group) => <article className="group relative rounded-[1.25rem] border border-[var(--line-strong)] bg-[var(--surface)] p-5 transition-transform hover:-translate-y-1" key={group.slug}><span className="absolute bottom-5 left-0 top-5 w-1 rounded-r-full" style={{ background: group.tone }} /><div className="flex items-start justify-between gap-3 pl-2"><span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-bold">{group.audience}</span><span className="text-sm font-bold text-[var(--muted)]">{group.members}</span></div><h3 className="font-display mt-8 pl-2 text-2xl font-black tracking-[-0.06em]">{group.name}</h3><div className="mt-3 space-y-1 pl-2 text-sm text-[var(--muted)]"><p>{group.location}</p><p className="font-bold text-[var(--ink)]">Next session · {group.time}</p></div><Link className="mt-6 inline-flex pl-2 text-sm font-extrabold text-[var(--accent-strong)] underline decoration-2 underline-offset-4" href={`/groups/${group.slug}`}>View group <span aria-hidden="true" className="ml-2">→</span></Link></article>)}</div>{filteredGroups.length === 0 && <div className="mt-7 rounded-[1.25rem] border border-dashed border-[var(--line-strong)] bg-[var(--surface-muted)] px-6 py-12 text-center"><h3 className="font-display text-2xl font-black tracking-[-0.05em]">No groups in {appliedCity} yet</h3><p className="mx-auto mt-2 max-w-md text-[var(--muted)]">Start the first local group and give people somewhere to show up.</p></div>}</section>
  </>;
}
