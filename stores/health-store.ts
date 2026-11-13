import { create } from "zustand";
import { readStoredSpaceProfile, type SpaceProfile } from "@/lib/space";

type Page = "dashboard" | "food" | "plans" | "exercise" | "coach" | "review" | "profile";
type HealthState = {
  page: Page;
  waterAdded: number;
  demoData: boolean;
  mealNote: string;
  confirmed: boolean;
  spaceProfile: SpaceProfile | null;
  setPage: (page: Page) => void;
  addWater: (amount?: number) => void;
  setDemoData: (demo: boolean) => void;
  setMealNote: (note: string) => void;
  confirmMeal: () => void;
  resetMealConfirmation: () => void;
  setSpaceProfile: (profile: SpaceProfile | null) => void;
  hydrateSpaceProfile: () => void;
};

export const useHealthStore = create<HealthState>((set) => ({
  page: "dashboard",
  waterAdded: 0,
  demoData: false,
  mealNote: "",
  confirmed: false,
  spaceProfile: null,
  setPage: (page) => set({ page }),
  addWater: (amount = 250) => set((state) => ({ waterAdded: state.waterAdded + Math.max(0, amount) })),
  setDemoData: (demoData) => set({ demoData }),
  setMealNote: (mealNote) => set({ mealNote }),
  confirmMeal: () => set({ confirmed: true }),
  resetMealConfirmation: () => set({ confirmed: false }),
  setSpaceProfile: (spaceProfile) => set({ spaceProfile }),
  hydrateSpaceProfile: () => set((state) => state.spaceProfile ? state : { spaceProfile: readStoredSpaceProfile() }),
}));
