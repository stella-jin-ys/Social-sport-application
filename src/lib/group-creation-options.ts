export const sportOptions = ["Innebandy", "Football", "Running", "Volleyball", "Cycling", "Padel"] as const;

export const participationOptions = [
  { label: "Women only", value: "WOMEN_ONLY" },
  { label: "Men only", value: "MEN_ONLY" },
  { label: "Mixed group", value: "MIXED" },
  { label: "Open to all", value: "OPEN" },
] as const;

export const sportColors = {
  Innebandy: ["#7d2d20", "#ffd9cd"],
  Football: ["#3158b7", "#f0f3ff"],
  Running: ["#8c6110", "#fff8dd"],
  Volleyball: ["#347865", "#edf7ef"],
  Cycling: ["#804b75", "#fbf0f8"],
  Padel: ["#4b3488", "#e6ddff"],
} as const;

export type SportOption = (typeof sportOptions)[number];
export type ParticipationOption = (typeof participationOptions)[number]["value"];
