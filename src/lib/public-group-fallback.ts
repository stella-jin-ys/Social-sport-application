import { groupCatalog } from "@/lib/group-catalog";
import type { PublicGroupCard } from "@/modules/groups/contracts";

export const fallbackPublicGroups: PublicGroupCard[] = groupCatalog.map(({ slug, name, sport, sportSlug, location, time, schedule, audience, members, recommended, tone, accent }) => ({
  slug,
  name,
  sport,
  sportSlug,
  location,
  time,
  schedule,
  audience,
  members,
  recommended,
  tone,
  accent,
}));
