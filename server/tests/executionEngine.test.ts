import { executeWorkflow } from '../src/services/executionEngine';

const mockIO = {
  to: () => ({
    emit: () => {},
  }),
} as any;

describe('Execution Engine', () => {
  it('should detect cycles', async () => {
    const workflow = {
      id: 'test',
      nodes: [
        { id: '1', type: 'webhook', config: {}, positionX: 0, positionY: 0 },
        { id: '2', type: 'transform', config: {}, positionX: 100, positionY: 0 },
      ],
      edges: [
        { id: 'e1', sourceNode: '1', targetNode: '2', conditionLabel: null },
        { id: 'e2', sourceNode: '2', targetNode: '1', conditionLabel: null },
      ],
    };

    const result = await executeWorkflow(workflow, {}, 'exec-1', mockIO);
    expect(result.success).toBe(false);
    expect(result.error).toContain('cycle');
  });

  it('should execute a linear workflow', async () => {
    const workflow = {
      id: 'test',
      nodes: [
        { id: '1', type: 'webhook', config: {}, positionX: 0, positionY: 0 },
        { id: '2', type: 'transform', config: { expression: '({...payload, transformed: true})' }, positionX: 100, positionY: 0 },
      ],
      edges: [
        { id: 'e1', sourceNode: '1', targetNode: '2', conditionLabel: null },
      ],
    };

    const result = await executeWorkflow(workflow, { message: 'hello' }, 'exec-2', mockIO);
    expect(result.success).toBe(true);
  });

  it('should handle unknown node types', async () => {
    const workflow = {
      id: 'test',
      nodes: [
        { id: '1', type: 'unknown-node', config: {}, positionX: 0, positionY: 0 },
      ],
      edges: [],
    };

    const result = await executeWorkflow(workflow, {}, 'exec-3', mockIO);
    expect(result.success).toBe(false);
  });

  it('should handle empty workflows', async () => {
    const workflow = {
      id: 'test',
      nodes: [],
      edges: [],
    };

    const result = await executeWorkflow(workflow, {}, 'exec-4', mockIO);
    expect(result.success).toBe(false);
    expect(result.error).toContain('No entry node');
  });
});
