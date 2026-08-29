"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useState } from "react";
import { AccountControl } from "@/components/account-control";
import { StartGroupLink } from "@/components/start-group-link";

type Sport = {
  name: string;
  slug: string;
  count: string;
  color: string;
  accent: string;
};

type Group = {
  slug: string;
  name: string;
  sport: string;
  location: string;
  time: string;
  audience: string;
  members: string;
  tone: string;
};

const sports: Sport[] = [
  { name: "Innebandy", slug: "innebandy", count: "18 groups", color: "#7d2d20", accent: "#ffd9cd" },
  { name: "Football", slug: "football", count: "24 groups", color: "#3158b7", accent: "#f0f3ff" },
  { name: "Running", slug: "running", count: "31 groups", color: "#8c6110", accent: "#fff8dd" },
  { name: "Volleyball", slug: "volleyball", count: "12 groups", color: "#347865", accent: "#edf7ef" },
  { name: "Cycling", slug: "cycling", count: "9 groups", color: "#804b75", accent: "#fbf0f8" },
  { name: "Padel", slug: "padel", count: "16 groups", color: "#4b3488", accent: "#e6ddff" },
];

const groups: Group[] = [
  { slug: "soder-sparks", name: "Söder Sparks", sport: "innebandy", location: "Stockholm · Södermalm", time: "Tue 18:30", audience: "Women only", members: "12 going", tone: "#a94330" },
  { slug: "parken-5-a-side", name: "Parken 5-a-side", sport: "football", location: "Stockholm · Vasastan", time: "Wed 19:00", audience: "Mixed group", members: "8 going", tone: "#3158b7" },
  { slug: "sunrise-miles", name: "Sunrise Miles", sport: "running", location: "Stockholm · Djurgården", time: "Sat 09:15", audience: "Open to all", members: "16 going", tone: "#8c6110" },
  { slug: "volley-after-work", name: "Volley After Work", sport: "volleyball", location: "Stockholm · Kungsholmen", time: "Thu 18:00", audience: "Mixed group", members: "10 going", tone: "#347865" },
];

const navItems = [
  { label: "Discover", href: "#discover" },
  { label: "Sports", href: "#sports" },
  { label: "For organizers", href: "#for-organizers" },
];

const cities = [
  { name: "Stockholm", slug: "stockholm" },
  { name: "Uppsala", slug: "uppsala" },
];

export default function HomePage() {
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedCity, setSelectedCity] = useState("stockholm");
  const filteredGroups = groups.filter((group) => {
    const matchesSport = selectedSport === "all" || group.sport === selectedSport;
    const matchesCity = selectedCity === "all" || group.location.toLowerCase().startsWith(selectedCity);
    return matchesSport && matchesCity;
  });
  const visibleGroups = selectedSport === "all" && selectedCity === "stockholm" ? filteredGroups.slice(0, 3) : filteredGroups;
  const selectedSportName = sports.find((sport) => sport.slug === selectedSport)?.name;
  const selectedCityName = cities.find((city) => city.slug === selectedCity)?.name ?? "all cities";

  return (
    <main className="flex min-h-[100dvh] flex-col overflow-hidden bg-[var(--paper)] text-[var(--ink)]">
      <nav className="home-nav mx-auto flex w-full max-w-[1400px] items-center justify-between px-5 py-5 sm:px-8 lg:grid lg:grid-cols-[1fr_minmax(30rem,34rem)_1fr] lg:px-12">
        <Link className="font-display text-[1.65rem] font-black tracking-[-0.08em] lg:justify-self-start" href="/">
          Sportship<span className="text-[var(--accent-strong)]">.</span>
        </Link>
        <div className="main-nav__menu hidden text-sm font-semibold text-[var(--muted)] lg:flex lg:w-full lg:items-center lg:justify-between lg:gap-8">
          {navItems.map((item) => (
            <a className="inline-flex min-h-11 items-center px-3 transition-colors hover:text-[var(--ink)]" href={item.href} key={item.label}>
              {item.label}
            </a>
          ))}
        </div>
        <div className="main-nav__account flex justify-end lg:justify-self-end">
          <AccountControl />
        </div>
      </nav>

      <section className="home-hero mx-auto grid max-w-[1400px] items-center gap-10 px-5 pb-16 pt-8 sm:px-8 sm:pb-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-12 lg:pb-24 lg:pt-12">
        <div className="home-hero__copy max-w-[560px]">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.16em] text-[var(--accent-strong)]">Find your pace</p>
          <h1 className="font-display max-w-[9ch] text-[3.55rem] font-black leading-[0.92] tracking-[-0.075em] sm:text-[4.8rem] lg:text-[5.6rem]">Find your people. Move together.</h1>
          <p className="mt-7 max-w-[34rem] text-lg leading-8 text-[var(--muted)]">Browse local sports groups, see what is happening, and join a session that fits your week.</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link className="rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-extrabold text-[var(--accent-foreground)] shadow-[0_12px_30px_rgba(242,106,61,0.24)] transition-transform hover:-translate-y-1 active:translate-y-px" href="/discover">Browse groups</Link>
            <StartGroupLink className="rounded-full border-2 border-[var(--accent)] px-5 py-3 text-sm font-extrabold text-[var(--accent-strong)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]" />
            <a className="border-b-2 border-[var(--ink)] pb-1 text-sm font-extrabold transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-strong)]" href="#sports">Explore sports</a>
          </div>
        </div>

        <div className="home-hero__visual relative">
          <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-[#f3c548] opacity-70 blur-3xl" aria-hidden="true" />
          <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] bg-[#d9c7ad] shadow-[0_22px_60px_rgba(37,53,44,0.15)]" data-hero-frame>
            <Image alt="Women playing floorball together in a bright indoor sports hall" className="h-full w-full object-cover object-center" fill priority sizes="(max-width: 1024px) 100vw, 56vw" src="/images/sports-community-hero.png" />
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-white sm:bottom-7 sm:left-7 sm:right-7">
              <div className="rounded-2xl bg-[#29343a]/75 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/90">Tonight in Stockholm</p>
                <p className="mt-2 text-2xl font-extrabold tracking-[-0.04em]">Söder Sparks</p>
                <p className="mt-1 text-sm text-white/90">12 people are going</p>
              </div>
              <div className="shrink-0 rounded-2xl bg-[var(--surface)] px-4 py-3 text-right text-[var(--ink)] shadow-lg">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Next session</p>
                <p className="mt-1 text-lg font-extrabold">Tue 18:30</p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-3 -left-2 rotate-[-4deg] rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4 text-[var(--ink)] shadow-[0_16px_35px_rgba(53,122,99,0.14)] sm:-left-7 sm:px-6">
            <p className="text-2xl font-black tracking-[-0.06em]">38</p>
            <p className="text-xs font-semibold text-[var(--muted)]">sports to try</p>
          </div>
        </div>
      </section>

      <section className="home-sports-section border-y border-[var(--line)] bg-[var(--surface-muted)]" id="sports">
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-4xl font-black tracking-[-0.065em] sm:text-5xl">Pick a sport. Find your people.</h2>
              <p className="mt-3 max-w-xl text-[var(--muted)]">Start with what you already love, or choose something new for this week.</p>
            </div>
            <Link className="w-fit text-sm font-extrabold text-[var(--accent-strong)] underline decoration-2 underline-offset-4" href="/discover">See every sport</Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <button aria-pressed={selectedSport === "all"} className={`sport-tile min-h-36 rounded-[1.25rem] border-2 p-4 text-left transition-all hover:-translate-y-1 hover:outline hover:outline-2 hover:outline-offset-2 hover:outline-[var(--ink)] ${selectedSport === "all" ? "border-[var(--ink)] bg-[var(--surface-muted)] text-[var(--ink)]" : "border-transparent bg-[var(--surface)] text-[var(--ink)]"}`} onClick={() => setSelectedSport("all")} type="button">
              <span className="block text-4xl font-black tracking-[-0.08em]">All</span>
              <span className="mt-7 block text-sm font-bold text-[var(--muted)]">Browse all groups</span>
            </button>
            {sports.map((sport) => (
              <button aria-pressed={selectedSport === sport.slug} className={`sport-tile group min-h-36 rounded-[1.25rem] border-2 bg-[var(--surface)] p-4 text-left text-[var(--ink)] transition-all hover:-translate-y-1 hover:outline hover:outline-2 hover:outline-offset-2 hover:outline-[var(--ink)] ${selectedSport === sport.slug ? "border-[var(--ink)]" : "border-transparent"}`} data-selected={selectedSport === sport.slug} key={sport.slug} onClick={() => setSelectedSport(sport.slug)} style={{ "--sport-accent": sport.accent, "--sport-color": sport.color } as CSSProperties} type="button">
                <span className="sport-tile__marker mb-5 block h-2 w-12 rounded-full" aria-hidden="true" />
                <span className="block text-2xl font-black tracking-[-0.07em] transition-transform group-hover:translate-x-1">{sport.name}</span>
                <span className="mt-8 block text-xs font-bold text-[var(--accent-strong)]">{sport.count}</span>
              </button>
            ))}
          </div>
          <p aria-live="polite" className="mt-5 text-sm font-bold text-[var(--muted)]">{selectedSportName ? `Showing ${selectedSportName} groups in ${selectedCityName}` : `Showing featured groups in ${selectedCityName}`}</p>
        </div>
      </section>

      <section className="home-discover-section bg-[var(--paper)]" id="discover">
        <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-4xl font-black tracking-[-0.065em] sm:text-5xl">Groups happening near you</h2>
            <p className="mt-3 max-w-lg text-[var(--muted)]">A few welcoming places to start. Change the sport above to browse another scene.</p>
          </div>
          <label className="flex w-fit items-center rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold text-[var(--ink)] focus-within:border-[var(--ink)]">
            <span className="sr-only">City</span>
            <select aria-label="City" className="cursor-pointer bg-transparent outline-none" onChange={(event) => setSelectedCity(event.target.value)} value={selectedCity}>
              {cities.map((city) => <option key={city.slug} value={city.slug}>{city.name}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {visibleGroups.map((group) => (
              <article className="group rounded-[1.5rem] border border-[var(--line-strong)] bg-[var(--surface)] p-6 transition-all hover:-translate-y-1 hover:outline hover:outline-2 hover:outline-offset-2 hover:outline-[var(--ink)]" key={group.name}>
              <div className="flex items-start justify-between gap-4">
                <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-bold text-[var(--ink)]">{group.audience}</span>
                <span className="text-sm font-extrabold text-[var(--muted)]">{group.members}</span>
              </div>
              <h3 className="mt-12 font-display text-3xl font-black tracking-[-0.065em]">{group.name}</h3>
              <div className="mt-5 space-y-2 text-sm text-[var(--muted)]">
                <p>{group.location}</p>
                <p className="font-bold text-[var(--ink)]">{group.time}</p>
              </div>
              <Link className="mt-7 inline-block border-b-2 border-transparent pb-1 text-sm font-extrabold transition-colors group-hover:border-[var(--accent)] group-hover:text-[var(--accent-strong)]" href={`/groups/${group.slug}`}>View group</Link>
            </article>
          ))}
        </div>
        {visibleGroups.length === 0 && (
          <div className="mt-10 rounded-[1.5rem] border border-dashed border-[var(--line-strong)] bg-[var(--surface)] px-6 py-14 text-center">
            <h3 className="font-display text-3xl font-black tracking-[-0.06em]">No sample groups yet</h3>
            <p className="mx-auto mt-3 max-w-md text-[var(--muted)]">Be the first person to start a {sports.find((sport) => sport.slug === selectedSport)?.name} group in your area.</p>
            <StartGroupLink className="mt-6 inline-block rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-extrabold text-[var(--accent-foreground)]" />
          </div>
        )}
        </div>
      </section>

      <section className="home-organizer-section mx-5 mb-6 overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--ink)] sm:mx-8 lg:mx-12" id="for-organizers">
        <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-10 lg:px-14 lg:py-16">
          <div>
            <h2 className="font-display max-w-[11ch] text-4xl font-black leading-[0.95] tracking-[-0.07em] sm:text-5xl">Your group deserves more than a chat thread.</h2>
            <p className="mt-4 max-w-xl text-[var(--muted)]">Create a home for weekly sessions, sign-ups, plans, and the people who keep coming back.</p>
          </div>
        </div>
      </section>

      <footer className="home-footer mx-auto flex max-w-[1400px] flex-col gap-3 px-5 py-8 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <p className="font-display text-lg font-black tracking-[-0.06em] text-[var(--ink)]">Sportship<span className="text-[var(--accent-strong)]">.</span></p>
        <p>Find a group. Show up. Feel at home.</p>
      </footer>
    </main>
  );
}
