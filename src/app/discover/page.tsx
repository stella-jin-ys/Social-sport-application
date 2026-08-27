import { listPublicGroups } from "@/modules/groups/group-queries";
import { DiscoverClient } from "./discover-client";

export default async function DiscoverPage() {
  return <DiscoverClient groups={await listPublicGroups()} />;
}
