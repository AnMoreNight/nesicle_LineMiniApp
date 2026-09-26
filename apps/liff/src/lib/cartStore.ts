import { create } from "zustand";
import type { CaseSummaryDto } from "@nesicle/shared";
import { api } from "./api";

interface CartState {
  // The referral queue — cases added via the Cases/Home page's "選択する" button. This is the
  // only thing persisted server-side (ReferralSelection table). Whether a queued item is
  // *checked* for the next issue/delete action is a separate, page-local concern (see the
  // /refer page), not part of this store.
  items: CaseSummaryDto[];
  hydrated: boolean;
  /** Loads the current queue from the server. Call once a session is confirmed. */
  hydrate: () => Promise<void>;
  add: (item: CaseSummaryDto) => void;
  remove: (caseId: string) => void;
  toggle: (item: CaseSummaryDto) => void;
  has: (caseId: string) => boolean;
  /** Deletes exactly the given case ids from the server queue (the "削除" button).
   *  Rejects on failure so callers can show a real error instead of silently leaving local
   *  and server state out of sync. */
  removeMany: (caseIds: string[]) => Promise<void>;
  /** Removes the given ids from the local queue with no server call — for after a successful
   *  "URLを発行", where the backend has already deleted the matching rows as part of creating
   *  the link. */
  removeLocal: (caseIds: string[]) => void;
}

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
  removeMany: async (caseIds) => {
    if (caseIds.length === 0) return;
    const previous = get().items;
    set((state) => ({ items: state.items.filter((i) => !caseIds.includes(i.id)) }));
    try {
      await api.delete("/api/me/selection", { caseIds });
    } catch (err) {
      console.error("[selection] failed to sync removeMany:", err);
      set({ items: previous }); // roll back the optimistic removal so UI matches reality
      throw err;
    }
  },
  removeLocal: (caseIds) => {
    set((state) => ({ items: state.items.filter((i) => !caseIds.includes(i.id)) }));
  },
}));
