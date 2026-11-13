import { create } from "zustand";

type Page = "dashboard" | "food" | "plans" | "exercise" | "coach" | "review" | "profile";
type HealthState = {
  page: Page;
  waterAdded: number;
  demoData: boolean;
  mealNote: string;
  confirmed: boolean;
  setPage: (page: Page) => void;
  addWater: (amount?: number) => void;
  setDemoData: (demo: boolean) => void;
  setMealNote: (note: string) => void;
  confirmMeal: () => void;
  resetMealConfirmation: () => void;
};

export const useHealthStore = create<HealthState>((set) => ({
  page: "dashboard",
  waterAdded: 0,
  demoData: false,
  mealNote: "",
  confirmed: false,
  setPage: (page) => set({ page }),
  addWater: (amount = 250) => set((state) => ({ waterAdded: state.waterAdded + Math.max(0, amount) })),
  setDemoData: (demoData) => set({ demoData }),
  setMealNote: (mealNote) => set({ mealNote }),
  confirmMeal: () => set({ confirmed: true }),
  resetMealConfirmation: () => set({ confirmed: false }),
}));
