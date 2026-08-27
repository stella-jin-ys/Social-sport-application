import { prisma } from "@/lib/db";
import { groupCatalog } from "@/lib/group-catalog";

const participation = {
  "Women only": "WOMEN_ONLY",
  "Mixed group": "MIXED",
  "Open to all": "OPEN",
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
