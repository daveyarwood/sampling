import React, { useState, useEffect, useRef } from 'react';

interface Sample {
  url: string;
  name: string;
}

const SampleGrid = () => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSamples = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/random-samples', { signal });
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
            setLoading(false); // Set loading to false here on success
          } catch (e: any) {
            if (e.name === 'AbortError') {
              console.log('Fetch aborted');
              return;
            }
            console.error("Failed to fetch samples:", e);
            setError(e.message);
            setSamples([]);
            setLoading(false); // Set loading to false here on actual error
          } finally {
            abortControllerRef.current = null;
          }  };

  useEffect(() => {
    fetchSamples();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
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
};

export default SampleGrid;
