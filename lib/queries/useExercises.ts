import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';
import type { Exercise } from '../types/models';
import type { StrapiResponse } from '../types/api';

interface ExerciseRaw {
  documentId: string;
  Name: string;
  Description: string;
  Minutes: number;
  Steps?: string[];
  Hint?: string;
  Videos?: string[];
  focusareas?: { documentId: string; Name: string }[];
  playerlevels?: { documentId: string; Name: string }[];
  categories?: { documentId: string; Name: string }[];
}

// Explicit populate — Strapi v5 populate=* is inconsistent for relations on
// some schemas. Naming the relations we actually need is deterministic.
const POPULATE = {
  focusareas: true,
  playerlevels: true,
  categories: true,
  Steps: true,
  Videos: true,
};

export const useExercises = (searchQuery?: string) => {
  return useQuery({
    queryKey: ['exercises', searchQuery],
    queryFn: async () => {
      const params: any = {
        populate: POPULATE,
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

      return data.data as Exercise[];
    },
  });
};

export const useExerciseDetail = (id: string) => {
  return useQuery({
    queryKey: ['exercises', id],
    queryFn: async () => {
      const { data } = await apiClient.get<StrapiResponse<ExerciseRaw>>(`/exercises/${id}`, {
        params: {
          populate: POPULATE,
        },
      });

      return data.data as Exercise;
    },
    enabled: !!id,
  });
};
