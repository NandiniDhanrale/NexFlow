const VARIABLE_REGEX = /\{\{([\w.]+)\}\}/g;

function resolvePath(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = current[key];
  }

  return current;
}

export function parseTemplate(template: string, variables: Record<string, any>): string {
  return template.replace(VARIABLE_REGEX, (match, path) => {
    const value = resolvePath(variables, path.trim());
    if (value === null || value === undefined) return match;

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  });
}

export function extractVariables(template: string): string[] {
  const variables: string[] = [];
  const regex = new RegExp(VARIABLE_REGEX.source, 'g');
  let match;

  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}
