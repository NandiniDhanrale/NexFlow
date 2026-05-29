import { create } from 'zustand';
import type { WorkflowNode, WorkflowEdge } from '../types';
import { Node, Edge } from 'reactflow';

interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  workflowName: string;
  isDirty: boolean;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedNode: (node: Node | null) => void;
  setWorkflowName: (name: string) => void;
  setIsDirty: (dirty: boolean) => void;
  reset: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  workflowName: 'Untitled Workflow',
  isDirty: false,
  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  setWorkflowName: (name) => set({ workflowName: name, isDirty: true }),
  setIsDirty: (dirty) => set({ isDirty: dirty }),
  reset: () => set({ nodes: [], edges: [], selectedNode: null, isDirty: false }),
}));
