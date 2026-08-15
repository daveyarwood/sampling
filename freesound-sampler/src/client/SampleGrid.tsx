import React, { useState, useEffect, useRef } from "react";

interface Sample {
  url: string;
  name: string;
}

const SampleGrid = () => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const audioRefs = useRef<Map<number, HTMLAudioElement>>(new Map());

  const fetchSamples = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setError(null);
    setCurrentlyPlaying(null);
    audioRefs.current.clear();
    try {
      const response = await fetch("/api/random-samples", { signal });
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
        setError("No samples found in the response.");
      }
      setLoading(false);
    } catch (e: any) {
      if (e.name === "AbortError") {
        console.log("Fetch aborted");
        return;
      }
      console.error("Failed to fetch samples:", e);
      setError(e.message);
      setSamples([]);
      setLoading(false);
    } finally {
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    fetchSamples();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handlePlayPause = (index: number) => {
    const audio = audioRefs.current.get(index);
    if (!audio) {
      return;
    }

    if (currentlyPlaying === index) {
      audio.pause();
      setCurrentlyPlaying(null);
    } else {
      audio.play();
      setCurrentlyPlaying(index);
    }
  };

  const handleAudioEnded = (index: number) => {
    setCurrentlyPlaying((prev) => (prev === index ? null : prev));
  };

  return (
    <div>
      <h1>Freesound Sampler</h1>
      <button onClick={fetchSamples} disabled={loading}>
        {loading ? "Loading..." : "Get New Samples"}
      </button>

      {error && <p style={{ color: "red", textAlign: "center" }}>Error: {error}</p>}

      <div className="grid-container">
        {loading ? (
          <p>Loading samples...</p>
        ) : samples.length > 0 ? (
          samples.map((sample, index) => (
            <div key={index} className="pad">
              <audio
                ref={(el) => {
                  if (el) {
                    audioRefs.current.set(index, el);
                  } else {
                    audioRefs.current.delete(index);
                  }
                }}
                src={sample.url}
                onEnded={() => handleAudioEnded(index)}
                style={{ display: "none" }}
              />
              <button
                className={`play-button ${currentlyPlaying === index ? "playing" : ""}`}
                onClick={() => handlePlayPause(index)}
                aria-label={currentlyPlaying === index ? "Pause" : "Play"}
              >
                {currentlyPlaying === index ? "\u23F8" : "\u25B6"}
              </button>
              <h3>{sample.name}</h3>
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
