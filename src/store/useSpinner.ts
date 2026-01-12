import { create } from "zustand";

interface SpinnerState {
  spinner: boolean;
  openSpinner: () => void;
  closeSpinner: () => void;
}

export const useSpinnerStore = create<SpinnerState>((set) => ({
  spinner: false,

  openSpinner: () => set({ spinner: true }),
  closeSpinner: () => set({ spinner: false }),
}));
