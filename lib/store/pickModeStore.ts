import { create } from 'zustand';

type OnConfirmCallback = (ids: string[]) => void;

interface PickModeStore {
  /** True while a caller has initiated pick-mode and the Library has not yet confirmed or cancelled. */
  active: boolean;
  /** Currently toggled ids — mutated by the Library on each tap. */
  selectedIds: string[];
  /** Callback that receives the final selection on confirm. Set by the caller via start(). */
  onConfirm?: OnConfirmCallback;

  start: (initial: string[], onConfirm: OnConfirmCallback) => void;
  toggle: (id: string) => void;
  confirm: () => void;
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

  confirm: () => {
    const { onConfirm, selectedIds } = get();
    onConfirm?.(selectedIds);
    set({ active: false, selectedIds: [], onConfirm: undefined });
  },

  cancel: () => set({ active: false, selectedIds: [], onConfirm: undefined }),
}));
