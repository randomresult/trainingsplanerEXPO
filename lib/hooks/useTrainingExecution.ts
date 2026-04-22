import { useState, useEffect, useRef } from 'react';
import type { Exercise } from '../types/models';

interface ExerciseState extends Exercise {
  completed: boolean;
  /** user-editable runtime minutes */
  editedMinutes: number;
}

export function useTrainingExecution(exercises: Exercise[]) {
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>([]);
  const sessionInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Sync incoming exercises with state, preserving completed/editedMinutes for known ones.
  useEffect(() => {
    setExerciseStates((prev) => {
      const prevById = new Map(prev.map((ex) => [ex.documentId, ex]));
      const next = exercises.map((ex) => {
        const existing = prevById.get(ex.documentId);
        if (existing) {
          return { ...ex, completed: existing.completed, editedMinutes: existing.editedMinutes };
        }
        return { ...ex, completed: false, editedMinutes: ex.Minutes ?? 0 };
      });
      if (
        next.length === prev.length &&
        next.every((ex, i) => ex.documentId === prev[i].documentId)
      ) {
        return prev;
      }
      return next;
    });
  }, [exercises]);

  // Session timer — always running
  useEffect(() => {
    sessionInterval.current = setInterval(() => {
      setSessionElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      if (sessionInterval.current) clearInterval(sessionInterval.current);
    };
  }, []);

  const toggleComplete = (index: number) => {
    setExerciseStates((prev) =>
      prev.map((ex, idx) =>
        idx === index ? { ...ex, completed: !ex.completed } : ex
      )
    );
  };

  const setMinutes = (index: number, minutes: number) => {
    setExerciseStates((prev) =>
      prev.map((ex, idx) => (idx === index ? { ...ex, editedMinutes: minutes } : ex))
    );
  };

  const completedCount = exerciseStates.filter((ex) => ex.completed).length;

  return {
    sessionElapsed,
    exerciseStates,
    completedCount,
    toggleComplete,
    setMinutes,
  };
}
