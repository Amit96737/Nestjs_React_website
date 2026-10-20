
import { http } from './http';

export type ProjectMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: ProjectMemberRole;
  joined_at: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface AddProjectMemberPayload {
  email: string;
  role?: 'ADMIN' | 'MEMBER';
}

export interface UpdateProjectMemberRolePayload {
  role: 'ADMIN' | 'MEMBER';
}

export const teamApi = {
  getMembers(projectId: string) {
    return http.get<ProjectMember[]>(
      `/projects/${projectId}/members`,
    );
  },

  addMember(projectId: string, payload: AddProjectMemberPayload) {
    return http.post<ProjectMember>(
      `/projects/${projectId}/members`,
      payload,
    );
  },

  updateMemberRole(
    projectId: string,
    userId: string,
    payload: UpdateProjectMemberRolePayload,
  ) {
    return http.patch(
      `/projects/${projectId}/members/${userId}`,
      payload,
    );
  },

  removeMember(projectId: string, userId: string) {
    return http.delete(
      `/projects/${projectId}/members/${userId}`,
    );
  },
};
