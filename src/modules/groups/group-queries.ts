import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { AttendanceChoice, GroupCommentView, GroupPageData, JoinedGroupCard, PublicGroupCard, UpcomingActivity } from "./contracts";
import { ensureNextRecurringSession } from "./recurrence";

type GroupWithNextSession = Prisma.GroupGetPayload<{
  include: { sessions: true };
}>;

type GroupCommentRecord = {
  id: string;
  body: string;
  createdAt: Date;
  user: { name: string };
};

type GroupWithComments = GroupWithNextSession & { comments: GroupCommentRecord[] };

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
  group: GroupWithComments,
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
          title: next.title,
          startsAt: next.startsAt.toISOString(),
          endsAt: next.endsAt.toISOString(),
          date: formatDate(next.startsAt),
          time: `${stockholmTimeFormatter.format(next.startsAt)}–${stockholmTimeFormatter.format(next.endsAt)}`,
          venue: next.venue,
          goingCount: next.goingCount,
        }
      : null,
    recurrence: group.recurrenceWeekday !== null && group.recurrenceStartTime && group.recurrenceEndTime && group.recurrenceVenue
      ? {
          weekday: group.recurrenceWeekday,
          startTime: group.recurrenceStartTime,
          endTime: group.recurrenceEndTime,
          venue: group.recurrenceVenue,
        }
      : null,
    comments: group.comments.map((comment): GroupCommentView => ({
      id: comment.id,
      body: comment.body,
      authorName: comment.user.name,
      createdAt: comment.createdAt.toISOString(),
    })),
  };
}

const nextSession = {
  where: { canceled: false },
  orderBy: { startsAt: "asc" },
  take: 1,
} as const;

const nextUpcomingSession = {
  where: { canceled: false, startsAt: { gt: new Date() } },
  orderBy: { startsAt: "asc" },
  take: 1,
} as const;

function toActivity(group: { slug: string; name: string }, session: { id: string; title: string; startsAt: Date; endsAt: Date; venue: string; goingCount: number }): UpcomingActivity {
  return {
    id: session.id,
    groupSlug: group.slug,
    groupName: group.name,
    title: session.title,
    startsAt: session.startsAt.toISOString(),
    endsAt: session.endsAt.toISOString(),
    venue: session.venue,
    goingCount: session.goingCount,
  };
}

export async function listPublicGroups(): Promise<PublicGroupCard[]> {
  const groups = await prisma.group.findMany({
    include: { sessions: nextSession },
    orderBy: [{ recommended: "desc" }, { name: "desc" }],
  });

  return groups.map(toCard);
}

export async function listJoinedGroups(userId: string): Promise<JoinedGroupCard[]> {
  const memberships = await prisma.groupMembership.findMany({
    where: { userId, status: "ACTIVE" },
    include: { group: { include: { sessions: nextUpcomingSession } } },
    orderBy: { joinedAt: "asc" },
  });

  return memberships.map((membership) => ({
    ...toCard({ ...membership.group, sessions: membership.group.sessions }),
    membershipId: membership.id,
    joinedAt: membership.joinedAt.toISOString(),
    nextActivity: membership.group.sessions[0] ? toActivity(membership.group, membership.group.sessions[0]) : null,
  }));
}

export async function listUpcomingActivities(userId: string): Promise<UpcomingActivity[]> {
  const sessions = await prisma.activitySession.findMany({
    where: {
      canceled: false,
      startsAt: { gt: new Date() },
      group: { memberships: { some: { userId, status: "ACTIVE" } } },
    },
    include: { group: { select: { slug: true, name: true } } },
    orderBy: { startsAt: "asc" },
  });

  return sessions.map((session) => toActivity(session.group, session));
}

export async function listRecommendedGroups(userId: string): Promise<PublicGroupCard[]> {
  const groups = await prisma.group.findMany({
    where: { memberships: { none: { userId, status: "ACTIVE" } } },
    include: { sessions: nextSession },
    orderBy: [{ recommended: "desc" }, { name: "desc" }],
  });

  return groups.map(toCard);
}

export async function getGroupPageData(
  slug: string,
  userId?: string,
): Promise<GroupPageData | null> {
  const recurringGroup = await prisma.group.findUnique({
    where: { slug },
    select: { id: true, slug: true, recurrenceWeekday: true, recurrenceStartTime: true, recurrenceEndTime: true, recurrenceVenue: true },
  });
  if (recurringGroup) await ensureNextRecurringSession(recurringGroup);

  if (!userId) {
    const group = await prisma.group.findUnique({
      where: { slug },
      include: {
        sessions: nextSession,
        comments: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    return group
      ? toGroupPageData(group, {
          isAuthenticated: false,
          isMember: false,
          canEdit: false,
          attendanceStatus: null,
        })
      : null;
  }

  const group = await prisma.group.findUnique({
    where: { slug },
    include: {
      memberships: {
        where: { userId, status: "ACTIVE" },
        select: { id: true, role: true },
      },
      comments: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
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
    canEdit: group.memberships.some((membership) => membership.role === "ORGANIZER"),
    attendanceStatus: group.sessions[0]?.attendance[0]?.status as AttendanceChoice | undefined ?? null,
  });
}
