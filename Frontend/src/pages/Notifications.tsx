import { useCallback, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { http } from '../api/http';
import { signOut } from '../api/auth.api';
import '../../public/css/Projects.css';

type NotificationType = 'TASK_ASSIGNED' | 'TASK_DEADLINE' | 'TASK_STATUS_UPDATED' | string;

type UserNotification = {
  id: string;
  user_id: string;
  task_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await http.get('/notifications');
      const payload = response.data;
      const list: UserNotification[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.notifications)
          ? payload.notifications
          : Array.isArray(payload?.data?.notifications)
            ? payload.data.notifications
            : [];
      setNotifications(list);
      setUnreadCount(
        typeof payload?.unreadCount === 'number'
          ? payload.unreadCount
          : typeof payload?.data?.unreadCount === 'number'
            ? payload.data.unreadCount
            : list.filter((item) => !item.is_read).length,
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Notifications load fail. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    setBusyId(id);
    setError('');
    try {
      await http.patch(`/notifications/${id}/read`);
      setNotifications((current) => current.map((item) =>
        item.id === id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item,
      ));
      setUnreadCount((count) => Math.max(0, count - 1));
      setNotice('Notification marked as read.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Notification not  marked as read.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    setError('');
    try {
      const target = notifications.find((item) => item.id === id);
      await http.delete(`/notifications/${id}`);
      setNotifications((current) => current.filter((item) => item.id !== id));
      if (target && !target.is_read) setUnreadCount((count) => Math.max(0, count - 1));
      setNotice('Notification deleted.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Notification not delete.');
    } finally {
      setBusyId(null);
    }
  };

  const handleLogout = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString(undefined, {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  };

  const typeLabel = (type: NotificationType) => {
    switch (type) {
      case 'TASK_ASSIGNED': return 'Task assigned';
      case 'TASK_DEADLINE': return 'Deadline reminder';
      case 'TASK_STATUS_UPDATED': return 'Status updated';
      default: return 'Notification';
    }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-icon">N</span>
          <span>Nest<span className="brand-highlight">Panel</span></span>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/projects" style={{ textDecoration: 'none' }} className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
            <span className="sidebar-icon">◫</span> Project Management
          </NavLink>
          <NavLink to="/dashboard" style={{ textDecoration: 'none' }} className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
            <span className="sidebar-icon">▦</span> Task Management
          </NavLink>
          <NavLink to="/notifications" style={{ textDecoration: 'none' }} className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
            <span className="sidebar-icon">♢</span> Notification Management
            {/* {unreadCount > 0 && <span style={{ marginLeft: 'auto', minWidth: 22, textAlign: 'center', borderRadius: 12, padding: '2px 6px', fontSize: 11, background: '#e5484d', color: '#fff' }}>{unreadCount}</span>} */}
          </NavLink>
          <NavLink to="/profile" style={{ textDecoration: 'none' }} className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
            <span className="sidebar-icon">♙</span>Profile Management
          </NavLink>
        </nav>
        <div className="sidebar-logout">
          <button className="admin-logout-btn" onClick={handleLogout}>Log out &#x20;</button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>Notifications</strong></div>
          <div className="topbar-actions">
            <button className="admin-logout-btn" onClick={handleLogout}>Log out <span aria-hidden="true">↗</span></button>
          </div>
        </header>

        <div className="admin-content">
          <section className="dashboard-welcome">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', }}>
              <div>
                <h1>Notification Management</h1>
              </div>
              <button className="refresh-btn" onClick={() => void fetchNotifications()} disabled={loading}>
                {loading ? 'Loading...' : '↻ Refresh'}
              </button>
            </div>
          </section>

          <section style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <article className="stat-card" style={{ minWidth: 180, flex: '0 1 220px' }}>
              <div className="stat-label">Total notifications</div>
              <div className="stat-number">{notifications.length}</div>
              <div className="stat-caption">All notifications for your account</div>
            </article>
            
          </section>

          {notice && <div className="task-notice" role="status">{notice}</div>}
          {error && <div className="dashboard-error" role="alert">{error}</div>}

          {loading ? (
            <div className="stat-card" style={{ padding: 24 }}>Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="stat-card" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>♢</div>
              <h3>No notifications yet</h3>
              <p>Jab koi task assign hoga ya status update hoga, notification yahan dikhegi.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {notifications.map((item) => (
                <article key={item.id} className="stat-card" style={{ padding: 20, borderLeft: item.is_read ? '4px solid #d0d5dd' : '4px solid #4f46e5', background: item.is_read ? '#fff' : '#f8faff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                        <strong style={{ fontSize: 16 }}>{item.title}</strong>
                      </div>
                      <p style={{ margin: '0 0 10px', lineHeight: 1.6 }}>{item.message}</p>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: '#667085' }}>
                        <span>{typeLabel(item.type)}</span>
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {!item.is_read && <button className="refresh-btn" disabled={busyId === item.id} onClick={() => void handleMarkRead(item.id)}>{busyId === item.id ? 'Please wait...' : 'Mark as read'}</button>}
                      <button className="admin-logout-btn" disabled={busyId === item.id} onClick={() => void handleDelete(item.id)}>Delete</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
