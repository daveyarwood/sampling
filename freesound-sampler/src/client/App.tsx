import React, { useState, useEffect } from 'react';
import AuthSetup from './AuthSetup';
import SampleGrid from './SampleGrid';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      setIsAuthenticated(data.isAuthenticated);
      setClientId(data.clientId);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <SampleGrid />;
  } else {
    return <AuthSetup clientId={clientId} onAuthSuccess={checkAuthStatus} />;
  }
}

export default App;
