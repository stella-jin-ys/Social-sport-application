import { connection } from "next/server";
import { listPublicGroups } from "@/modules/groups/group-queries";
import { DiscoverClient } from "./discover-client";

export default async function DiscoverPage() {
  await connection();

  return <DiscoverClient groups={await listPublicGroups()} />;
}
