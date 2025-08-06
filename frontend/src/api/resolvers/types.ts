// types/resolvers.ts
export interface BaseResolver {
  type: string;
  depends_on?: string[];
  cache_ttl?: number;
  timeout?: number;
  error_message?: string;
  debug?: boolean;
}

export interface HttpResolver extends BaseResolver {
  type: 'http';
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: any;
  response_path?: string;
  error_path?: string;
}

export interface ConditionalResolver extends BaseResolver {
  type: 'conditional';
  field_id: string;
  cases: Record<string, any>; // Will be typed as Resolver in full implementation
  default_resolver?: any;     // Will be typed as Resolver in full implementation
}

export interface StaticResolver extends BaseResolver {
  type: 'static';
  options: Array<{ value: string; label: string; [key: string]: any }>;
}

export interface FunctionResolver extends BaseResolver {
  type: 'function';
  name: string;
  args: Record<string, any>;
}

// Union type for all resolvers
export type Resolver = 
  | HttpResolver 
  | ConditionalResolver 
  | StaticResolver 
  | FunctionResolver;