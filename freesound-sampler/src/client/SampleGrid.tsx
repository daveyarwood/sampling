import React, { useState, useEffect } from 'react';

interface Sample {
  url: string;
  name: string;
}

function SampleGrid() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSamples = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/random-samples');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (data.samples && Array.isArray(data.samples)) {
        const formattedSamples: Sample[] = data.samples.map((url: string, index: number) => ({
          url,
          name: `Sample ${index + 1}`,
        }));
        setSamples(formattedSamples);
      } else {
        setSamples([]);
        setError('No samples found in the response.');
      }
    } catch (e: any) {
      console.error("Failed to fetch samples:", e);
      setError(e.message);
      setSamples([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, []);

  return (
    <div>
      <h1>Freesound Sampler</h1>
      <button onClick={fetchSamples} disabled={loading}>
        {loading ? 'Loading...' : 'Get New Samples'}
      </button>

      {error && <p style={{ color: 'red', textAlign: 'center' }}>Error: {error}</p>}

      <div className="grid-container">
        {loading ? (
          <p>Loading samples...</p>
        ) : samples.length > 0 ? (
          samples.map((sample, index) => (
            <div key={index} className="pad">
              <h3>{sample.name}</h3>
              <audio controls src={sample.url} style={{ width: '100%' }}>
                Your browser does not support the audio element.
              </audio>
            </div>
          ))
        ) : (
          !error && <p>Click "Get New Samples" to load some sounds!</p>
        )}
      </div>
    </div>
  );
}

export default SampleGrid;
