import { useLocalSearchParams } from 'expo-router';
import { LibraryPickerContainer } from '@/components/screens/LibraryPickerContainer';

export default function LibraryPickScreen() {
  const { trainingId, trainingName } = useLocalSearchParams<{
    trainingId: string;
    trainingName?: string;
  }>();
  return <LibraryPickerContainer trainingId={trainingId} trainingName={trainingName} />;
}
