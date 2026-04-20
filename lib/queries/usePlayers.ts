import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api';
import { useAuthStore } from '../store';
import type { Player } from '../types/models';
import type { StrapiResponse } from '../types/api';

export const usePlayers = () => {
  const user = useAuthStore((s) => s.user);
  const clubId = user?.clubs?.[0]?.documentId;

  return useQuery({
    queryKey: ['players', clubId],
    queryFn: async () => {
      // Strapi v5 users-permissions rejects filters on relations even when
      // read is allowed. Fetch all and filter client-side (~21 players).
      const { data } = await apiClient.get<StrapiResponse<Player[]>>('/players', {
        params: { populate: '*' },
      });

      return data.data.filter((p: any) => p.Club?.documentId === clubId);
    },
    enabled: !!clubId,
  });
};
