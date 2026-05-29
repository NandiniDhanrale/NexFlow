export interface User {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: string;
  webhookToken: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { executions: number };
  schedules?: Schedule[];
}

export interface WorkflowNode {
  id: string;
  workflowId: string;
  type: string;
  positionX: number;
  positionY: number;
  config: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  workflowId: string;
  sourceNode: string;
  targetNode: string;
  conditionLabel: string | null;
}

export interface WorkflowDetail extends Workflow {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  schedules: Schedule[];
}

export interface Execution {
  id: string;
  workflowId: string;
  status: string;
  triggerData: any;
  outputData: any;
  triggeredBy: string;
  startedAt: string | null;
  completedAt: string | null;
  executionTime: number | null;
  createdAt: string;
  workflow?: { name: string; id: string };
  _count?: { logs: number };
  logs?: ExecutionLog[];
}

export interface ExecutionLog {
  id: string;
  executionId: string;
  nodeId: string | null;
  level: string;
  message: string;
  timestamp: string;
}

export interface Schedule {
  id: string;
  workflowId: string;
  cronExpression: string;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

export interface DashboardStats {
  totalWorkflows: number;
  executionsToday: number;
  successRate: number;
  failures: number;
  recentExecutions: Execution[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    config: Record<string, any>;
    nodeType: string;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  data?: { label?: string };
}

export type NodeCategory = 'triggers' | 'actions' | 'logic' | 'ai';
