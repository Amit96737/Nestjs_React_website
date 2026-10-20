import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from '../api/auth.api';
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
  type Project,
  type ProjectPayload,
  type ProjectStatus,
} from '../api/projects.api';
import {
  teamApi,
  type ProjectMember,
} from '../api/team.api';
import '../../public/css/Projects.css';
const emptyForm = {
  name: '',
  description: '',
  status: 'PLANNING' as ProjectStatus,
  start_date: '',
  due_date: '',
};
const statusLabel: Record<ProjectStatus, string> = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
};
const statusStyle: Record<ProjectStatus, CSSProperties> = {
  PLANNING: { borderColor: '#c7d2fe', background: '#eef2ff', color: '#4338ca' },
  ACTIVE: { borderColor: '#abefc6', background: '#ecfdf3', color: '#067647' },
  COMPLETED: { borderColor: '#b2ddff', background: '#eff8ff', color: '#175cd3' },
  ON_HOLD: { borderColor: '#fedf89', background: '#fffaeb', color: '#b54708' },
};
function getErrorMessage(error: unknown): string {
  const err = error as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const message = err.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message || err.message || 'Something went wrong';
}
function formatDate(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [teamProject, setTeamProject] = useState<Project | null>(null);
  const [teamMembers, setTeamMembers] = useState<ProjectMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamSaving, setTeamSaving] = useState(false);
  const [teamError, setTeamError] = useState('');
  const [teamNotice, setTeamNotice] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getProjects({
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      setProjects(result.data);
      setTotal(result.pagination.total);
      setTotalPages(Math.max(1, result.pagination.totalPages));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);
  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);
  function openCreateForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setNotice('');
    setError('');
    setFormOpen(true);
  }
  function openEditForm(project: Project) {
    setEditingId(project.id);
    setForm({
      name: project.name,
      description: project.description || '',
      status: project.status,
      start_date: project.start_date?.slice(0, 10) || '',
      due_date: project.due_date?.slice(0, 10) || '',
    });
    setNotice('');
    setError('');
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  }
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    if (
      form.start_date &&
      form.due_date &&
      form.due_date < form.start_date
    ) {
      setError('Due date cannot be earlier than start date.');
      setSaving(false);
      return;
    }
    const payload: ProjectPayload = {
      name: form.name.trim(),
      status: form.status,
    };
    if (form.description.trim()) {
      payload.description = form.description.trim();
    }
    if (form.start_date) payload.start_date = form.start_date;
    if (form.due_date) payload.due_date = form.due_date;
    try {
      if (editingId) {
        await updateProject(editingId, payload);
        setNotice('Project updated successfully.');
      } else {
        await createProject(payload);
        setNotice('Project created successfully.');
        setPage(1);
      }
      closeForm();
      await loadProjects();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }
  // Delete button click -> confirmation popup open
  function handleDelete(project: Project) {
    setProjectToDelete(project);
  }
  // Confirmation popup -> actual delete
  async function handleConfirmDelete() {
    if (!projectToDelete) return;
    setDeleting(true);
    setError('');
    setNotice('');
    try {
      await deleteProject(projectToDelete.id);
      setNotice('Project deleted successfully.');
      setProjectToDelete(null);
      if (projects.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadProjects();
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setProjectToDelete(null);
    } finally {
      setDeleting(false);
    }
  }
  async function loadTeamMembers(projectId: string) {
    setTeamLoading(true);
    setTeamError('');
    try {
      const response = await teamApi.getMembers(projectId);
      setTeamMembers(response.data);
    } catch (err) {
      setTeamError(getErrorMessage(err));
    } finally {
      setTeamLoading(false);
    }
  }
  async function openTeamModal(project: Project) {
    setTeamProject(project);
    setTeamMembers([]);
    setMemberEmail('');
    setMemberRole('MEMBER');
    setTeamError('');
    setTeamNotice('');
    await loadTeamMembers(project.id);
  }
  function closeTeamModal() {
    if (teamSaving) return;
    setTeamProject(null);
    setTeamMembers([]);
    setTeamError('');
    setTeamNotice('');
  }
  async function handleAddMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!teamProject || !memberEmail.trim()) return;
    setTeamSaving(true);
    setTeamError('');
    setTeamNotice('');
    try {
      await teamApi.addMember(teamProject.id, {
        email: memberEmail.trim(),
        role: memberRole,
      });
      setMemberEmail('');
      setMemberRole('MEMBER');
      setTeamNotice('Team member added successfully.');
      const response = await teamApi.getMembers(teamProject.id);
      setTeamMembers(response.data);
    } catch (err) {
      setTeamError(getErrorMessage(err));
    } finally {
      setTeamSaving(false);
    }
  }
  async function handleMemberRoleChange(
    member: ProjectMember,
    role: 'ADMIN' | 'MEMBER',
  ) {
    if (!teamProject || member.role === 'OWNER' || member.role === role) return;
    setTeamSaving(true);
    setTeamError('');
    setTeamNotice('');
    try {
      await teamApi.updateMemberRole(teamProject.id, member.user_id, { role });
      setTeamNotice('Member role updated successfully.');
      const response = await teamApi.getMembers(teamProject.id);
      setTeamMembers(response.data);
    } catch (err) {
      setTeamError(getErrorMessage(err));
    } finally {
      setTeamSaving(false);
    }
  }
  async function handleRemoveMember(member: ProjectMember) {
    if (!teamProject || member.role === 'OWNER') return;
    const memberName =
      `${member.user.first_name ?? ''} ${member.user.last_name ?? ''}`.trim() ||
      member.user.email;
    const confirmed = window.confirm(
      `Remove ${memberName} from "${teamProject.name}"?`,
    );
    if (!confirmed) return;
    setTeamSaving(true);
    setTeamError('');
    setTeamNotice('');
    try {
      await teamApi.removeMember(teamProject.id, member.user_id);
      setTeamMembers((current) =>
        current.filter((item) => item.user_id !== member.user_id),
      );
      setTeamNotice('Team member removed successfully.');
    } catch (err) {
      setTeamError(getErrorMessage(err));
    } finally {
      setTeamSaving(false);
    }
  }
  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }
  function handleStatusChange(value: ProjectStatus | '') {
    setStatusFilter(value);
    setPage(1);
  }
  function handleLogout() {
    signOut();
    navigate('/login', { replace: true });
  }
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-icon">N</span>
          <span>
            Nest<span className="brand-highlight">Panel</span>
          </span>
        </div>
        <nav className="sidebar-nav">
          <NavLink
            to="/projects"
            style={{ textDecoration: 'none' }}
            className={({ isActive }) =>
              isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link'
            }
          >
            <span className="sidebar-icon">◫</span>
            Project Management
          </NavLink>

          <NavLink
            to="/dashboard"
            style={{ textDecoration: 'none' }}
            className={({ isActive }) =>
              isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link'
            }
          >
            <span className="sidebar-icon">▦</span>
            Task Management
          </NavLink>

        </nav>
        <div className="sidebar-logout" style={{ marginTop: 'auto' }}>
          <button
            className="admin-logout-btn"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>Project Management</strong>
          </div>
          <div className="topbar-actions">
            <button className="admin-logout-btn" onClick={handleLogout}>
              Log out <span aria-hidden="true">↗</span>
            </button>
          </div>
        </header>
        <div className="admin-content">
          <section className="dashboard-welcome">
            <div>
              <h1>Project Management</h1>
            </div>
            <button className="refresh-btn" onClick={openCreateForm}>
              ＋ New Project
            </button>
          </section>
          {notice && <div className="task-notice">{notice}</div>}
          {error && (
            <div className="dashboard-error">
              <span>{error}</span>
            </div>
          )}
          <section
            className="stats-grid"
            style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
          >
            <article className="stat-card">
              <div className="stat-card-top">
                <span className="stat-label">Total projects</span>
                <span className="stat-icon stat-icon-blue">◫</span>
              </div>
              <div className="stat-number">{total}</div>
              <div className="stat-caption">All your projects</div>
            </article>
            {/* <article className="stat-card">
              <div className="stat-card-top">
                <span className="stat-label">On this page</span>
                <span className="stat-icon stat-icon-orange">▤</span>
              </div>
              <div className="stat-number">{projects.length}</div>
              <div className="stat-caption">Currently visible</div>
            </article>
            <article className="stat-card">
              <div className="stat-card-top">
                <span className="stat-label">Pages</span>
                <span className="stat-icon stat-icon-purple">▦</span>
              </div>
              <div className="stat-number">{totalPages}</div>
              <div className="stat-caption">10 projects per page</div>
            </article> */}
          </section>
          <section className="users-panel task-list-panel">
            <div className="users-panel-header">
              <div>
                <div className="users-title-row">
                  <h2>Projects List</h2>
                  {/* <span className="users-total-pill">{total}</span> */}
                </div>
              </div>
            </div>
            <div className="users-toolbar">
              <div className="user-search-box">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  aria-label="Search projects"
                />
              </div>
              <select
                className="task-filter-select"
                value={statusFilter}
                onChange={(event) =>
                  handleStatusChange(event.target.value as ProjectStatus | '')
                }
                aria-label="Filter by status"
              >
                <option value="">All</option>
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>
            <div className="users-table-wrapper">
              <table className="users-table task-table">
                <thead>
                  <tr>
                    <th>PROJECT</th>
                    <th>STATUS</th>
                    <th>START DATE</th>
                    <th>DUE DATE</th>
                    <th>TASKS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={6} className="table-message">
                        <span className="loading-spinner" />
                        Loading projects...
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    projects.map((project) => (
                      <tr key={project.id}>
                        <td className="task-title-cell">
                          <strong>{project.name}</strong>
                          <span>{project.description || 'No description'}</span>
                        </td>
                        <td>
                          <span
                            className="task-badge"
                            style={statusStyle[project.status]}
                          >
                            {statusLabel[project.status] ?? project.status}
                          </span>
                        </td>
                        <td className="user-date">
                          {formatDate(project.start_date)}
                        </td>
                        <td className="user-date">
                          {formatDate(project.due_date)}
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: 30,
                              height: 26,
                              padding: '0 9px',
                              borderRadius: 20,
                              background: '#f2f4f7',
                              color: '#344054',
                              fontSize: 12,
                              fontWeight: 750,
                              boxSizing: 'border-box',
                            }}
                          >
                            {project._count?.tasks ?? 0}
                          </span>
                        </td>
                        <td>
                          <div className="task-actions">
                            <button
                              className="task-secondary-btn"
                              type="button"
                              onClick={() => openEditForm(project)}
                            >
                              Edit
                            </button>
                            <button
                              className="task-secondary-btn"
                              type="button"
                              onClick={() => void openTeamModal(project)}
                            >
                              Manage Team
                            </button>
                            <button
                              className="task-delete-btn"
                              type="button"
                              onClick={() => handleDelete(project)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {!loading && projects.length === 0 && (
                    <tr>
                      <td colSpan={6} className="table-message">
                        <div className="empty-state-icon">◫</div>
                        <strong>No projects found</strong>
                        <p>Create a project or change your search/filter.</p>
                        <button
                          className="task-primary-btn"
                          style={{ marginTop: 18 }}
                          type="button"
                          onClick={openCreateForm}
                        >
                          Create your first project
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <footer className="users-panel-footer task-pagination">
              <span>
                Page {page} of {totalPages}
              </span>
              <div>
                <button
                  className="task-secondary-btn"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Previous
                </button>
                <button
                  className="task-secondary-btn"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </button>
              </div>
            </footer>
          </section>
        </div>
      </main>
      {formOpen && (
        <div
          className="projects-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <section
            className="projects-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-form-title"
          >
            <div className="projects-modal-header">
              <div>
                <p className="projects-eyebrow">PROJECT DETAILS</p>
                <h2 id="project-form-title">
                  {editingId ? 'Edit Project' : 'Create Project'}
                </h2>
              </div>
              <button
                className="projects-close-btn"
                type="button"
                onClick={closeForm}
                aria-label="Close form"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <label className="task-field">
                Project name \*
                <input
                  required
                  minLength={2}
                  maxLength={150}
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="e.g. Website Redesign"
                />
              </label>
              <label className="task-field">
                Description
                <textarea
                  maxLength={2000}
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="What is this project about?"
                />
              </label>
              <label className="task-field">
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value as ProjectStatus,
                    })
                  }
                >
                  <option value="PLANNING">Planning</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ON_HOLD">On Hold</option>
                </select>
              </label>
              <div className="projects-date-grid">
                <label className="task-field">
                  Start date
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(event) =>
                      setForm({ ...form, start_date: event.target.value })
                    }
                  />
                </label>
                <label className="task-field">
                  Due date
                  <input
                    type="date"
                    value={form.due_date}
                    min={form.start_date || undefined}
                    onChange={(event) =>
                      setForm({ ...form, due_date: event.target.value })
                    }
                  />
                </label>
              </div>
              {error && <div className="task-form-error">{error}</div>}
              <div className="projects-form-actions">
                <button
                  type="button"
                  className="task-secondary-btn"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="task-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingId
                      ? 'Save Changes'
                      : 'Create Project'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {teamProject && (
        <div
          className="projects-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeTeamModal();
          }}
        >
          <section
            className="projects-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-modal-title"
          >
            <div className="projects-modal-header">
              <div>
                <p className="projects-eyebrow">PROJECT WORKSPACE</p>
                <h2 id="team-modal-title">Manage Team</h2>
                <p style={{ margin: '6px 0 0', color: '#667085', fontSize: 13 }}>
                  {teamProject.name}
                </p>
              </div>
              <button
                className="projects-close-btn"
                type="button"
                onClick={closeTeamModal}
                disabled={teamSaving}
                aria-label="Close team modal"
              >
                ×
              </button>
            </div>
            {teamNotice && (
              <div className="task-notice" style={{ marginBottom: 16 }}>
                {teamNotice}
              </div>
            )}
            {teamError && (
              <div className="task-form-error" style={{ marginBottom: 16 }}>
                {teamError}
              </div>
            )}
            <form onSubmit={handleAddMember}>
              <label className="task-field">
                Member email *
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(event) => setMemberEmail(event.target.value)}
                  placeholder="colleague@example.com"
                  required
                  disabled={teamSaving}
                />
              </label>
              <label className="task-field" style={{ marginTop: 14 }}>
                Role
                <select
                  value={memberRole}
                  onChange={(event) =>
                    setMemberRole(event.target.value as 'ADMIN' | 'MEMBER')
                  }
                  disabled={teamSaving}
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>
              <div className="projects-form-actions">
                <button
                  type="submit"
                  className="task-primary-btn"
                  disabled={teamSaving || !memberEmail.trim()}
                >
                  {teamSaving ? 'Please wait...' : '+ Add Member'}
                </button>
              </div>
            </form>
            <div
              style={{
                height: 1,
                background: '#eaecf0',
                margin: '24px 0 18px',
              }}
            />
            <div className="projects-modal-header" style={{ marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, color: '#30374c', fontSize: 16 }}>
                  Project Members
                </h3>
                <p style={{ margin: '5px 0 0', color: '#8b92a5', fontSize: 12 }}>
                  {teamMembers.length} member{teamMembers.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            {teamLoading ? (
              <div className="table-message" style={{ padding: '28px 12px' }}>
                <span className="loading-spinner" />
                Loading team members...
              </div>
            ) : teamMembers.length === 0 ? (
              <div
                style={{
                  padding: '22px 14px',
                  textAlign: 'center',
                  color: '#8b92a5',
                  background: '#fafaff',
                  borderRadius: 12,
                  fontSize: 13,
                }}
              >
                No team members found.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {teamMembers.map((member) => {
                  const fullName =
                    `${member.user.first_name ?? ''} ${member.user.last_name ?? ''}`
                      .trim() || member.user.email;
                  return (
                    <div
                      key={member.user_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '13px 12px',
                        border: '1px solid #eaecf0',
                        borderRadius: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: '1 1 160px' }}>
                        <strong
                          style={{
                            display: 'block',
                            color: '#30374c',
                            fontSize: 13,
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {fullName}
                        </strong>
                        <span
                          style={{
                            display: 'block',
                            marginTop: 4,
                            color: '#8b92a5',
                            fontSize: 12,
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {member.user.email}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        {member.role === 'OWNER' ? (
                          <span
                            className="task-badge"
                            style={{
                              background: '#eef2ff',
                              color: '#4338ca',
                              border: '1px solid #c7d2fe',
                            }}
                          >
                            Owner
                          </span>
                        ) : (
                          <>
                            <select
                              className="task-filter-select"
                              value={member.role}
                              onChange={(event) =>
                                void handleMemberRoleChange(
                                  member,
                                  event.target.value as 'ADMIN' | 'MEMBER',
                                )
                              }
                              disabled={teamSaving}
                              aria-label={`Role for ${fullName}`}
                            >
                              <option value="MEMBER">Member</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                            <button
                              className="task-delete-btn"
                              type="button"
                              onClick={() => void handleRemoveMember(member)}
                              disabled={teamSaving}
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* <div className="projects-form-actions" style={{ marginTop: 24 }}>
              <button
                type="button"
                className="task-secondary-btn"
                onClick={closeTeamModal}
                disabled={teamSaving}
              >
                Close
              </button>
            </div> */}
          </section>
        </div>
      )}
      {projectToDelete && (
        <div
          className="projects-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setProjectToDelete(null);
            }
          }}
        >
          <section
            className="projects-modal"
            style={{ width: 'min(100%, 440px)' }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="project-delete-title"
          >
            <div className="projects-modal-header">
              <div>
                <p className="projects-eyebrow" style={{ color: '#b42318' }}>
                  CONFIRM DELETE
                </p>
                <h2 id="project-delete-title">Delete Project</h2>
              </div>
              <button
                className="projects-close-btn"
                type="button"
                onClick={() => setProjectToDelete(null)}
                disabled={deleting}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p
              style={{
                margin: '0 0 22px',
                color: '#475467',
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              Are you sure you want to delete{' '}
              <strong style={{ color: '#101828' }}>
                "{projectToDelete.name}"
              </strong>
              ? Its tasks will remain, but will be unlinked from this project.
            </p>
            <div className="projects-form-actions">
              <button
                type="button"
                className="task-secondary-btn"
                onClick={() => setProjectToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="task-delete-btn"
                style={{
                  minHeight: 40,
                  padding: '10px 18px',
                  background: '#d92d20',
                  borderColor: '#d92d20',
                  color: '#fff',
                  opacity: deleting ? 0.6 : 1,
                }}
                onClick={() => void handleConfirmDelete()}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
