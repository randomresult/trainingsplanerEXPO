import { create } from 'zustand';

// Multi-select mode — caller receives the final selection on confirm.
// Still used by the player-picker (and anything that wants a batch pick).
type OnConfirmCallback = (ids: string[]) => void | Promise<void>;

// Single-add mode — caller receives one id at a time as the user taps + on
// each card. Used by training-new.tsx → exercise-picker flow.
type OnAddCallback = (id: string) => void | Promise<void>;

interface PickModeStore {
  /** True while a caller has initiated a pick flow and it hasn't resolved. */
  active: boolean;

  // Multi-select state
  selectedIds: string[];
  onConfirm?: OnConfirmCallback;

  // Single-add state
  onAdd?: OnAddCallback;

  start: (initial: string[], onConfirm: OnConfirmCallback) => void;
  startAdd: (onAdd: OnAddCallback) => void;
  toggle: (id: string) => void;
  confirm: () => Promise<void>;
  cancel: () => void;
}

export const usePickModeStore = create<PickModeStore>((set, get) => ({
  active: false,
  selectedIds: [],
  onConfirm: undefined,
  onAdd: undefined,

  start: (initial, onConfirm) =>
    set({
      active: true,
      selectedIds: initial,
      onConfirm,
      onAdd: undefined,
    }),

  startAdd: (onAdd) =>
    set({
      active: true,
      onAdd,
      onConfirm: undefined,
      selectedIds: [],
    }),

  toggle: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((x) => x !== id)
        : [...s.selectedIds, id],
    })),

  confirm: async () => {
    const { onConfirm, selectedIds } = get();
    try {
      await onConfirm?.(selectedIds);
    } finally {
      set({ active: false, selectedIds: [], onConfirm: undefined, onAdd: undefined });
    }
  },

  cancel: () =>
    set({ active: false, selectedIds: [], onConfirm: undefined, onAdd: undefined }),
}));
