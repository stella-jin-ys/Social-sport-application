export type Audience = "Women only" | "Mixed group" | "Open to all";

export type GroupProfile = {
  slug: string;
  name: string;
  sport: string;
  sportSlug: string;
  location: string;
  time: string;
  audience: Audience;
  members: string;
  memberCount: string;
  memberTotal: number;
  goingTotal: number;
  recommended: boolean;
  tone: string;
  accent: string;
  description: string;
  organizer: string;
  schedule: string;
  nextTraining: {
    date: string;
    time: string;
    venue: string;
    startsAt: string;
    endsAt: string;
  };
};

const seededSessionTimes = {
  "soder-sparks": ["2026-09-01T16:30:00.000Z", "2026-09-01T18:00:00.000Z"],
  "parken-5-a-side": ["2026-09-02T17:00:00.000Z", "2026-09-02T18:30:00.000Z"],
  "sunrise-miles": ["2026-09-05T07:15:00.000Z", "2026-09-05T08:30:00.000Z"],
  "volley-after-work": ["2026-09-03T16:00:00.000Z", "2026-09-03T17:30:00.000Z"],
  "mollevangen-padel": ["2026-09-06T14:00:00.000Z", "2026-09-06T15:30:00.000Z"],
  "lund-loop-club": ["2026-09-05T09:00:00.000Z", "2026-09-05T11:00:00.000Z"],
} as const;

export const sports = [
  { label: "All sports", value: "all" },
  { label: "Innebandy", value: "innebandy" },
  { label: "Football", value: "football" },
  { label: "Running", value: "running" },
  { label: "Volleyball", value: "volleyball" },
  { label: "Cycling", value: "cycling" },
  { label: "Padel", value: "padel" },
];

export const groupCatalog: GroupProfile[] = [
  {
    slug: "soder-sparks",
    name: "Söder Sparks",
    sport: "Innebandy",
    sportSlug: "innebandy",
    location: "Stockholm · Södermalm",
    time: "Tue 18:30",
    audience: "Women only",
    members: "12 going",
    memberCount: "42 members",
    memberTotal: 42,
    goingTotal: 12,
    recommended: true,
    tone: "#7d2d20",
    accent: "#ffd9cd",
    description: "A welcoming women-only innebandy group for relaxed weekly games, good energy, and meeting new people. All playing levels are welcome.",
    organizer: "Lina Berg",
    schedule: "Every Tuesday evening",
    nextTraining: { date: "Tuesday · 1 September", time: "18:30–20:00", venue: "Eriksdalsskolan sports hall", startsAt: seededSessionTimes["soder-sparks"][0], endsAt: seededSessionTimes["soder-sparks"][1] },
  },
  {
    slug: "parken-5-a-side",
    name: "Parken 5-a-side",
    sport: "Football",
    sportSlug: "football",
    location: "Stockholm · Vasastan",
    time: "Wed 19:00",
    audience: "Mixed group",
    members: "8 going",
    memberCount: "31 members",
    memberTotal: 31,
    goingTotal: 8,
    recommended: true,
    tone: "#3158b7",
    accent: "#f0f3ff",
    description: "Friendly five-a-side football with balanced teams, rotating positions, and space for both regulars and first-time visitors.",
    organizer: "Noah Lind",
    schedule: "Every Wednesday evening",
    nextTraining: { date: "Wednesday · 2 September", time: "19:00–20:30", venue: "Vasaparken football pitch", startsAt: seededSessionTimes["parken-5-a-side"][0], endsAt: seededSessionTimes["parken-5-a-side"][1] },
  },
  {
    slug: "sunrise-miles",
    name: "Sunrise Miles",
    sport: "Running",
    sportSlug: "running",
    location: "Stockholm · Djurgården",
    time: "Sat 09:15",
    audience: "Open to all",
    members: "16 going",
    memberCount: "58 members",
    memberTotal: 58,
    goingTotal: 16,
    recommended: true,
    tone: "#8c6110",
    accent: "#fff8dd",
    description: "A social weekend running group with conversational 5 km and 8 km routes, followed by coffee for anyone who wants to stay.",
    organizer: "Maja Ek",
    schedule: "Every Saturday morning",
    nextTraining: { date: "Saturday · 5 September", time: "09:15–10:30", venue: "Djurgårdsbron meeting point", startsAt: seededSessionTimes["sunrise-miles"][0], endsAt: seededSessionTimes["sunrise-miles"][1] },
  },
  {
    slug: "volley-after-work",
    name: "Volley After Work",
    sport: "Volleyball",
    sportSlug: "volleyball",
    location: "Stockholm · Kungsholmen",
    time: "Thu 18:00",
    audience: "Mixed group",
    members: "10 going",
    memberCount: "36 members",
    memberTotal: 36,
    goingTotal: 10,
    recommended: false,
    tone: "#347865",
    accent: "#edf7ef",
    description: "Casual indoor volleyball after work with mixed teams, simple rotations, and a focus on playing more than keeping score.",
    organizer: "Samira Ali",
    schedule: "Every Thursday evening",
    nextTraining: { date: "Thursday · 3 September", time: "18:00–19:30", venue: "Kungsholmens gymnasium", startsAt: seededSessionTimes["volley-after-work"][0], endsAt: seededSessionTimes["volley-after-work"][1] },
  },
  {
    slug: "mollevangen-padel",
    name: "Möllevången Padel",
    sport: "Padel",
    sportSlug: "padel",
    location: "Malmö · Möllevången",
    time: "Sun 16:00",
    audience: "Open to all",
    members: "6 going",
    memberCount: "24 members",
    memberTotal: 24,
    goingTotal: 6,
    recommended: false,
    tone: "#4b3488",
    accent: "#e6ddff",
    description: "A relaxed Sunday padel group that matches players into friendly games and welcomes anyone curious about the sport.",
    organizer: "Elin Holm",
    schedule: "Every Sunday afternoon",
    nextTraining: { date: "Sunday · 6 September", time: "16:00–17:30", venue: "Malmö Padelcenter", startsAt: seededSessionTimes["mollevangen-padel"][0], endsAt: seededSessionTimes["mollevangen-padel"][1] },
  },
  {
    slug: "lund-loop-club",
    name: "Lund Loop Club",
    sport: "Cycling",
    sportSlug: "cycling",
    location: "Lund · Stadsparken",
    time: "Sat 11:00",
    audience: "Open to all",
    members: "9 going",
    memberCount: "29 members",
    memberTotal: 29,
    goingTotal: 9,
    recommended: false,
    tone: "#804b75",
    accent: "#fbf0f8",
    description: "Easy-paced social rides around Lund with planned breaks, clear routes, and no one left behind.",
    organizer: "Oskar Hall",
    schedule: "Every second Saturday",
    nextTraining: { date: "Saturday · 5 September", time: "11:00–13:00", venue: "Stadsparken north gate", startsAt: seededSessionTimes["lund-loop-club"][0], endsAt: seededSessionTimes["lund-loop-club"][1] },
  },
];
