import { prisma } from "@/lib/db";
import { groupCatalog } from "@/lib/group-catalog";

const participation = {
  "Women only": "WOMEN_ONLY",
  "Men only": "MEN_ONLY",
  "Mixed group": "MIXED",
  "Open to all": "OPEN",
} as const;

const recurrenceBySlug = {
  "soder-sparks": { weekday: 2, startTime: "18:30", endTime: "20:00", venue: "Eriksdalsskolan sports hall" },
  "parken-5-a-side": { weekday: 3, startTime: "19:00", endTime: "20:30", venue: "Vasaparken football pitch" },
  "sunrise-miles": { weekday: 6, startTime: "09:15", endTime: "10:30", venue: "Djurgårdsbron meeting point" },
  "volley-after-work": { weekday: 4, startTime: "18:00", endTime: "19:30", venue: "Kungsholmens gymnasium" },
  "mollevangen-padel": { weekday: 0, startTime: "16:00", endTime: "17:30", venue: "Malmö Padelcenter" },
  "lund-loop-club": { weekday: 6, startTime: "11:00", endTime: "13:00", venue: "Stadsparken north gate" },
} as const;

export async function seedGroups(): Promise<void> {
  for (const group of groupCatalog) {
    const publicValues = {
      name: group.name,
      sport: group.sport,
      sportSlug: group.sportSlug,
      location: group.location,
      timeLabel: group.time,
      participation: participation[group.audience],
      membershipMode: "PUBLIC_OPEN" as const,
      recommended: group.recommended,
      tone: group.tone,
      accent: group.accent,
      description: group.description,
      organizerName: group.organizer,
      schedule: group.schedule,
      recurrenceWeekday: recurrenceBySlug[group.slug as keyof typeof recurrenceBySlug]?.weekday ?? null,
      recurrenceStartTime: recurrenceBySlug[group.slug as keyof typeof recurrenceBySlug]?.startTime ?? null,
      recurrenceEndTime: recurrenceBySlug[group.slug as keyof typeof recurrenceBySlug]?.endTime ?? null,
      recurrenceVenue: recurrenceBySlug[group.slug as keyof typeof recurrenceBySlug]?.venue ?? null,
    };

    const saved = await prisma.group.upsert({
      where: { slug: group.slug },
      update: publicValues,
      create: { slug: group.slug, memberCount: group.memberTotal, ...publicValues },
    });

    const sessionPublicValues = {
      groupId: saved.id,
      title: `${group.name} training`,
      startsAt: new Date(group.nextTraining.startsAt),
      endsAt: new Date(group.nextTraining.endsAt),
      venue: group.nextTraining.venue,
      canceled: false,
    };

    await prisma.activitySession.upsert({
      where: { id: `session-${group.slug}-next` },
      update: sessionPublicValues,
      create: {
        id: `session-${group.slug}-next`,
        goingCount: group.goingTotal,
        ...sessionPublicValues,
      },
    });
  }
}
