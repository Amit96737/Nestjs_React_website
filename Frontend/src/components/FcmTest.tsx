
import { useState } from 'react';
import { enablePushNotifications } from '../notifications/fcm';

export default function FcmTest() {
  const [status, setStatus] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleEnableNotifications() {
    setLoading(true);
    setStatus('');
    setToken('');

    try {
      const fcmToken = await enablePushNotifications();
      setToken(fcmToken);
      setStatus('Browser notifications enabled successfully!');
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : 'Failed to enable notifications.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h2>Firebase Push Notification Test</h2>

      <button
        type="button"
        onClick={handleEnableNotifications}
        disabled={loading}
      >
        {loading ? 'Enabling...' : 'Enable Notifications'}
      </button>

      {status && <p>{status}</p>}

      {token && (
        <div>
          <h3>FCM Token</h3>
          <textarea
            readOnly
            value={token}
            rows={6}
            style={{ width: '100%', overflowWrap: 'anywhere' }}
          />
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(token)}
          >
            Copy Token
          </button>
        </div>
      )}
    </div>
  );
}
