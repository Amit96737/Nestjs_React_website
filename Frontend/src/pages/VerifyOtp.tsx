import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { verifyOtp } from '../api/auth.api';
import { getErrorMessage } from '../api/error';

export default function VerifyOtp() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const email = searchParams.get('email') ?? '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Email is missing. Please sign up again.');
      return;
    }

    setLoading(true);

    try {
      const result = await verifyOtp({ email, otp });

      setMessage(result.message || 'Email verified successfully.');

      navigate('/login', {
        replace: true,
        state: { message: result.message || 'Email verified. Please sign in.' },
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid OTP. Please try again.'));
    } finally {
      setLoading(false);
    }
  };


  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Verify your email</h1>
        <p className="auth-subtitle">
          Enter the OTP sent to {email || 'your registered email'}.
        </p>

        {location.state?.message && (
          <div className="alert success-alert">
            {location.state.message}
          </div>
        )}

        {error && <div className="alert error-alert">{error}</div>}
        {message && <div className="alert success-alert">{message}</div>}

        <label htmlFor="otp">Email OTP</label>
        <input
          id="otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          placeholder="Enter 6-digit OTP"
        />

        <button type="submit" disabled={loading || !email}>
          {loading ? 'Verifying...' : 'Verify email'}
        </button>

        <p className="auth-footer">
          <Link to="/signup">Back to sign up</Link>
        </p>
      </form>
    </main>
  );
}