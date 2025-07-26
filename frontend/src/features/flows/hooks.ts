// features/flows/hooks.ts
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { getFlows, createEmtpyFlow, getFlowDetail } from './api';
import { type GetFlowsResponse, type CreateFlowResponse, type GetFlowDetailResponse } from './types';
import useFlowStore from './stores';
import { useEffect } from 'react';
import type { Flow } from './types';

interface UseFlowsParams {
  userId: number;
  page?: number;
  pageSize?: number;
}

export const useFlows = ({ userId, page = 1, pageSize = 10 }: UseFlowsParams) => {
  return useQuery<GetFlowsResponse, Error>({
    queryKey: ['flows', userId, page, pageSize],
    queryFn: () => getFlows({ userId, page, pageSize }),
    placeholderData: keepPreviousData,
    enabled: !!userId,
  });
};

export const useCreateEmptyFlow = () => {
  return useMutation<CreateFlowResponse, Error>({
    mutationFn: createEmtpyFlow,
  });
};

interface UseGetFlowDetailParams {
  flowId: string;
  enabled?: boolean;
}

export const useGetFlowDetail = ({ flowId, enabled = true }: UseGetFlowDetailParams) => {
  
  const { setCurrentFlow } = useFlowStore();
  
  const query = useQuery<GetFlowDetailResponse, Error>({
    queryKey: ['flowDetail', flowId],
    queryFn: () => getFlowDetail({ flowId: flowId }), 
    placeholderData: keepPreviousData,
    enabled: enabled && !!flowId,
  });

  useEffect(() => {

    
    if (query.data) {
      
      const flow: Flow = {
        flow_id: query.data.flow_id,
        name: query.data.name,
        description: query.data.description,
        is_active: query.data.is_active,
        flow_definition: query.data.flow_definition,
      };

      setCurrentFlow(flow);
    }
  }, [query.data, setCurrentFlow]);

  return query;
};