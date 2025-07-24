import apiClient from "@/api/client";
import { GET_FLOWS_ENDPOINT } from "./consts";
import { type GetFlowsResponse } from "./types";

interface GetFlowsParams {
  userId: string;
  page?: number;
  pageSize?: number;
}

export const getFlows = async ({
  userId,
  page = 1,
  pageSize = 10,
}: GetFlowsParams): Promise<GetFlowsResponse> => {
  const { data } = await apiClient.get(GET_FLOWS_ENDPOINT, {
    params: { userId, page, pageSize },
  });
  return data;
};
