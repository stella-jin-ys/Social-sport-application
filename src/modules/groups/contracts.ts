export type Audience = "Women only" | "Mixed group" | "Open to all";
export type AttendanceChoice = "GOING" | "NOT_GOING";

export type PublicGroupCard = {
  slug: string;
  name: string;
  sport: string;
  sportSlug: string;
  location: string;
  time: string;
  audience: Audience;
  members: string;
  recommended: boolean;
  tone: string;
  accent: string;
};

export type GroupPageData = PublicGroupCard & {
  memberCount: number;
  description: string;
  organizer: string;
  schedule: string;
  viewer: {
    isAuthenticated: boolean;
    isMember: boolean;
    attendanceStatus: AttendanceChoice | null;
  };
  nextTraining: {
    id: string;
    date: string;
    time: string;
    venue: string;
    goingCount: number;
  } | null;
};
