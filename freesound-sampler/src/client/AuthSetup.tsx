import React, { useState } from 'react';

interface AuthSetupProps {
  clientId: string | null;
  onAuthSuccess: () => void;
}

const AuthSetup = ({ clientId, onAuthSuccess }: AuthSetupProps) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authUrl = `https://freesound.org/apiv2/oauth2/authorize/?client_id=${clientId}&response_type=code`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/exchange-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to exchange code.');
      }

      // Success! Trigger the parent component to re-check auth status.
      onAuthSuccess();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!clientId) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Configuration Error</h2>
        <p style={{ color: 'red' }}>
          Freesound Client ID is missing. Please make sure `FREESOUND_CLIENT_ID` is set in your `.env` file on the server.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center', maxWidth: '600px', margin: 'auto' }}>
      <h1>Freesound Sampler Setup</h1>
      <p>This application needs your permission to access Freesound.org.</p>
      
      <div style={{ border: '1px solid #555', padding: '15px', borderRadius: '5px', margin: '20px 0' }}>
        <h3>Step 1: Authorize the Application</h3>
        <p>Click the link below to authorize the app with Freesound. This will open in a new tab.</p>
        <a href={authUrl} target="_blank" rel="noopener noreferrer">
          Authorize with Freesound
        </a>
      </div>

      <div style={{ border: '1px solid #555', padding: '15px', borderRadius: '5px', margin: '20px 0' }}>
        <h3>Step 2: Paste Your Authorization Code</h3>
        <p>After authorizing, Freesound will give you a code. Paste it here.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste code here"
            style={{ width: '80%', padding: '8px', marginBottom: '10px' }}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Authenticating...' : 'Complete Setup'}
          </button>
        </form>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>Error: {error}</p>}
      </div>
    </div>
  );
};

export default AuthSetup;
