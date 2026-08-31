export type Audience = "Women only" | "Men only" | "Mixed group" | "Open to all";
export type AttendanceChoice = "GOING" | "NOT_GOING";

export type AttendanceResult = {
  status: AttendanceChoice;
  goingCount: number;
};

export type AttendanceActionResult =
  | { ok: true; status: AttendanceChoice; goingCount: number }
  | { ok: false; code: "AUTH_REQUIRED" | "NOT_MEMBER" | "SESSION_NOT_FOUND" | "UNKNOWN"; message: string };

export type JoinResult = {
  membershipId: string;
  joined: boolean;
  memberCount: number;
};

export type JoinGroupActionResult =
  | { ok: true; memberCount: number }
  | { ok: false; code: "AUTH_REQUIRED" | "GROUP_NOT_FOUND" | "GROUP_NOT_OPEN" | "UNKNOWN"; message: string };

export type PublicGroupCard = {
  slug: string;
  name: string;
  sport: string;
  sportSlug: string;
  location: string;
  time: string;
  schedule: string;
  audience: Audience;
  members: string;
  recommended: boolean;
  tone: string;
  accent: string;
};

export type UpcomingActivity = {
  id: string;
  groupSlug: string;
  groupName: string;
  title: string;
  startsAt: string;
  endsAt: string;
  venue: string;
  goingCount: number;
};

export type JoinedGroupCard = PublicGroupCard & {
  membershipId: string;
  joinedAt: string;
  nextActivity: UpcomingActivity | null;
};

export type HomeDashboardData = {
  joinedGroups: JoinedGroupCard[];
  upcomingActivities: UpcomingActivity[];
  recommendedGroups: PublicGroupCard[];
};

export type GroupPageData = PublicGroupCard & {
  memberCount: number;
  description: string;
  organizer: string;
  viewer: {
    isAuthenticated: boolean;
    isMember: boolean;
    canEdit: boolean;
    attendanceStatus: AttendanceChoice | null;
  };
  recurrence: {
    weekday: number;
    startTime: string;
    endTime: string;
    venue: string;
  } | null;
  nextTraining: {
    id: string;
    title?: string;
    startsAt?: string;
    endsAt?: string;
    dateValue?: string;
    startTimeValue?: string;
    endTimeValue?: string;
    date: string;
    time: string;
    venue: string;
    goingCount: number;
  } | null;
  comments: GroupCommentView[];
};

export type GroupCommentView = {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
};

export type CommentActionResult =
  | { ok: true; comment: GroupCommentView }
  | { ok: false; code: "AUTH_REQUIRED" | "NOT_MEMBER" | "GROUP_NOT_FOUND" | "INVALID_BODY" | "UNKNOWN"; message: string };

export type GroupUpdateInput = {
  sport: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
};

export type GroupUpdateActionResult =
  | { ok: true }
  | { ok: false; code: "AUTH_REQUIRED" | "NOT_ORGANIZER" | "GROUP_NOT_FOUND" | "INVALID_INPUT" | "UNKNOWN"; message: string };
