import { prisma } from "@/lib/db";

type RecurringGroup = {
  id: string;
  slug: string;
  recurrenceWeekday: number | null;
  recurrenceStartTime: string | null;
  recurrenceEndTime: string | null;
  recurrenceVenue: string | null;
  schedule?: string;
  location?: string;
};

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function recurrenceValues(group: RecurringGroup) {
  if (group.recurrenceWeekday !== null && group.recurrenceStartTime && group.recurrenceEndTime && group.recurrenceVenue) {
    return { weekday: group.recurrenceWeekday, startTime: group.recurrenceStartTime, endTime: group.recurrenceEndTime, venue: group.recurrenceVenue };
  }

  const match = group.schedule?.match(/(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\s+(\d{1,2})(?:[.:](\d{2}))?\s+to\s+(\d{1,2})(?:[.:](\d{2}))?/i);
  if (!match) return null;
  const day = weekdays.findIndex((value) => value.toLowerCase() === match[1].toLowerCase());
  const time = (hour: string, minute?: string) => `${hour.padStart(2, "0")}:${(minute ?? "00").padStart(2, "0")}`;
  return { weekday: day, startTime: time(match[2], match[3]), endTime: time(match[4], match[5]), venue: group.location ?? "Training venue" };
}

export function nextDate(weekday: number, time: string, from = new Date()): Date {
  const candidate = new Date(from);
  const [hours, minutes] = time.split(":").map(Number);
  candidate.setHours(hours, minutes, 0, 0);
  let days = (weekday - candidate.getDay() + 7) % 7;
  if (days === 0 && candidate <= from) days = 7;
  candidate.setDate(candidate.getDate() + days);
  return candidate;
}

export async function ensureNextRecurringSession(group: RecurringGroup): Promise<void> {
  const recurrence = recurrenceValues(group);
  if (!recurrence) return;

  const hasUpcoming = await prisma.activitySession.findFirst({
    where: { groupId: group.id, canceled: false, startsAt: { gt: new Date() } },
    select: { id: true },
  });
  if (hasUpcoming) return;

  const startsAt = nextDate(recurrence.weekday, recurrence.startTime);
  const endsAt = nextDate(recurrence.weekday, recurrence.endTime, startsAt);
  const id = `recurring-${group.slug}-${startsAt.toISOString().slice(0, 10)}`;

  await prisma.activitySession.upsert({
    where: { id },
    create: { id, groupId: group.id, title: `${group.slug} weekly training`, startsAt, endsAt, venue: recurrence.venue },
    update: {},
  });
}
