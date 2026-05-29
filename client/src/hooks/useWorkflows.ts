import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Workflow, WorkflowDetail, DashboardStats, Execution } from '../types';

export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const res = await api.get<Workflow[]>('/workflows');
      return res.data;
    },
  });
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: ['workflow', id],
    queryFn: async () => {
      const res = await api.get<WorkflowDetail>(`/workflows/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await api.post<Workflow>('/workflows', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useUpdateWorkflow(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Workflow>) => {
      const res = await api.put<Workflow>(`/workflows/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workflows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}

export function useSaveWorkflowNodes(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { nodes: any[]; edges: any[] }) => {
      await api.post(`/workflows/${id}/nodes`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow', id] });
    },
  });
}

export function useExecuteWorkflow(id: string) {
  return useMutation({
    mutationFn: async (payload?: any) => {
      const res = await api.post<{ executionId: string; status: string }>(
        `/workflows/${id}/execute`,
        payload || {}
      );
      return res.data;
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get<DashboardStats>('/workflows/stats');
      return res.data;
    },
  });
}

export function useExecutions(workflowId: string) {
  return useQuery({
    queryKey: ['executions', workflowId],
    queryFn: async () => {
      const res = await api.get<Execution[]>(`/workflows/${workflowId}/executions`);
      return res.data;
    },
    enabled: !!workflowId,
  });
}

export function useExecutionDetail(id: string) {
  return useQuery({
    queryKey: ['execution', id],
    queryFn: async () => {
      const res = await api.get<Execution>(`/executions/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}
