import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';
import type { Exercise, Focus } from '../types/models';
import type { StrapiResponse } from '../types/api';

interface ExerciseRaw {
  documentId: string;
  Name: string;
  Description: string;
  Minutes: number;
  Steps?: string[];
  Hint?: string;
  Videos?: string[];
  Difficulty?: 'Anfänger' | 'Fortgeschritten' | 'Experte';
  focus?: {
    documentId: string;
    Name: string;
  }[];
}

export const useExercises = (searchQuery?: string) => {
  return useQuery({
    queryKey: ['exercises', searchQuery],
    queryFn: async () => {
      const params: any = {
        populate: 'focus',
      };

      if (searchQuery) {
        params.filters = {
          Name: {
            $containsi: searchQuery,
          },
        };
      }

      const { data } = await apiClient.get<StrapiResponse<ExerciseRaw[]>>('/exercises', {
        params,
      });

      return data.data;
    },
  });
};

export const useExerciseDetail = (id: string) => {
  return useQuery({
    queryKey: ['exercises', id],
    queryFn: async () => {
      const { data } = await apiClient.get<StrapiResponse<ExerciseRaw>>(`/exercises/${id}`, {
        params: {
          populate: 'focus',
        },
      });

      return data.data;
    },
    enabled: !!id,
  });
};
