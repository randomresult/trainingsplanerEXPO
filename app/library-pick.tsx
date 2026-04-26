import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { LibraryScreen } from '@/components/screens/LibraryScreen';
import { usePickSessionStore } from '@/lib/store/pickSessionStore';
import { useTrainingDetail } from '@/lib/queries/useTrainings';

export default function LibraryPickScreen() {
  const { trainingId, trainingName } = useLocalSearchParams<{
    trainingId: string;
    trainingName?: string;
  }>();
  const startSession = usePickSessionStore((s) => s.startSession);
  const { data: training } = useTrainingDetail(trainingId);

  useEffect(() => {
    if (!training) return;
    const exerciseIds = (training.exercises ?? []).map((ex: any) => ex.documentId);
    const seriesIds = (training.methodicalSeries ?? []).map((s: any) => s.documentId);
    startSession(trainingId, exerciseIds, seriesIds);
  }, [trainingId, training]);

  return <LibraryScreen trainingId={trainingId} trainingName={trainingName} />;
}
