import { create } from 'zustand';

type OnAddExercise = (exerciseDocumentId: string) => void;
type OnAddSeries = (seriesDocumentId: string, exerciseDocumentIds: string[]) => void;

interface StartArgs {
  initialExerciseIds: string[];
  initialSeriesIds: string[];
  onAddExercise: OnAddExercise;
  onAddSeries: OnAddSeries;
}

interface DraftPickStore {
  active: boolean;
  initialExerciseIds: Set<string>;
  initialSeriesIds: Set<string>;
  addedExerciseIds: Set<string>;
  addedSeriesIds: Set<string>;
  onAddExercise?: OnAddExercise;
  onAddSeries?: OnAddSeries;

  startDraftPick: (args: StartArgs) => void;
  addExercise: (exerciseDocumentId: string) => void;
  addSeries: (seriesDocumentId: string, exerciseDocumentIds: string[]) => void;
  cancel: () => void;
}

const emptySet = <T,>() => new Set<T>();

/**
 * Handoff store for the "create new training" picker flow.
 *
 * Lifecycle: `startDraftPick` initializes the session; the consumer (today
 * `training-new.tsx`) MUST call `cancel()` on unmount. The store does not
 * self-clean — `library-pick-draft` and the detail screens are intermediate
 * consumers that depend on the session staying alive across navigation.
 *
 * Any new caller of `startDraftPick` must take ownership of `cancel()`.
 */
export const useDraftPickStore = create<DraftPickStore>((set, get) => ({
  active: false,
  initialExerciseIds: emptySet<string>(),
  initialSeriesIds: emptySet<string>(),
  addedExerciseIds: emptySet<string>(),
  addedSeriesIds: emptySet<string>(),
  onAddExercise: undefined,
  onAddSeries: undefined,

  startDraftPick: ({ initialExerciseIds, initialSeriesIds, onAddExercise, onAddSeries }) =>
    set({
      active: true,
      initialExerciseIds: new Set(initialExerciseIds),
      initialSeriesIds: new Set(initialSeriesIds),
      addedExerciseIds: emptySet<string>(),
      addedSeriesIds: emptySet<string>(),
      onAddExercise,
      onAddSeries,
    }),

  addExercise: (exerciseDocumentId) => {
    const s = get();
    if (!s.active || !s.onAddExercise) {
      if (__DEV__) console.warn('[draftPickStore] addExercise called without active session', { exerciseDocumentId });
      return;
    }
    s.onAddExercise(exerciseDocumentId);
    set({ addedExerciseIds: new Set(s.addedExerciseIds).add(exerciseDocumentId) });
  },

  addSeries: (seriesDocumentId, exerciseDocumentIds) => {
    const s = get();
    if (!s.active || !s.onAddSeries) {
      if (__DEV__) console.warn('[draftPickStore] addSeries called without active session', { seriesDocumentId });
      return;
    }
    s.onAddSeries(seriesDocumentId, exerciseDocumentIds);
    const nextEx = new Set(s.addedExerciseIds);
    exerciseDocumentIds.forEach((id) => nextEx.add(id));
    set({
      addedSeriesIds: new Set(s.addedSeriesIds).add(seriesDocumentId),
      addedExerciseIds: nextEx,
    });
  },

  cancel: () =>
    set({
      active: false,
      initialExerciseIds: emptySet<string>(),
      initialSeriesIds: emptySet<string>(),
      addedExerciseIds: emptySet<string>(),
      addedSeriesIds: emptySet<string>(),
      onAddExercise: undefined,
      onAddSeries: undefined,
    }),
}));
