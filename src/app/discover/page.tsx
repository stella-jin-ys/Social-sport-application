import { connection } from "next/server";
import { listPublicGroups } from "@/modules/groups/group-queries";
import { fallbackPublicGroups } from "@/lib/public-group-fallback";
import { DiscoverClient } from "./discover-client";

export default async function DiscoverPage() {
  await connection();

  try {
    return <DiscoverClient groups={await listPublicGroups()} />;
  } catch (error) {
    console.error("Failed to load public groups", error);
    return <DiscoverClient groups={fallbackPublicGroups} />;
  }
}
