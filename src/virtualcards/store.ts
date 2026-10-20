// ============================================================
// Store global de la app de cartas visuales (Zustand + persist)
// ============================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AIProvider, CardDesign } from "./types";

interface CardStore {
  providers: AIProvider[];
  cards: CardDesign[];
  selectedCardId: string | null;
  // provider actions
  addProvider: (p: AIProvider) => void;
  updateProvider: (id: string, patch: Partial<AIProvider>) => void;
  removeProvider: (id: string) => void;
  toggleProvider: (id: string) => void;
  // card actions
  addCards: (cards: CardDesign[]) => void;
  updateCard: (id: string, patch: Partial<CardDesign>) => void;
  removeCard: (id: string) => void;
  selectCard: (id: string | null) => void;
}

export const useCardStore = create<CardStore>()(
  persist(
    (set) => ({
      providers: [],
      cards: [],
      selectedCardId: null,
      addProvider: (p) => set((s) => ({ providers: [...s.providers, p] })),
      updateProvider: (id, patch) =>
        set((s) => ({
          providers: s.providers.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removeProvider: (id) =>
        set((s) => ({
          providers: s.providers.filter((p) => p.id !== id),
        })),
      toggleProvider: (id) =>
        set((s) => ({
          providers: s.providers.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)),
        })),
      addCards: (cards) =>
        set((s) => ({
          cards: [...cards, ...s.cards].slice(0, 200),
          selectedCardId: cards[0]?.id ?? s.selectedCardId,
        })),
      updateCard: (id, patch) =>
        set((s) => ({ cards: s.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeCard: (id) =>
        set((s) => {
          const cards = s.cards.filter((c) => c.id !== id);
          const selectedCardId =
            s.selectedCardId === id ? cards[0]?.id ?? null : s.selectedCardId;
          return { cards, selectedCardId };
        }),
      selectCard: (id) => set({ selectedCardId: id }),
    }),
    { name: "virtual-cards-store" }
  )
);
