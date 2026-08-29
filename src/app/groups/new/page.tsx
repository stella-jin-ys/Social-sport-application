import Link from "next/link";
import { redirect } from "next/navigation";
import { GroupCreationForm } from "@/components/groups/group-creation-form";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/current-user";
import { sportColors } from "@/lib/group-creation-options";
import { parseGroupCreationInput } from "@/modules/groups/group-creation";

function slugify(value: string) {
  return value.toLowerCase().trim().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function createGroup(formData: FormData) {
  "use server";

  const user = await requireUser();
  const input = parseGroupCreationInput(formData);

  if (!input) {
    return;
  }

  const baseSlug = slugify(input.name) || "sportship-group";
  const slug = `${baseSlug}-${Date.now().toString(36)}`;
  const [tone, accent] = sportColors[input.sport];

  const group = await prisma.$transaction(async (tx) => {
    const created = await tx.group.create({
      data: {
        slug,
        name: input.name,
        sport: input.sport,
        sportSlug: input.sport.toLowerCase(),
        location: input.city,
        timeLabel: "Schedule to be announced",
        participation: input.participation,
        memberCount: 1,
        tone,
        accent,
        description: input.description,
        organizerName: user.name,
        schedule: input.schedule,
        memberships: { create: { userId: user.id, role: "ORGANIZER" } },
      },
    });

    return created;
  });

  redirect(`/groups/${group.slug}`);
}

export default async function NewGroupPage() {
  await requireUser();

  return (
    <main className="min-h-[100dvh] bg-[var(--paper)] text-[var(--ink)]">
      <nav className="mx-auto flex max-w-[900px] items-center justify-between px-5 py-5 sm:px-8">
        <Link className="font-display text-[1.65rem] font-black tracking-[-0.08em]" href="/">Sportship<span className="text-[var(--accent-strong)]">.</span></Link>
        <Link className="text-sm font-extrabold text-[var(--accent-strong)] underline decoration-2 underline-offset-4" href="/">Cancel</Link>
      </nav>
      <section className="mx-auto max-w-[900px] px-5 pb-20 pt-10 sm:px-8 sm:pt-16">
        <h1 className="font-display text-5xl font-black leading-[0.94] tracking-[-0.07em] sm:text-7xl">Start a group.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">Give people nearby an easy way to find your sport, join in, and keep showing up.</p>
        <GroupCreationForm action={createGroup} />
      </section>
    </main>
  );
}
