// resolvers/utils.ts
export function resolvePlaceholders(
  input: any,
  context: Record<string, any>
): any {
  if (typeof input === 'string') {
    // Replace all {field_id} placeholders
    return input.replace(/{([^}]+)}/g, (_, key) => {
      const value = context[key];
      if (value === undefined || value === null) {
        return `{${key}}`; // Keep unresolved placeholders for debugging
      }
      return String(value);
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