import React, { useState, useEffect, useRef } from "react";

interface Sample {
  url: string;
  name: string;
  soundName: string;
  soundId: number;
  freesoundUrl: string;
}

const randomTerm = (): string => {
  const fallbacks = [
    "texture",
    "ambient",
    "rhythmic",
    "noise",
    "field",
    "synth",
    "vocal",
    "percussion",
    "drone",
    "melody",
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
};

const SampleGrid = () => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [searchTerms, setSearchTerms] = useState<string[]>(["", "", "", ""]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const audioRefs = useRef<Map<number, HTMLAudioElement>>(new Map());

  const fetchSamples = async (terms?: string[]) => {
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
      const searchParams = new URLSearchParams();
      const effectiveTerms = terms || searchTerms;
      if (effectiveTerms.some((t) => t.trim())) {
        const usedTerms = effectiveTerms.filter((t) => t.trim()).slice(0, 4);
        searchParams.set("terms", JSON.stringify(usedTerms));
      }
      const url = `/api/random-samples${searchParams.toString() ? "?" + searchParams.toString() : ""}`;
      const response = await fetch(url, { signal });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (data.samples && Array.isArray(data.samples)) {
        const formattedSamples: Sample[] = data.samples.map(
          (
            item: { url: string; soundName: string; soundId: number; freesoundUrl: string },
            index: number,
          ) => ({
            url: item.url,
            name: `Sample ${index + 1}`,
            soundName: item.soundName,
            soundId: item.soundId,
            freesoundUrl: item.freesoundUrl,
          }),
        );
        setSamples(formattedSamples);
      } else {
        setSamples([]);
        setError("No samples found in the response.");
      }

      if (data.terms && Array.isArray(data.terms)) {
        const padded = [...data.terms, "", "", "", ""].slice(0, 4);
        setSearchTerms(padded);
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
      if (currentlyPlaying !== null) {
        const currentAudio = audioRefs.current.get(currentlyPlaying);
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
      }
      audio.play();
      setCurrentlyPlaying(index);
    }
  };

  const handleAudioEnded = (index: number) => {
    setCurrentlyPlaying((prev) => (prev === index ? null : prev));
  };

  const handleTermChange = (index: number, value: string) => {
    const next = [...searchTerms];
    next[index] = value;
    setSearchTerms(next);
  };

  const handleDiceRoll = (index: number) => {
    const next = [...searchTerms];
    next[index] = randomTerm();
    setSearchTerms(next);
  };

  const rows = [0, 1, 2, 3];

  return (
    <div>
      <h1>Freesound Sampler</h1>
      <div className="search-terms">
        {rows.map((row) => (
          <div key={row} className="search-term-row">
            <span className="search-term-label">Row {row + 1}:</span>
            <input
              type="text"
              className="search-term-input"
              value={searchTerms[row] || ""}
              onChange={(e) => handleTermChange(row, e.target.value)}
              placeholder="search term"
              disabled={loading}
            />
            <button
              className="dice-button"
              onClick={() => handleDiceRoll(row)}
              disabled={loading}
              aria-label={`Randomize search term for row ${row + 1}`}
              title={`Randomize search term for row ${row + 1}`}
            >
              &#x1F3B2;
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
        <button onClick={() => fetchSamples()} disabled={loading}>
          {loading ? "Loading..." : "Get New Samples"}
        </button>
        {samples.length > 0 && !loading && (
          <a href="/api/download-zip" download="freesound-samples.zip" className="download-button">
            Download ZIP
          </a>
        )}
      </div>

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
                {currentlyPlaying === index ? (
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="currentColor"
                    style={{ pointerEvents: "none" }}
                  >
                    <rect x="5" y="3" width="5" height="18" />
                    <rect x="14" y="3" width="5" height="18" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill="currentColor"
                    style={{ pointerEvents: "none" }}
                  >
                    <polygon points="7,3 22,12 7,21" />
                  </svg>
                )}
              </button>
              <h3 title={`${sample.soundName} (ID: ${sample.soundId})`}>{sample.soundName}</h3>
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
