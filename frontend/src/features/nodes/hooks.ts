import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getNodes, getNodesWithCache } from './api';
import { type NodeSpec } from './types';
import useNodeStore from './stores';

export const useNodes = () => {
  return useQuery<NodeSpec[], Error>({
    queryKey: ['nodes'],
    queryFn: getNodes,
  });
};

export const useNodesWithCache = () => {
  const { setNodes, setLoaded } = useNodeStore();
  
  const query = useQuery<NodeSpec[], Error>({
    queryKey: ['nodes-cached'],
    queryFn: getNodesWithCache,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
  });

  useEffect(() => {
    if (query.data) {
      setNodes(query.data);
      setLoaded(true);
    }
  }, [query.data, setNodes, setLoaded]);

  return query;
};

export const useNodeRegistry = () => {
  const store = useNodeStore();
  const { data: nodes, isLoading, error } = useNodesWithCache();

  return {
    ...store,
    isLoading,
    error,
    loadCatalog: async () => {
      if (store.loaded) {
        console.log('Node catalog already loaded');
        return;
      }
      // The query will handle loading automatically
    },
  };
};