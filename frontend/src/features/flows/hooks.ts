import { useQuery } from '@tanstack/react-query';
import { getFlows } from './api';
import { type GetFlowsResponse } from './types';

export const useFlows = () => {
  return useQuery<GetFlowsResponse, Error>({
    queryKey: ['flows'],
    queryFn: getFlows,
  });
};
