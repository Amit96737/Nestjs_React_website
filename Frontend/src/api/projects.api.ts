
import { http } from './http';

export type ProjectStatus =
  | 'PLANNING'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'ON_HOLD';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  due_date: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  _count?: {
    tasks: number;
  };
}

export interface ProjectPayload {
  name: string;
  description?: string;
  status?: ProjectStatus;
  start_date?: string;
  due_date?: string;
}

export interface ProjectsResponse {
  data: Project[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProjectFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProjectStatus | '';
}

export async function getProjects(
  filters: ProjectFilters = {},
): Promise<ProjectsResponse> {
  const response = await http.get<ProjectsResponse>('/projects', {
    params: filters,
  });

  return response.data;
}

export async function getProject(id: string): Promise<Project> {
  const response = await http.get<Project>(`/projects/${id}`);
  return response.data;
}

export async function createProject(
  payload: ProjectPayload,
): Promise<Project> {
  const response = await http.post<Project>('/projects', payload);
  return response.data;
}

export async function updateProject(
  id: string,
  payload: Partial<ProjectPayload>,
): Promise<Project> {
  const response = await http.patch<Project>(`/projects/${id}`, payload);
  return response.data;
}

export async function deleteProject(id: string): Promise<void> {
  await http.delete(`/projects/${id}`);
}
