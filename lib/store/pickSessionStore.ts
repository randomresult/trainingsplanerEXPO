import { create } from 'zustand';

interface PickSessionStore {
  trainingId: string | null;
  addedExerciseIds: Set<string>;
  addedSeriesIds: Set<string>;
  markAdded: (id: string) => void;
  markSeriesAdded: (id: string) => void;
  /**
   * Reset the session for a training. Always overwrites the sets with the
   * provided IDs, even when `trainingId` is unchanged. Callers should pass the
   * authoritative server-side state (training.exercises + training.methodicalSeries)
   * so the picker reflects what's actually persisted, not stale in-session adds.
   */
  startSession: (trainingId: string, initialExerciseIds?: string[], initialSeriesIds?: string[]) => void;
}

export const usePickSessionStore = create<PickSessionStore>((set) => ({
  trainingId: null,
  addedExerciseIds: new Set(),
  addedSeriesIds: new Set(),
  markAdded: (id) => set((s) => ({ addedExerciseIds: new Set(s.addedExerciseIds).add(id) })),
  markSeriesAdded: (id) => set((s) => ({ addedSeriesIds: new Set(s.addedSeriesIds).add(id) })),
  startSession: (trainingId, initialExerciseIds, initialSeriesIds) => {
    set({
      trainingId,
      addedExerciseIds: new Set(initialExerciseIds ?? []),
      addedSeriesIds: new Set(initialSeriesIds ?? []),
    });
  },
}));
