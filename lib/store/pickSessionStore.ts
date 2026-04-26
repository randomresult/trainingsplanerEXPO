import { create } from 'zustand';

interface PickSessionStore {
  trainingId: string | null;
  addedExerciseIds: Set<string>;
  addedSeriesIds: Set<string>;
  markAdded: (id: string) => void;
  markSeriesAdded: (id: string) => void;
  /** Call on picker open — only resets if the training changed. */
  startSession: (trainingId: string, initialExerciseIds?: string[], initialSeriesIds?: string[]) => void;
}

export const usePickSessionStore = create<PickSessionStore>((set, get) => ({
  trainingId: null,
  addedExerciseIds: new Set(),
  addedSeriesIds: new Set(),
  markAdded: (id) => set((s) => ({ addedExerciseIds: new Set(s.addedExerciseIds).add(id) })),
  markSeriesAdded: (id) => set((s) => ({ addedSeriesIds: new Set(s.addedSeriesIds).add(id) })),
  startSession: (trainingId, initialExerciseIds, initialSeriesIds) => {
    if (get().trainingId === trainingId) return;
    set({
      trainingId,
      addedExerciseIds: new Set(initialExerciseIds ?? []),
      addedSeriesIds: new Set(initialSeriesIds ?? []),
    });
  },
}));
