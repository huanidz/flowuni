import apiClient from "@/api/client";
import { GET_NODES_ENDPOINT, NODE_CATALOG_ETAG_KEY, NODE_CATALOG_DATA_KEY } from "./consts";
import { type NodeSpec } from "./types";

export const getNodes = async (): Promise<NodeSpec[]> => {
  const { data } = await apiClient.get(GET_NODES_ENDPOINT);
  return data;
};

export const getNodesWithCache = async (): Promise<NodeSpec[]> => {
  try {
    const etag = localStorage.getItem(NODE_CATALOG_ETAG_KEY);
    const headers: Record<string, string> = {};

    if (etag) {
      console.log(`Using cached catalog with ETag ${etag}`);
      headers['If-None-Match'] = etag;
    }

    // NOTE: Disable axios validation to allow 304 responses
    const response = await apiClient.get(GET_NODES_ENDPOINT, {
      headers,
      params: {
        _t: new Date().getTime(), // REMOVE THIS LINE ON PRODUCTION
      },
      validateStatus: status => status === 200 || status === 304,
    });

    console.log('Response:', response);

    if (response.status === 304) {
      console.log('Catalog not modified — using cached version');
      const cachedData = localStorage.getItem(NODE_CATALOG_DATA_KEY);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      // Fallback to fresh fetch if no cached data
    }

    const catalog: NodeSpec[] = response.data;
    const newEtag = response.headers.etag;

    if (newEtag) {
      console.log(`New catalog ETag: ${newEtag}`);
      localStorage.setItem(NODE_CATALOG_ETAG_KEY, newEtag);
    }
    localStorage.setItem(NODE_CATALOG_DATA_KEY, JSON.stringify(catalog));

    console.log(`Loaded ${catalog.length} node types`);
    return catalog;
  } catch (error) {
    console.error('Failed to load node catalog:', error);
    throw error;
  }
};