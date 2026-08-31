import { prisma } from "@/lib/db";

type RecurringGroup = {
  id: string;
  slug: string;
  recurrenceWeekday: number | null;
  recurrenceStartTime: string | null;
  recurrenceEndTime: string | null;
  recurrenceVenue: string | null;
};

function nextDate(weekday: number, time: string, from = new Date()): Date {
  const candidate = new Date(from);
  const [hours, minutes] = time.split(":").map(Number);
  candidate.setHours(hours, minutes, 0, 0);
  let days = (weekday - candidate.getDay() + 7) % 7;
  if (days === 0 && candidate <= from) days = 7;
  candidate.setDate(candidate.getDate() + days);
  return candidate;
}

export async function ensureNextRecurringSession(group: RecurringGroup): Promise<void> {
  if (group.recurrenceWeekday === null || !group.recurrenceStartTime || !group.recurrenceEndTime || !group.recurrenceVenue) return;

  const hasUpcoming = await prisma.activitySession.findFirst({
    where: { groupId: group.id, canceled: false, startsAt: { gt: new Date() } },
    select: { id: true },
  });
  if (hasUpcoming) return;

  const startsAt = nextDate(group.recurrenceWeekday, group.recurrenceStartTime);
  const endsAt = nextDate(group.recurrenceWeekday, group.recurrenceEndTime, startsAt);
  const id = `recurring-${group.slug}-${startsAt.toISOString().slice(0, 10)}`;

  await prisma.activitySession.upsert({
    where: { id },
    create: { id, groupId: group.id, title: `${group.slug} weekly training`, startsAt, endsAt, venue: group.recurrenceVenue },
    update: {},
  });
}
