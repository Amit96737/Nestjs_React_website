import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { http } from '../api/http';
import { signOut } from '../api/auth.api';
import '../../public/css/Projects.css';

type ProfileUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  email_verified?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

type UsersResponse = {
  message?: string;
  data?: ProfileUser[];
};

function getTokenPayload(): Record<string, unknown> | null {
  const token = sessionStorage.getItem('accessToken');
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const tokenPayload = getTokenPayload();
      const currentUserId = typeof tokenPayload?.user_id === 'string'
        ? tokenPayload.user_id
        : typeof tokenPayload?.id === 'string'
          ? tokenPayload.id
          : '';
      const tokenEmail = typeof tokenPayload?.email === 'string'
        ? tokenPayload.email.toLowerCase()
        : '';

      if (!currentUserId && !tokenEmail) {
        throw new Error('Login token se current user identify nahi ho paaya. Please dobara login karein.');
      }

      // Existing users API is used, then only the signed-in user's record is shown.
      const response = await http.get<UsersResponse>('/users/all-users');
      const users = Array.isArray(response.data?.data) ? response.data.data : [];
      const currentUser = users.find((user) =>
        (currentUserId && user.id === currentUserId) ||
        (tokenEmail && user.email?.toLowerCase() === tokenEmail),
      );

      if (!currentUser) {
        throw new Error('Current user ki profile nahi mili. Backend current-user profile endpoint verify karna hoga.');
      }

      setProfile(currentUser);
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? (typeof err.response?.data?.message === 'string'
            ? err.response.data.message
            : 'Profile load nahi ho paayi. Please try again.')
        : err instanceof Error
          ? err.message
          : 'Profile load nahi ho paayi. Please try again.';
      setError(message);

      if (axios.isAxiosError(err) && err.response?.status === 401) {
        signOut();
        navigate('/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const fullName = useMemo(() => {
    if (!profile) return 'Your Profile';
    return `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'User';
  }, [profile]);

  const initials = useMemo(() => {
    if (!profile) return 'U';
    return `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase() || 'U';
  }, [profile]);

  const handleLogout = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-icon">N</span>
          <span>Nest<span className="brand-highlight">Panel</span></span>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="sidebar-nav">

          <NavLink to="/projects" style={{ textDecoration: 'none' }} className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
            <span className="sidebar-icon">◫</span> Project Management
          </NavLink>

          <NavLink to="/dashboard" style={{ textDecoration: 'none' }} className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
            <span className="sidebar-icon">▦</span> Task Management
          </NavLink>

          <NavLink to="/notification" style={{ textDecoration: 'none' }} className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
            <span className="sidebar-icon">♢</span> Notification Management
          </NavLink>

          <NavLink to="/profile" style={{ textDecoration: 'none' }} className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
            <span className="sidebar-icon">♙</span>Profile Management
          </NavLink>

        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-profile-avatar">{initials}</div>
          <div className="sidebar-profile-text">
            <strong>{loading ? 'Loading profile...' : fullName}</strong>
            <span>My account</span>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>My Profile</strong></div>
          <div className="topbar-actions">
            <button className="admin-logout-btn" onClick={handleLogout}>Log out <span aria-hidden="true">↗</span></button>
          </div>
        </header>

        <div className="admin-content">
          <section className="dashboard-welcome">
            <div>
              <h1>Profile Management</h1>
            </div>
          </section>

          {error && (
            <div className="dashboard-error" role="alert" style={{ marginBottom: 20 }}>
              <span>{error}</span>
              <button type="button" onClick={() => void fetchProfile()}>Try again</button>
            </div>
          )}

          {loading ? (
            <section className="stat-card" style={{ padding: 28 }}>Loading your profile...</section>
          ) : profile ? (
            <>
              <section className="stat-card" style={{ padding: 28, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ width: 88, height: 88, flex: '0 0 88px', borderRadius: 24, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #e9e7ff, #f3f0ff)', color: '#5145cd', border: '1px solid #dcd7ff', fontSize: 28, fontWeight: 800 }}>
                    {initials}
                  </div>
                  <div style={{ minWidth: 0, flex: '1 1 260px' }}>
                    <div className="eyebrow">ACCOUNT OVERVIEW</div>
                    <h2 style={{ margin: '0 0 7px', color: '#1b2135', fontSize: 25, overflowWrap: 'anywhere' }}>{fullName}</h2>
                    <p style={{ margin: 0, color: '#858da1', overflowWrap: 'anywhere' }}>{profile.email}</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                      <span className={`status-badge ${profile.email_verified ? 'status-verified' : 'status-pending'}`}>
                        <span className="status-dot" /> {profile.email_verified ? 'Email verified' : 'Email not verified'}
                      </span>
                      <span className={`status-badge ${profile.is_active === false ? 'status-inactive' : 'status-active'}`}>
                        <span className="status-dot" /> {profile.is_active === false ? 'Inactive account' : 'Active account'}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="stat-card" style={{ padding: 24 }}>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ margin: '0 0 6px', color: '#1b2135', fontSize: 18 }}>Personal details</h2>
                  <p style={{ margin: 0, color: '#858da1', fontSize: 13 }}>Your account information</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 14 }}>
                  <div style={{ padding: 17, border: '1px solid #eaecf5', borderRadius: 12, background: '#fbfbfe' }}>
                    <div className="stat-label">FIRST NAME</div>
                    <div style={{ marginTop: 8, color: '#30384d', fontSize: 15, fontWeight: 650 }}>{profile.first_name || '—'}</div>
                  </div>
                  <div style={{ padding: 17, border: '1px solid #eaecf5', borderRadius: 12, background: '#fbfbfe' }}>
                    <div className="stat-label">LAST NAME</div>
                    <div style={{ marginTop: 8, color: '#30384d', fontSize: 15, fontWeight: 650 }}>{profile.last_name || '—'}</div>
                  </div>
                  <div style={{ padding: 17, border: '1px solid #eaecf5', borderRadius: 12, background: '#fbfbfe' }}>
                    <div className="stat-label">EMAIL ADDRESS</div>
                    <div style={{ marginTop: 8, color: '#30384d', fontSize: 15, fontWeight: 650, overflowWrap: 'anywhere' }}>{profile.email || '—'}</div>
                  </div>
                  <div style={{ padding: 17, border: '1px solid #eaecf5', borderRadius: 12, background: '#fbfbfe' }}>
                    <div className="stat-label">MEMBER SINCE</div>
                    <div style={{ marginTop: 8, color: '#30384d', fontSize: 15, fontWeight: 650 }}>{formatDate(profile.created_at)}</div>
                  </div>
                  
                </div>
              </section>
            </>
          ) : !error ? (
            <section className="stat-card" style={{ padding: 28 }}>Profile details are not available.</section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
