import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { apiClient } from '../api';
import { useAuthStore } from '../store';
import type { Training } from '../types/models';
import type { StrapiResponse } from '../types/api';

export const useTrainings = () => {
  const user = useAuthStore((s) => s.user);
  const clubId = user?.player?.Club?.documentId;

  return useQuery({
    queryKey: ['trainings', clubId],
    queryFn: async () => {
      const { data } = await apiClient.get<StrapiResponse<Training[]>>('/trainings', {
        params: {
          filters: {
            Club: {
              documentId: {
                $eq: clubId,
              },
            },
          },
          populate: ['exercises', 'players'],
        },
      });

      return data.data;
    },
    enabled: !!clubId,
  });
};

export const useTrainingDetail = (id: string) => {
  return useQuery({
    queryKey: ['trainings', id],
    queryFn: async () => {
      const { data } = await apiClient.get<StrapiResponse<Training>>(`/trainings/${id}`, {
        params: {
          populate: ['exercises', 'players'],
        },
      });

      return data.data;
    },
    enabled: !!id,
  });
};

interface CreateTrainingInput {
  name: string;
  date: string;
  exerciseIds: string[];
  playerIds: string[];
}

export const useCreateTraining = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const clubId = user?.player?.Club?.documentId;

  return useMutation({
    mutationFn: async (input: CreateTrainingInput) => {
      const { data } = await apiClient.post<StrapiResponse<Training>>('/trainings', {
        data: {
          Name: input.name,
          Date: input.date,
          training_status: 'draft',
          Club: {
            connect: [{ documentId: clubId }],
          },
          exercises: {
            connect: input.exerciseIds.map((id) => ({ documentId: id })),
          },
          players: {
            connect: input.playerIds.map((id) => ({ documentId: id })),
          },
        },
      });

      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      router.push(`/trainings/${data.documentId}`);
    },
  });
};

export const useDeleteTraining = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/trainings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      router.back();
    },
  });
};

export const useStartTraining = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trainingId: string) => {
      const { data } = await apiClient.put<StrapiResponse<Training>>(`/trainings/${trainingId}`, {
        data: {
          training_status: 'in_progress',
          startedAt: new Date().toISOString(),
        },
      });

      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trainings', data.documentId] });
    },
  });
};

interface CompleteTrainingInput {
  trainingId: string;
  sessionDuration: number;
  playerProgressData: Array<{
    playerId: string;
    exerciseId: string;
    points: number;
  }>;
}

export const useCompleteTraining = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompleteTrainingInput) => {
      // 1. Complete training
      await apiClient.put(`/trainings/${input.trainingId}`, {
        data: {
          training_status: 'completed',
          completedAt: new Date().toISOString(),
          actualDuration: input.sessionDuration,
        },
      });

      // 2. Create player-progress entries
      for (const progress of input.playerProgressData) {
        await apiClient.post('/player-progresses', {
          data: {
            player: { connect: [{ documentId: progress.playerId }] },
            exercise: { connect: [{ documentId: progress.exerciseId }] },
            training: { connect: [{ documentId: input.trainingId }] },
            Points: progress.points,
          },
        });
      }

      return input.trainingId;
    },
    onSuccess: (trainingId) => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      router.replace(`/trainings/${trainingId}`);
    },
  });
};
