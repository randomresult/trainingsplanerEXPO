import { useState, useEffect, useRef } from 'react';
import type { Exercise } from '../types/models';

interface ExerciseState extends Exercise {
  completed: boolean;
  isActive: boolean;
  isPaused: boolean;
}

export function useTrainingExecution(exercises: Exercise[]) {
  const [sessionElapsed, setSessionElapsed] = useState(0); // seconds
  const [exerciseElapsed, setExerciseElapsed] = useState(0); // seconds
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>(
    exercises.map((ex) => ({
      ...ex,
      completed: false,
      isActive: false, // NO auto-start
      isPaused: false,
    }))
  );

  const sessionInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const exerciseInterval = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const currentExercise = exerciseStates.find((ex) => ex.isActive);

  // Re-seed exerciseStates when exercises arrive after mount
  // (e.g. useTrainingDetail still loading on initial render)
  useEffect(() => {
    if (exercises.length > 0 && exerciseStates.length === 0) {
      setExerciseStates(
        exercises.map((ex) => ({
          ...ex,
          completed: false,
          isActive: false,
          isPaused: false,
        }))
      );
    }
  }, [exercises.length]);

  // Session Timer (always runs)
  useEffect(() => {
    sessionInterval.current = setInterval(() => {
      setSessionElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (sessionInterval.current) {
        clearInterval(sessionInterval.current);
      }
    };
  }, []);

  // Exercise Timer (only if active and not paused)
  useEffect(() => {
    if (currentExercise && !currentExercise.isPaused) {
      exerciseInterval.current = setInterval(() => {
        setExerciseElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (exerciseInterval.current) {
        clearInterval(exerciseInterval.current);
      }
    }

    return () => {
      if (exerciseInterval.current) {
        clearInterval(exerciseInterval.current);
      }
    };
  }, [currentExercise?.isPaused, currentExercise?.documentId]);

  const handleExercisePress = (index: number) => {
    // Activate exercise → becomes "current exercise"
    setExerciseStates((prev) =>
      prev.map((ex, idx) => ({
        ...ex,
        isActive: idx === index,
        isPaused: false,
      }))
    );
    setExerciseElapsed(0);
  };

  const handleCompleteExercise = (index: number) => {
    setExerciseStates((prev) =>
      prev.map((ex, idx) =>
        idx === index ? { ...ex, completed: true, isActive: false } : ex
      )
    );
    // NO auto-activation of next exercise
  };

  const togglePause = () => {
    setExerciseStates((prev) =>
      prev.map((ex) =>
        ex.isActive ? { ...ex, isPaused: !ex.isPaused } : ex
      )
    );
  };

  const completedCount = exerciseStates.filter((ex) => ex.completed).length;

  return {
    sessionElapsed,
    exerciseElapsed,
    exerciseStates,
    currentExercise,
    completedCount,
    handleExercisePress,
    handleCompleteExercise,
    togglePause,
  };
}
