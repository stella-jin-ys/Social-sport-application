import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { AttendanceChoice, GroupPageData, PublicGroupCard } from "./contracts";

type GroupWithNextSession = Prisma.GroupGetPayload<{
  include: { sessions: true };
}>;

const audienceLabels = {
  WOMEN_ONLY: "Women only",
  MEN_ONLY: "Men only",
  MIXED: "Mixed group",
  OPEN: "Open to all",
} as const;

const stockholmDateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Stockholm",
});

const stockholmTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Europe/Stockholm",
});

function toCard(group: GroupWithNextSession): PublicGroupCard {
  const next = group.sessions[0];

  return {
    slug: group.slug,
    name: group.name,
    sport: group.sport,
    sportSlug: group.sportSlug,
    location: group.location,
    time: group.timeLabel,
    schedule: group.schedule,
    audience: audienceLabels[group.participation],
    members: `${next?.goingCount ?? 0} going`,
    recommended: group.recommended,
    tone: group.tone,
    accent: group.accent,
  };
}

function formatDate(date: Date): string {
  const parts = stockholmDateFormatter.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;

  return `${value("weekday")} · ${value("day")} ${value("month")}`;
}

function toGroupPageData(
  group: GroupWithNextSession,
  viewer: GroupPageData["viewer"],
): GroupPageData {
  const next = group.sessions[0];

  return {
    ...toCard(group),
    memberCount: group.memberCount,
    description: group.description,
    organizer: group.organizerName,
    schedule: group.schedule,
    viewer,
    nextTraining: next
      ? {
          id: next.id,
          date: formatDate(next.startsAt),
          time: `${stockholmTimeFormatter.format(next.startsAt)}–${stockholmTimeFormatter.format(next.endsAt)}`,
          venue: next.venue,
          goingCount: next.goingCount,
        }
      : null,
  };
}

const nextSession = {
  where: { canceled: false },
  orderBy: { startsAt: "asc" },
  take: 1,
} as const;

export async function listPublicGroups(): Promise<PublicGroupCard[]> {
  const groups = await prisma.group.findMany({
    include: { sessions: nextSession },
    orderBy: [{ recommended: "desc" }, { name: "desc" }],
  });

  return groups.map(toCard);
}

export async function getGroupPageData(
  slug: string,
  userId?: string,
): Promise<GroupPageData | null> {
  if (!userId) {
    const group = await prisma.group.findUnique({
      where: { slug },
      include: { sessions: nextSession },
    });

    return group
      ? toGroupPageData(group, {
          isAuthenticated: false,
          isMember: false,
          attendanceStatus: null,
        })
      : null;
  }

  const group = await prisma.group.findUnique({
    where: { slug },
    include: {
      memberships: {
        where: { userId, status: "ACTIVE" },
        select: { id: true },
      },
      sessions: {
        ...nextSession,
        include: {
          attendance: {
            where: { userId },
            select: { status: true },
          },
        },
      },
    },
  });

  if (!group) {
    return null;
  }

  return toGroupPageData(group, {
    isAuthenticated: true,
    isMember: group.memberships.length > 0,
    attendanceStatus: group.sessions[0]?.attendance[0]?.status as AttendanceChoice | undefined ?? null,
  });
}
