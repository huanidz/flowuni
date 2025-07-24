import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getFlows } from './api';
import { type GetFlowsResponse } from './types';

interface UseFlowsParams {
  userId: string;
  page?: number;
  pageSize?: number;
}

export const useFlows = ({ userId, page = 1, pageSize = 10 }: UseFlowsParams) => {
  return useQuery<GetFlowsResponse, Error>({
    queryKey: ['flows', userId, page, pageSize],
    queryFn: () => getFlows({ userId, page, pageSize }),
    placeholderData: keepPreviousData,
  });
};