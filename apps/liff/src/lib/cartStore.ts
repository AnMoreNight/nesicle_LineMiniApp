import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CaseSummaryDto } from "@nesicle/shared";

interface CartState {
  items: CaseSummaryDto[];
  add: (item: CaseSummaryDto) => void;
  remove: (caseId: string) => void;
  toggle: (item: CaseSummaryDto) => void;
  has: (caseId: string) => boolean;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((state) => (state.items.some((i) => i.id === item.id) ? state : { items: [...state.items, item] })),
      remove: (caseId) => set((state) => ({ items: state.items.filter((i) => i.id !== caseId) })),
      toggle: (item) => {
        if (get().has(item.id)) {
          get().remove(item.id);
        } else {
          get().add(item);
        }
      },
      has: (caseId) => get().items.some((i) => i.id === caseId),
      clear: () => set({ items: [] }),
    }),
    { name: "nesicle-referral-cart", skipHydration: true },
  ),
);
