// resolvers/registry.ts
import type { Resolver, HttpResolver, StaticResolver, ConditionalResolver } from './types';
import { handleHttpResolver } from './httpResolver';

interface ResolverContext {
  [key: string]: any;
}

export async function runResolver(
  resolver: Resolver,
  context: ResolverContext,
  depth = 0
): Promise<any> {
  // Prevent infinite recursion
  if (depth > 5) {
    throw new Error('Resolver nesting too deep');
  }

  // Handle different resolver types
  switch (resolver.type) {
    case 'http':
      return handleHttpResolver(resolver as HttpResolver, context);
      
    case 'static':
      return (resolver as StaticResolver).options;
      
    case 'conditional': {
      const condResolver = resolver as ConditionalResolver;
      const watchValue = context[condResolver.field_id];
      
      let selectedResolver = condResolver.cases[watchValue] || condResolver.default_resolver;
      
      if (!selectedResolver) {
        return [];
      }
      
      return runResolver(selectedResolver, context, depth + 1);
    }
      
    default:
      throw new Error(`Unsupported resolver type: ${(resolver as any).type}`);
  }
}