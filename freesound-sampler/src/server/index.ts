import * as dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import axios from 'axios';
import { searchSounds, downloadSound, exchangeCodeForToken, hasToken, refreshAccessToken } from './freesound';
import { processAudioFile } from './audio';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

// --- AUTHENTICATION ENDPOINTS ---

app.get('/api/auth/status', (_req: Request, res: Response) => {
  if (hasToken()) {
    res.json({ isAuthenticated: true, clientId: process.env.FREESOUND_CLIENT_ID });
  } else {
    res.json({ isAuthenticated: false, clientId: process.env.FREESOUND_CLIENT_ID });
  }
});

app.post('/api/auth/exchange-code', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Authorization code is missing.' });
    }
    await exchangeCodeForToken(code);
    res.json({ success: true, message: 'Authentication successful!' });
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, message: 'Failed to exchange code for token.', error: message });
  }
});


// --- SAMPLING ENDPOINT ---

app.get('/api/random-samples', async (_req: Request, res: Response) => {
  if (!hasToken()) {
    return res.status(401).json({ message: 'Authentication required. Please set up the application.' });
  }

  try {
    const randomWord = searchWords[Math.floor(Math.random() * searchWords.length)];
    console.log(`Searching Freesound for: "${randomWord}"`);

    const foundSounds = await searchSounds(randomWord);
    if (foundSounds.length === 0) {
      return res.status(404).json({ message: 'No suitable sounds found on Freesound.' });
    }

    let allSampleUrls: string[] = [];
    const numSourceSoundsToProcess = Math.min(foundSounds.length, 4);

    for (let i = 0; i < numSourceSoundsToProcess; i++) {
      const sound = foundSounds[i];
      console.log(`Downloading sound: ${sound.name} (ID: ${sound.id})`);
      const downloadedFilePath = await downloadSound(sound);
      console.log(`Processing audio file: ${downloadedFilePath}`);
      const samplesFromThisSource = await processAudioFile(downloadedFilePath);
      allSampleUrls = allSampleUrls.concat(samplesFromThisSource);
    }

    const finalSamples = allSampleUrls.slice(0, 16);
    res.json({ samples: finalSamples });

  } catch (error) {
    console.error('Error in /api/random-samples:', error);
    // Check if it's an expired token error
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      try {
        console.log('Access token expired, attempting to refresh...');
        await refreshAccessToken();
        // We don't retry the request automatically in this version to keep it simple.
        // We'll just tell the user to try again.
        return res.status(401).json({ message: 'Token expired and has been refreshed. Please try your request again.' });
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        return res.status(500).json({ message: 'Failed to refresh token. You may need to re-authenticate.' });
      }
    }
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: 'Failed to generate samples.', error: message });
  }
});

// A simple word list for generating random search queries
const searchWords = ['texture', 'ambient', 'rhythmic', 'noise', 'field', 'synth', 'vocal', 'percussion', 'drone', 'melody'];


// --- STATIC FILE SERVING ---

// Serve static files from the public directory (for samples)
app.use(express.static('public'));

// Serve static files from the React app
const clientBuildPath = path.join(__dirname, '../../dist/client');
app.use(express.static(clientBuildPath));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
