
import { http } from './http';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface TaskPayload {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  project_id?: string;
}

export interface TaskListResponse {
  data: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
  completionRate: number;
}

export interface TaskFilters {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  search?: string;
}

export const getTasks = async (filters: TaskFilters = {}) => {
  const response = await http.get<TaskListResponse>('/tasks', {
    params: filters,
  });

  return response.data;
};

export const getTaskStats = async () => {
  const response = await http.get<TaskStats>('/tasks/stats');
  return response.data;
};

export const getTask = async (id: string) => {
  const response = await http.get<Task>(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (payload: TaskPayload) => {
  const response = await http.post<Task>('/tasks', payload);
  return response.data;
};

export const updateTask = async (
  id: string,
  payload: Partial<TaskPayload>,
) => {
  const response = await http.patch<Task>(`/tasks/${id}`, payload);
  return response.data;
};

export const deleteTask = async (id: string) => {
  const response = await http.delete(`/tasks/${id}`);
  return response.data;
};
