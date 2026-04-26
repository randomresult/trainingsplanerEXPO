import { useLocalSearchParams } from 'expo-router';
import { LibraryScreen } from '@/components/screens/LibraryScreen';

export default function LibraryPickScreen() {
  const { trainingId, trainingName } = useLocalSearchParams<{
    trainingId: string;
    trainingName?: string;
  }>();

  return <LibraryScreen trainingId={trainingId} trainingName={trainingName} />;
}
