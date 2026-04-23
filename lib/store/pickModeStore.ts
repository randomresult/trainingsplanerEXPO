import { create } from 'zustand';

// Callback may be async — e.g. training-detail awaits a bulk-add mutation
// before the picker should close. Sync callers (like setState) just return
// undefined and `await undefined` is a no-op.
type OnConfirmCallback = (ids: string[]) => void | Promise<void>;

interface PickModeStore {
  /** True while a caller has initiated pick-mode and the Library has not yet confirmed or cancelled. */
  active: boolean;
  /** Currently toggled ids — mutated by the Library on each tap. */
  selectedIds: string[];
  /** Callback that receives the final selection on confirm. Set by the caller via start(). */
  onConfirm?: OnConfirmCallback;

  start: (initial: string[], onConfirm: OnConfirmCallback) => void;
  toggle: (id: string) => void;
  confirm: () => Promise<void>;
  cancel: () => void;
}

export const usePickModeStore = create<PickModeStore>((set, get) => ({
  active: false,
  selectedIds: [],
  onConfirm: undefined,

  start: (initial, onConfirm) =>
    set({ active: true, selectedIds: initial, onConfirm }),

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
      set({ active: false, selectedIds: [], onConfirm: undefined });
    }
  },

  cancel: () => set({ active: false, selectedIds: [], onConfirm: undefined }),
}));
