import { parseTemplate, extractVariables } from '../src/utils/templateParser';

describe('Template Parser', () => {
  it('should replace simple variables', () => {
    const result = parseTemplate('Hello {{name}}', { name: 'John' });
    expect(result).toBe('Hello John');
  });

  it('should replace nested variables', () => {
    const result = parseTemplate('{{user.name}} is {{user.age}}', {
      user: { name: 'Alice', age: 30 },
    });
    expect(result).toBe('Alice is 30');
  });

  it('should leave unresolved variables as-is', () => {
    const result = parseTemplate('Hello {{unknown}}', {});
    expect(result).toBe('Hello {{unknown}}');
  });

  it('should stringify objects', () => {
    const result = parseTemplate('Data: {{payload}}', {
      payload: { key: 'value' },
    });
    expect(result).toBe('Data: {"key":"value"}');
  });

  it('should extract variable names', () => {
    const vars = extractVariables('{{name}} is {{age}} years old');
    expect(vars).toEqual(['name', 'age']);
  });
});
