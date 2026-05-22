export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED";
export type GatewayStatus = "SUCCESS" | "FAILED";

export type Park =
  | "YALA"
  | "UDAWALAWE"
  | "BUNDALA"
  | "LUNUGAMWEHERA"
  | "OTHER";

export type SafariType =
  | "PRIVATE_JEEP"
  | "SHARED_JEEP"
  | "PARK_TICKETS_ONLY"
  | "CUSTOM";

export type TimeSlot = "MORNING" | "EVENING" | "FULL_DAY";

export type MealPlan = "NONE" | "MORNING_BREAKFAST" | "FULL_DAY_MEALS";

export type MealPreference = "NONE" | "VEGAN" | "VEGETARIAN" | "NON_VEG";

export const PARKS: readonly Park[] = [
  "YALA",
  "UDAWALAWE",
  "BUNDALA",
  "LUNUGAMWEHERA",
  "OTHER",
] as const;

export const SAFARI_TYPES: readonly SafariType[] = [
  "PRIVATE_JEEP",
  "SHARED_JEEP",
  "PARK_TICKETS_ONLY",
  "CUSTOM",
] as const;

export const TIME_SLOTS: readonly TimeSlot[] = [
  "MORNING",
  "EVENING",
  "FULL_DAY",
] as const;

export const MEAL_PLANS: readonly MealPlan[] = [
  "NONE",
  "MORNING_BREAKFAST",
  "FULL_DAY_MEALS",
] as const;

export const MEAL_PREFERENCES: readonly MealPreference[] = [
  "NONE",
  "VEGAN",
  "VEGETARIAN",
  "NON_VEG",
] as const;

export const PARK_LABELS: Record<Park, string> = {
  YALA: "Yala National Park",
  UDAWALAWE: "Udawalawe National Park",
  BUNDALA: "Bundala National Park",
  LUNUGAMWEHERA: "Lunugamwehera National Park",
  OTHER: "Other (specify in notes)",
};

export const SAFARI_TYPE_LABELS: Record<SafariType, string> = {
  PRIVATE_JEEP: "Private Jeep Safari (per jeep)",
  SHARED_JEEP: "Shared Jeep Safari (per person)",
  PARK_TICKETS_ONLY: "Park Tickets only",
  CUSTOM: "Custom (specify in notes)",
};

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  MORNING: "Morning (4:50 AM – 10:00 AM)",
  EVENING: "Evening (1:30 PM – 6:30 PM)",
  FULL_DAY: "Full-Day (4:50 AM – 6:30 PM)",
};

export const MEAL_PLAN_LABELS: Record<MealPlan, string> = {
  NONE: "No meals",
  MORNING_BREAKFAST: "Morning Breakfast (LKR 1,500/person)",
  FULL_DAY_MEALS: "Full-Day Breakfast + Lunch (LKR 5,500/person)",
};

export const MEAL_PREFERENCE_LABELS: Record<MealPreference, string> = {
  NONE: "None",
  VEGAN: "Vegan",
  VEGETARIAN: "Vegetarian",
  NON_VEG: "Non-Vegetarian",
};

export interface PaymentRequest {
  id: string;
  shortRef: string;
  token: string;
  customerName: string;
  email: string | null;
  phone: string | null;
  packageName: string | null;
  park: Park | null;
  safariType: SafariType | null;
  timeSlot: TimeSlot | null;
  mealPlan: MealPlan | null;
  mealPreference: MealPreference | null;
  safariDate: string | null;
  guests: number | null;
  notes: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  expiresAt: string;
  createdAt: string;
  createdBy: string;
}

export interface Payment {
  id: string;
  paymentRequestId: string;
  gateway: string;
  transactionId: string;
  status: GatewayStatus;
  amount: number;
  currency: string;
  paidAt: string;
  rawResponse: string;
}

export interface CreatePaymentRequestInput {
  customerName: string;
  email?: string;
  phone?: string;
  packageName?: string;
  park?: Park;
  safariType?: SafariType;
  timeSlot?: TimeSlot;
  mealPlan?: MealPlan;
  mealPreference?: MealPreference;
  safariDate?: string;
  guests?: number;
  notes?: string;
  amount: number;
  currency?: string;
  expiresInHours?: number;
  createdBy: string;
}

export interface ListPaymentRequestsOptions {
  page: number;
  limit: number;
  search?: string;
  status?: PaymentStatus | "";
}

export interface PaginatedPaymentRequests {
  data: PaymentRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function makeShortRef(id: string): string {
  return id.replace(/-/g, "").slice(0, 21);
}
