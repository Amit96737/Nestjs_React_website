import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { signOut } from '../api/auth.api';
import { getErrorMessage } from '../api/error';
import { NavLink } from 'react-router-dom';
import { http } from '../api/http'

import {
  createTask,
  deleteTask,
  getTaskStats,
  getTasks,
  updateTask,
  type Task,
  type TaskPayload,
  type TaskPriority,
  type TaskStats,
  type TaskStatus,
} from '../api/tasks.api';
import '../../public/css/Projects.css';

const emptyStats: TaskStats = {
  total: 0,
  todo: 0,
  inProgress: 0,
  done: 0,
  overdue: 0,
  completionRate: 0,
};

const emptyForm = {
  title: '',
  description: '',
  status: 'TODO' as TaskStatus,
  priority: 'MEDIUM' as TaskPriority,
  due_date: '',
};

const buildPayload = (values: typeof emptyForm): TaskPayload => ({
  title: values.title.trim(),
  description: values.description.trim() || null,
  status: values.status,
  priority: values.priority,
  due_date: values.due_date
    ? new Date(`${values.due_date}T12:00:00`).toISOString()
    : null,
});

export default function Dashboard() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>(emptyStats);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  type ProjectOption = {
  id: string;
  name: string;
  };

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // Edit popup
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editError, setEditError] = useState('');

  // Delete confirmation popup
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [taskResult, statsResult] = await Promise.all([
        getTasks({
          page,
          limit: 10,
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(statusFilter ? { status: statusFilter as TaskStatus } : {}),
        }),
        getTaskStats(),
      ]);

      setTasks(taskResult.data);
      setTotalTasks(taskResult.pagination.total);
      setTotalPages(Math.max(1, taskResult.pagination.totalPages));
      setStats(statsResult);
    } catch (err) {
      setError(getErrorMessage(err, 'Tasks does not load ..'));

      if (axios.isAxiosError(err) && err.response?.status === 401) {
        signOut();
        navigate('/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, page, search, statusFilter]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setProjectsLoading(true);

        const response = await http.get('/projects');

        setProjects(response.data.data);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setProjectsLoading(false);
      }
    };

    loadProjects();
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const resetForm = () => {
    setForm(emptyForm);
    setFormError('');
  };

  const startEdit = (task: Task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ? task.due_date.slice(0, 10) : '',
    });
    setEditError('');
    setNotice('');
  };

  const closeEditModal = () => {
    setEditingTask(null);
    setEditForm(emptyForm);
    setEditError('');
  };

  // Create task (inline form)
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setFormError('');
  setNotice('');
  setIsAddTaskOpen(false);

  if (!form.title.trim()) {
    setFormError('Task title required.');
    return;
  }

  setSaving(true);

  try {
    await createTask({
      ...buildPayload(form),
      project_id: selectedProjectId || undefined,
    });

    setNotice('Task created successfully.');
    setPage(1);

    resetForm();
    setSelectedProjectId('');

    await fetchDashboard();
  } catch (err) {
    setFormError(getErrorMessage(err, 'Task not saved.'));
  } finally {
    setSaving(false);
  }
};

  // Update task (edit popup)
  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingTask) return;

    setEditError('');
    setNotice('');

    if (!editForm.title.trim()) {
      setEditError('Task title required.');
      return;
    }

    setSaving(true);

    try {
      await updateTask(editingTask.id, buildPayload(editForm));
      setNotice('Task update successfully.');

      closeEditModal();
      await fetchDashboard();
    } catch (err) {
      setEditError(getErrorMessage(err, 'Task not saved.'));
    } finally {
      setSaving(false);
    }
  };

  // Delete button click -> confirmation popup open
  const handleDelete = (task: Task) => {
    setTaskToDelete(task);
  };

  // Confirmation popup -> actual delete
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;

    setDeleting(true);
    setError('');
    setNotice('');

    try {
      await deleteTask(taskToDelete.id);
      setNotice('Task delete successfully.');
      setTaskToDelete(null);

      if (tasks.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await fetchDashboard();
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Task does not delete.'));
      setTaskToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  const formatDate = (value: string | null) => {
    if (!value) return 'No due date';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const statusLabel: Record<TaskStatus, string> = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    DONE: 'Completed',
  };

  const priorityLabel: Record<TaskPriority, string> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
  };

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
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <span className="sidebar-icon">◫</span>
            Project Management
          </NavLink>

          <NavLink
            to="/dashboard"
            style={{ textDecoration: 'none' }}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <span className="sidebar-icon">▦</span>
            Task Management
          </NavLink>

        </nav>

        <div className="sidebar-logout">
          <button className="admin-logout-btn" onClick={handleLogout}>
            Log out   
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>My Tasks</strong>
          </div>
          <div className="topbar-actions">
            <button className="admin-logout-btn" onClick={handleLogout}>
              Log out <span aria-hidden="true">↗</span>
            </button>
          </div>
        </header>

        <div className="admin-content">
          <section className="dashboard-welcome">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <h1>Task Management</h1>

              <button
                type="button"
                className="refresh-btn"
                onClick={() => {
                  resetForm();
                  setSelectedProjectId('');
                  setIsAddTaskOpen(true);
                }}
              >
                + Add Task
              </button>
            </div>
          </section>

          {notice && <div className="task-notice">{notice}</div>}
          {error && (
            <div className="dashboard-error">
              <span>{error}</span>
              <button onClick={() => void fetchDashboard()}>Try again</button>
            </div>
          )}

          <section className="stats-grid">
            <article className="stat-card">
              <div className="stat-card-top">
                <span className="stat-label">Total tasks</span>
                <span className="stat-icon stat-icon-blue">▤</span>
              </div>
              <div className="stat-number">{loading ? '—' : stats.total}</div>
              <div className="stat-caption">All your tasks</div>
            </article>

            <article className="stat-card">
              <div className="stat-card-top">
                <span className="stat-label">To Do</span>
                <span className="stat-icon stat-icon-orange">◷</span>
              </div>
              <div className="stat-number">{loading ? '—' : stats.todo}</div>
              <div className="stat-caption">Waiting to start</div>
            </article>

            <article className="stat-card">
              <div className="stat-card-top">
                <span className="stat-label">In progress</span>
                <span className="stat-icon stat-icon-purple">↗</span>
              </div>
              <div className="stat-number">{loading ? '—' : stats.inProgress}</div>
              <div className="stat-caption">Currently working on</div>
            </article>

            <article className="stat-card">
              <div className="stat-card-top">
                <span className="stat-label">Completed</span>
                <span className="stat-icon stat-icon-green">✓</span>
              </div>
              <div className="stat-number">{loading ? '—' : stats.done}</div>
              <div className="stat-caption">
                {stats.completionRate}% completion rate
              </div>
            </article>
          </section>

          {isAddTaskOpen && (
  <div
    className="projects-modal-backdrop"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) {
        setIsAddTaskOpen(false);
        resetForm();
      }
    }}
  >
    <section
      className="projects-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-task-title"
    >
      <div className="projects-modal-header">
        <div>
          <p className="projects-eyebrow">TASK DETAILS</p>
          <h2 id="add-task-title">Create New Task</h2>
        </div>

        <button
          className="projects-close-btn"
          type="button"
          onClick={() => {
            setIsAddTaskOpen(false);
            resetForm();
          }}
          disabled={saving}
          aria-label="Close form"
        >
          ×
        </button>
      </div>

      {formError && <div className="task-form-error">{formError}</div>}

      <form className="task-form" onSubmit={async (event) => {
        await handleSubmit(event);
      }}>
        <label className="task-field task-field-wide">
          Task title *
          <input
            value={form.title}
            maxLength={150}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
            placeholder="e.g. Build task API"
            required
          />
        </label>

        <label className="task-field task-field-wide">
          Description
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            placeholder="Task details (optional)"
            rows={3}
          />
        </label>

        <label className="task-field task-field-wide">
          Project
          <select
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
            disabled={projectsLoading}
          >
            <option value="">
              {projectsLoading ? 'Loading projects...' : 'No project selected'}
            </option>

            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <div className="projects-date-grid">
          <label className="task-field">
            Status
            <select
              value={form.status}
              onChange={(event) =>
                setForm({
                  ...form,
                  status: event.target.value as TaskStatus,
                })
              }
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Completed</option>
            </select>
          </label>

          <label className="task-field">
            Priority
            <select
              value={form.priority}
              onChange={(event) =>
                setForm({
                  ...form,
                  priority: event.target.value as TaskPriority,
                })
              }
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </label>
        </div>

        <label className="task-field">
          Due date
          <input
            type="date"
            value={form.due_date}
            onChange={(event) =>
              setForm({ ...form, due_date: event.target.value })
            }
          />
        </label>

        <div className="projects-form-actions"
         style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '12px',
          }}>
          <button
            type="button"
            className="task-secondary-btn"
            onClick={() => {
              setIsAddTaskOpen(false);
              resetForm();
            }}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            className="task-primary-btn"
            type="submit"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Create task'}
          </button>
        </div>
      </form>
    </section>
  </div>
)}

          <section className="users-panel task-list-panel">
            <div className="users-panel-header">
              <div>
                <div className="users-title-row">
                  <h2>Tasks List</h2>
                </div>
              </div>
            </div>

            <div className="users-toolbar">
              <div className="user-search-box">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  aria-label="Search tasks"
                />
              </div>

              <select
                className="task-filter-select"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter tasks by status"
              >
                <option value="">All</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Completed</option>
              </select>

              <span className="results-count">
                {/* {loading ? 'Loading tasks...' : `${totalTasks} task(s)`} */}
              </span>
            </div>

            <div className="users-table-wrapper">
              <table className="users-table task-table">
                <thead>
                  <tr>
                    <th>TASK</th>
                    <th>STATUS</th>
                    <th>PRIORITY</th>
                    <th>DUE DATE</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={5} className="table-message">
                        <span className="loading-spinner" />
                        Loading tasks...
                      </td>
                    </tr>
                  )}

                  {!loading && !error && tasks.map((task) => (
                    <tr key={task.id}>
                      <td className="task-title-cell">
                        <strong>{task.title}</strong>
                        <span>{task.description || 'No description'}</span>
                      </td>
                      <td>
                        <span className={`task-badge task-status-${task.status.toLowerCase()}`}>
                          {statusLabel[task.status]}
                        </span>
                      </td>
                      <td>
                        <span className={`task-badge task-priority-${task.priority.toLowerCase()}`}>
                          {priorityLabel[task.priority]}
                        </span>
                      </td>
                      <td className="user-date">{formatDate(task.due_date)}</td>
                      <td>
                        <div className="task-actions">
                          <button
                            className="task-secondary-btn"
                            onClick={() => startEdit(task)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="task-delete-btn"
                            onClick={() => handleDelete(task)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!loading && !error && tasks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="table-message">
                        <div className="empty-state-icon">✓</div>
                        <strong>No tasks found</strong>
                        <p>Create a task above, or change your search/filter.</p>
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

      {/* Edit Task popup */}
      {editingTask && (
        <div
          className="projects-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) closeEditModal();
          }}
        >
          <section
            className="projects-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-edit-title"
          >
            <div className="projects-modal-header">
              <div>
                <p className="projects-eyebrow">TASK DETAILS</p>
                <h2 id="task-edit-title">Edit Task</h2>
              </div>
              <button
                className="projects-close-btn"
                type="button"
                onClick={closeEditModal}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <label className="task-field">
                Task title *
                <input
                  required
                  maxLength={150}
                  value={editForm.title}
                  onChange={(event) =>
                    setEditForm({ ...editForm, title: event.target.value })
                  }
                  placeholder="e.g. Build task API"
                />
              </label>

              <label className="task-field">
                Description
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm({ ...editForm, description: event.target.value })
                  }
                  placeholder="Task details (optional)"
                />
              </label>

              <div className="projects-date-grid">
                <label className="task-field">
                  Status
                  <select
                    value={editForm.status}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        status: event.target.value as TaskStatus,
                      })
                    }
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Completed</option>
                  </select>
                </label>

                <label className="task-field">
                  Priority
                  <select
                    value={editForm.priority}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        priority: event.target.value as TaskPriority,
                      })
                    }
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </label>
              </div>

              <label className="task-field">
                Due date
                <input
                  type="date"
                  value={editForm.due_date}
                  onChange={(event) =>
                    setEditForm({ ...editForm, due_date: event.target.value })
                  }
                />
              </label>

              {editError && <div className="task-form-error">{editError}</div>}

              <div className="projects-form-actions">
                <button
                  type="button"
                  className="task-secondary-btn"
                  onClick={closeEditModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="task-primary-btn"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Delete confirmation popup */}
      {taskToDelete && (
        <div
          className="projects-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setTaskToDelete(null);
            }
          }}
        >
          <section
            className="projects-modal"
            style={{ width: 'min(100%, 440px)' }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="task-delete-title"
          >
            <div className="projects-modal-header">
              <div>
                <p className="projects-eyebrow" style={{ color: '#b42318' }}>
                  CONFIRM DELETE
                </p>
                <h2 id="task-delete-title">Delete Task</h2>
              </div>
              <button
                className="projects-close-btn"
                type="button"
                onClick={() => setTaskToDelete(null)}
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
              <strong style={{ color: '#101828' }}>"{taskToDelete.title}"</strong>{' '}
              task? This action cannot be undone.
            </p>

            <div className="projects-form-actions">
              <button
                type="button"
                className="task-secondary-btn"
                onClick={() => setTaskToDelete(null)}
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