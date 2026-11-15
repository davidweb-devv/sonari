import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useSettings = create(
  persist(
    (set) => ({
      autoplay: true,
      setAutoplay: (autoplay) => set({ autoplay }),
    }),
    { name: "sonari-settings" }
  )
);