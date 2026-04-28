import type { Exercise, Tag } from '@/lib/types/models';
import type { LibraryFilterState } from '@/components/sheets/LibraryFilterSheet';

export const tagNames = (rel: Tag[] | undefined): string[] =>
  (rel ?? []).map((t) => t.Name).filter(Boolean) as string[];

export const collectTagNames = (
  exercises: Exercise[] | undefined,
  key: 'focusareas' | 'playerlevels' | 'categories',
): string[] => {
  const set = new Set<string>();
  (exercises ?? []).forEach((ex) => tagNames(ex[key]).forEach((n) => set.add(n)));
  return Array.from(set).sort();
};

export const filterExercises = (
  exercises: Exercise[] | undefined,
  filters: LibraryFilterState,
): Exercise[] => {
  const matchesMulti = (selected: string[], rel: Tag[] | undefined) => {
    if (selected.length === 0) return true;
    return tagNames(rel).some((n) => selected.includes(n));
  };
  return (exercises ?? []).filter((ex) => {
    if (!matchesMulti(filters.focusareas, ex.focusareas)) return false;
    if (!matchesMulti(filters.playerlevels, ex.playerlevels)) return false;
    if (!matchesMulti(filters.categories, ex.categories)) return false;
    if (filters.duration) {
      const m = ex.Minutes ?? 0;
      if (filters.duration === 'short' && m > 10) return false;
      if (filters.duration === 'medium' && (m <= 10 || m > 20)) return false;
      if (filters.duration === 'long' && m <= 20) return false;
    }
    return true;
  });
};
