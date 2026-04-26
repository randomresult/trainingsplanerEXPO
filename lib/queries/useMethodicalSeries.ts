import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';
import type { MethodicalSeries } from '../types/models';
import type { StrapiResponse } from '../types/api';

const MUER_EXERCISE_POPULATE = {
  focusareas: true,
  playerlevels: true,
  categories: true,
  Steps: true,
  Videos: true,
  methodicalSeries: true,
};

export const useMethodicalSeries = () => {
  return useQuery({
    queryKey: ['methodicalSeries'],
    queryFn: async () => {
      const { data } = await apiClient.get<StrapiResponse<MethodicalSeries[]>>(
        '/methodische-reihen',
        {
          params: {
            populate: {
              exercises: { populate: MUER_EXERCISE_POPULATE },
            },
            pagination: { pageSize: 100 },
          },
        }
      );
      return data.data;
    },
  });
};

export const useMethodicalSeriesDetail = (documentId: string) => {
  return useQuery({
    queryKey: ['methodicalSeries', documentId],
    queryFn: async () => {
      const { data } = await apiClient.get<StrapiResponse<MethodicalSeries>>(
        `/methodische-reihen/${documentId}`,
        {
          params: {
            populate: {
              exercises: { populate: MUER_EXERCISE_POPULATE },
            },
          },
        }
      );
      return data.data;
    },
    enabled: !!documentId,
  });
};
