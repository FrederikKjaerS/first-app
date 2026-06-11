export type Category = "Forret" | "Hovedret" | "Tilbehør" | "Dessert";

export type Recipe = {
  readonly id: string;
  readonly name: string;
  readonly category: Category;
  readonly link: string;
  readonly image: string;
  readonly custom?: boolean;
};

export const DAY_KEYS = [
  "mandag",
  "tirsdag",
  "onsdag",
  "torsdag",
  "fredag",
  "loerdag",
  "soendag",
] as const;

export type DayKey = (typeof DAY_KEYS)[number];

export const DAY_LABELS: Readonly<Record<DayKey, string>> = {
  mandag: "Mandag",
  tirsdag: "Tirsdag",
  onsdag: "Onsdag",
  torsdag: "Torsdag",
  fredag: "Fredag",
  loerdag: "Lørdag",
  soendag: "Søndag",
};

export type WeekPlan = Readonly<Partial<Record<DayKey, string>>>;
