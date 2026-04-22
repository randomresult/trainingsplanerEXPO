import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { apiClient } from '../api';
import { useAuthStore } from '../store';
import type { Training } from '../types/models';
import type { StrapiResponse } from '../types/api';

export const useTrainings = () => {
  const user = useAuthStore((s) => s.user);
  const clubId = user?.clubs?.[0]?.documentId;

  return useQuery({
    queryKey: ['trainings', clubId],
    queryFn: async () => {
      // Strapi v5 users-permissions rejects filters on relations. Fetch and
      // filter client-side.
      const { data } = await apiClient.get<StrapiResponse<Training[]>>('/trainings', {
        params: { populate: '*' },
      });

      return data.data
        .filter((t: any) =>
          t.clubs?.some((c: any) => c.documentId === clubId)
        )
        .sort((a: any, b: any) => {
          const aTime = new Date(a.createdAt || a.Date).getTime();
          const bTime = new Date(b.createdAt || b.Date).getTime();
          return bTime - aTime;
        });
    },
    enabled: !!clubId,
  });
};

export const useTrainingDetail = (id: string) => {
  return useQuery({
    queryKey: ['trainings', id],
    queryFn: async () => {
      const { data } = await apiClient.get<StrapiResponse<Training>>(`/trainings/${id}`, {
        params: { populate: '*' },
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
  const clubId = user?.clubs?.[0]?.documentId;

  return useMutation({
    mutationFn: async (input: CreateTrainingInput) => {
      const { data } = await apiClient.post<StrapiResponse<Training>>('/trainings', {
        data: {
          Name: input.name,
          Date: input.date,
          training_status: 'draft',
          clubs: {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
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
      router.replace('/trainings');
    },
  });
};

export const useAddExerciseToTraining = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { trainingId: string; exerciseId: string }) => {
      const { data } = await apiClient.put<StrapiResponse<Training>>(
        `/trainings/${input.trainingId}`,
        {
          data: {
            exercises: { connect: [{ documentId: input.exerciseId }] },
          },
        }
      );
      return data.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['trainings', vars.trainingId] });
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
    },
  });
};

export const useAddPlayerToTraining = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { trainingId: string; playerId: string }) => {
      const { data } = await apiClient.put<StrapiResponse<Training>>(
        `/trainings/${input.trainingId}`,
        {
          data: {
            players: { connect: [{ documentId: input.playerId }] },
          },
        }
      );
      return data.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['trainings', vars.trainingId] });
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
    },
  });
};

export const useRemoveExerciseFromTraining = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { trainingId: string; exerciseId: string }) => {
      const { data } = await apiClient.put<StrapiResponse<Training>>(
        `/trainings/${input.trainingId}`,
        {
          data: {
            exercises: { disconnect: [{ documentId: input.exerciseId }] },
          },
        }
      );
      return data.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['trainings', vars.trainingId] });
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
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
    completedExerciseIds: string[];
    pointsEarned: number;
  }>;
}

export const useCompleteTraining = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompleteTrainingInput) => {
      // Single transactional call — backend updates training + creates
      // all player-progress entries atomically. Rolls back on any failure.
      await apiClient.post(`/trainings/${input.trainingId}/complete`, {
        actualDuration: input.sessionDuration,
        playerProgressData: input.playerProgressData,
      });
      return input.trainingId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      router.replace('/trainings');
    },
  });
};

const HISTORY_PAGE_SIZE = 30;

export const useTrainingsHistory = () => {
  const user = useAuthStore((s) => s.user);
  const clubId = user?.clubs?.[0]?.documentId;

  return useInfiniteQuery({
    queryKey: ['trainings', 'history', clubId],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get<
        StrapiResponse<Training[]> & { meta?: { pagination?: { page: number; pageCount: number } } }
      >('/trainings', {
        params: {
          populate: '*',
          pagination: { page: pageParam, pageSize: HISTORY_PAGE_SIZE },
          sort: ['Date:desc'],
          filters: { training_status: { $eq: 'completed' } },
        },
      });
      const filtered = data.data.filter((t: any) =>
        t.clubs?.some((c: any) => c.documentId === clubId)
      );
      return {
        items: filtered,
        page: data.meta?.pagination?.page ?? pageParam,
        pageCount: data.meta?.pagination?.pageCount ?? 1,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.pageCount ? lastPage.page + 1 : undefined,
    enabled: !!clubId,
  });
};
