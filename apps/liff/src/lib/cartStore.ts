import { create } from "zustand";
import type { CaseSummaryDto } from "@nesicle/shared";
import { api } from "./api";

interface CartState {
  items: CaseSummaryDto[];
  hydrated: boolean;
  /** Loads the current selection from the server. Call once a session is confirmed. */
  hydrate: () => Promise<void>;
  add: (item: CaseSummaryDto) => void;
  remove: (caseId: string) => void;
  toggle: (item: CaseSummaryDto) => void;
  has: (caseId: string) => boolean;
  clear: () => void;
}

// Selection ("checked" cases pending referral-URL issuance) is persisted server-side
// (ReferralSelection table) so it survives across devices/browsers, not just this one's
// localStorage. Every mutation below updates local state immediately for a responsive UI,
// then syncs to the API in the background.
export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  hydrated: false,
  hydrate: async () => {
    try {
      const items = await api.get<CaseSummaryDto[]>("/api/me/selection");
      set({ items, hydrated: true });
    } catch (err) {
      console.error("[selection] failed to load from server:", err);
      set({ hydrated: true });
    }
  },
  add: (item) => {
    if (get().items.some((i) => i.id === item.id)) return;
    set((state) => ({ items: [...state.items, item] }));
    api.post("/api/me/selection", { caseId: item.id }).catch((err) => {
      console.error("[selection] failed to sync add:", err);
    });
  },
  remove: (caseId) => {
    set((state) => ({ items: state.items.filter((i) => i.id !== caseId) }));
    api.delete(`/api/me/selection/${caseId}`).catch((err) => {
      console.error("[selection] failed to sync remove:", err);
    });
  },
  toggle: (item) => {
    if (get().has(item.id)) {
      get().remove(item.id);
    } else {
      get().add(item);
    }
  },
  has: (caseId) => get().items.some((i) => i.id === caseId),
  clear: () => {
    set({ items: [] });
    api.delete("/api/me/selection").catch((err) => {
      console.error("[selection] failed to sync clear:", err);
    });
  },
}));
