import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';
import { useAuthStore } from '../store';
import type { Player } from '../types/models';
import type { StrapiResponse } from '../types/api';

export const usePlayers = () => {
  const user = useAuthStore((s) => s.user);
  const clubId = user?.player?.Club?.documentId;

  return useQuery({
    queryKey: ['players', clubId],
    queryFn: async () => {
      const { data } = await apiClient.get<StrapiResponse<Player[]>>('/players', {
        params: {
          filters: {
            Club: {
              documentId: {
                $eq: clubId,
              },
            },
          },
          populate: '*',
        },
      });

      return data.data;
    },
    enabled: !!clubId,
  });
};
