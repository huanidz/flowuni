// resolvers/httpResolver.ts
import axios from 'axios';
import { JSONPath } from 'jsonpath-plus';
import type { HttpResolver } from './types';

interface ResolverContext {
  [key: string]: any;
}

// Safe placeholder resolution
function resolvePlaceholders(input: any, context: ResolverContext): any {
  if (typeof input === 'string') {
    return input.replace(/{([^}]+)}/g, (_, key) => {
      const value = context[key];
      return value !== undefined && value !== null ? String(value) : `{${key}}`;
    });
  }

  if (Array.isArray(input)) {
    return input.map(item => resolvePlaceholders(item, context));
  }

  if (typeof input === 'object' && input !== null) {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        key,
        resolvePlaceholders(value, context)
      ])
    );
  }

  return input;
}

export async function handleHttpResolver(
  resolver: HttpResolver,
  context: ResolverContext
): Promise<any> {
  try {
    // Resolve all placeholders
    const resolvedUrl = resolvePlaceholders(resolver.url, context);
    const resolvedHeaders = resolvePlaceholders(resolver.headers || {}, context);
    const resolvedParams = resolvePlaceholders(resolver.params || {}, context);
    const resolvedBody = resolver.body ? resolvePlaceholders(resolver.body, context) : undefined;

    // Configure axios request
    const config = {
      method: resolver.method || 'GET',
      url: resolvedUrl,
      headers: {
        'Content-Type': 'application/json',
        ...resolvedHeaders
      },
      params: resolvedParams,
      timeout: resolver.timeout || 10000,
      ...(resolvedBody && resolver.method !== 'GET' && { data: resolvedBody })
    };

    // Make HTTP request
    const response = await axios(config);

    // Extract data using JSONPath
    let result;
    if (resolver.response_path) {
      try {
        result = JSONPath({ path: resolver.response_path, json: response.data });
      } catch (jsonPathError) {
        throw new Error(`JSONPath error: ${(jsonPathError as Error).message}`);
      }
    } else {
      result = response.data;
    }

    // Normalize array results for dropdowns
    if (Array.isArray(result)) {
      return result.map(item => 
        typeof item === 'string' 
          ? { value: item, label: item }
          : item
      );
    }

    return result;

  } catch (error: any) {
    // Handle axios errors
    if (axios.isAxiosError(error)) {
      const axiosError = error;
      let errorMessage = resolver.error_message || 'Failed to fetch data';
      
      // Try to extract error from response using JSONPath
      if (axiosError.response?.data && resolver.error_path) {
        try {
          const errorResult = JSONPath({ 
            path: resolver.error_path, 
            json: axiosError.response.data 
          });
          if (errorResult.length > 0) {
            errorMessage = String(errorResult[0]);
          }
        } catch {
          // Fallback to default error message
        }
      } else if (axiosError.response?.status) {
        errorMessage = `HTTP ${axiosError.response.status}: ${axiosError.response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    // Re-throw other errors
    throw error;
  }
}