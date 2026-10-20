import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../api/auth.api';
import { getErrorMessage } from '../api/error';

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const result = await signUp(form);

      setMessage(result.message || 'Please verify your email.');

      navigate(
        `/verify-otp?email=${encodeURIComponent(form.email.trim())}`,
        {
          state: { message: result.message },
        },
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to create your account.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create account</h1>
        <p className="auth-subtitle">Sign up to get started.</p>

        {error && <div className="alert error-alert">{error}</div>}
        {message && <div className="alert success-alert">{message}</div>}

        <label htmlFor="first_name">First name</label>
        <input
          id="first_name"
          type="text"
          autoComplete="given-name"
          required
          value={form.first_name}
          onChange={(e) =>
            setForm({ ...form, first_name: e.target.value })
          }
        />

        <label htmlFor="last_name">Last name</label>
        <input
          id="last_name"
          type="text"
          autoComplete="family-name"
          required
          value={form.last_name}
          onChange={(e) =>
            setForm({ ...form, last_name: e.target.value })
          }
        />

        <label htmlFor="signup_email">Email</label>
        <input
          id="signup_email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <label htmlFor="signup_password">Password</label>
        <input
          id="signup_password"
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign up'}
        </button>

        <p className="auth-footer">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </main>
  );
}