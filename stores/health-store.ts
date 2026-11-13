import { create } from "zustand";
import type { SpaceProfile } from "@/lib/space";

export type Page = "dashboard" | "food" | "plans" | "exercise" | "coach" | "review" | "profile";
type HealthState = {
  page: Page;
  visitedPages: Page[];
  waterAdded: number;
  mealNote: string;
  confirmed: boolean;
  spaceProfile: SpaceProfile | null;
  setPage: (page: Page) => void;
  addWater: (amount?: number) => void;
  setWaterAdded: (amount: number) => void;
  setMealNote: (note: string) => void;
  confirmMeal: () => void;
  resetMealConfirmation: () => void;
  setSpaceProfile: (profile: SpaceProfile | null) => void;
};

export const useHealthStore = create<HealthState>((set) => ({
  page: "dashboard",
  visitedPages: ["dashboard"],
  waterAdded: 0,
  mealNote: "",
  confirmed: false,
  spaceProfile: null,
  setPage: (page) => set((state) => state.visitedPages.includes(page) ? { page } : { page, visitedPages: [...state.visitedPages, page] }),
  addWater: (amount = 250) => set((state) => ({ waterAdded: state.waterAdded + Math.max(0, amount) })),
  setWaterAdded: (amount) => set({ waterAdded: Math.max(0, Math.round(amount)) }),
  setMealNote: (mealNote) => set({ mealNote }),
  confirmMeal: () => set({ confirmed: true }),
  resetMealConfirmation: () => set({ confirmed: false }),
  setSpaceProfile: (spaceProfile) => set({ spaceProfile }),
}));
