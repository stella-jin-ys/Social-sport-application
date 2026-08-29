import {
  participationOptions,
  sportOptions,
  type ParticipationOption,
  type SportOption,
} from "@/lib/group-creation-options";

export type GroupCreationInput = {
  name: string;
  sport: SportOption;
  city: string;
  participation: ParticipationOption;
  description: string;
  schedule: string;
};

export function parseGroupCreationInput(formData: FormData): GroupCreationInput | null {
  const name = String(formData.get("name") ?? "").trim();
  const sport = String(formData.get("sport") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const participation = String(formData.get("participation") ?? "OPEN");
  const description = String(formData.get("description") ?? "").trim();
  const isRecurring = formData.get("recurring") === "on";
  const rhythm = String(formData.get("rhythm") ?? "").trim();

  if (
    !name ||
    !city ||
    !description ||
    !sportOptions.includes(sport as SportOption) ||
    !participationOptions.some((option) => option.value === participation) ||
    (isRecurring && !rhythm)
  ) {
    return null;
  }

  return {
    name,
    sport: sport as SportOption,
    city,
    participation: participation as ParticipationOption,
    description,
    schedule: isRecurring ? rhythm : "Flexible or one-time schedule",
  };
}
