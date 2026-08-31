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
  recurrenceWeekday: number | null;
  recurrenceStartTime: string | null;
  recurrenceEndTime: string | null;
  recurrenceVenue: string | null;
};

export function parseGroupCreationInput(formData: FormData): GroupCreationInput | null {
  const name = String(formData.get("name") ?? "").trim();
  const sport = String(formData.get("sport") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const participation = String(formData.get("participation") ?? "OPEN");
  const description = String(formData.get("description") ?? "").trim();
  const isRecurring = formData.get("recurring") === "on";
  const weekday = Number(formData.get("weekday"));
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const venue = String(formData.get("venue") ?? "").trim();
  const validTime = (value: string) => /^\d{2}:\d{2}$/.test(value);

  if (
    !name ||
    !city ||
    !description ||
    !sportOptions.includes(sport as SportOption) ||
    !participationOptions.some((option) => option.value === participation) ||
    (isRecurring && (!Number.isInteger(weekday) || weekday < 0 || weekday > 6 || !validTime(startTime) || !validTime(endTime) || !venue || endTime <= startTime))
  ) {
    return null;
  }

  return {
    name,
    sport: sport as SportOption,
    city,
    participation: participation as ParticipationOption,
    description,
    schedule: isRecurring ? `Every ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][weekday]} at ${startTime}` : "Flexible or one-time schedule",
    recurrenceWeekday: isRecurring ? weekday : null,
    recurrenceStartTime: isRecurring ? startTime : null,
    recurrenceEndTime: isRecurring ? endTime : null,
    recurrenceVenue: isRecurring ? venue : null,
  };
}
