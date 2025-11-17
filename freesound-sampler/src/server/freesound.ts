import axios from 'axios';
import * as fsPromises from 'fs/promises';
import * as fs from 'fs';
import path from 'path';
import * as os from 'os';

const FREESOUND_API_URL = 'https://freesound.org/apiv2';
const CLIENT_ID = process.env.FREESOUND_CLIENT_ID;
const CLIENT_SECRET = process.env.FREESOUND_CLIENT_SECRET;
const TOKEN_FILE_PATH = path.join(__dirname, '..', '..', 'token.json');

interface TokenData {
  access_token: string;
  refresh_token: string;
}

// --- Token File Management ---

async function readToken(): Promise<TokenData | null> {
  try {
    const data = await fsPromises.readFile(TOKEN_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null; // File doesn't exist or is invalid
  }
}

async function writeToken(tokenData: TokenData): Promise<void> {
  await fsPromises.writeFile(TOKEN_FILE_PATH, JSON.stringify(tokenData, null, 2), 'utf-8');
}

export function hasToken(): boolean {
  try {
    // Use synchronous check for the initial auth status endpoint
    require('fs').accessSync(TOKEN_FILE_PATH);
    return true;
  } catch (error) {
    return false;
  }
}

// --- OAuth2 Logic ---

export async function exchangeCodeForToken(code: string): Promise<void> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Freesound Client ID or Secret is not configured.');
  }
  const response = await axios.post(
    `${FREESOUND_API_URL}/oauth2/access_token/`,
    new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
    })
  );
  await writeToken(response.data);
  console.log('Successfully exchanged code for token and created token.json.');
}

export async function refreshAccessToken(): Promise<void> {
  const currentToken = await readToken();
  if (!currentToken || !currentToken.refresh_token) {
    throw new Error('No refresh token available.');
  }
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Freesound Client ID or Secret is not configured.');
  }

  const response = await axios.post(
    `${FREESOUND_API_URL}/oauth2/access_token/`,
    new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: currentToken.refresh_token,
    })
  );
  await writeToken(response.data);
  console.log('Successfully refreshed access token.');
}


// --- API Resource Functions ---

interface Sound {
  id: number;
  name: string;
  download: string;
}

export async function searchSounds(query: string): Promise<Sound[]> {
  if (!CLIENT_SECRET) throw new Error('Freesound Client Secret is not configured.');
  const searchParams = {
    query,
    token: CLIENT_SECRET,
    fields: 'id,name,download',
    filter: 'duration:[30 TO 180] license:"Creative Commons 0"',
    sort: 'rating_desc',
    page_size: 10,
  };
  const response = await axios.get<{ results: Sound[] }>(`${FREESOUND_API_URL}/search/text/`, { params: searchParams });
  return response.data.results.sort(() => 0.5 - Math.random()).slice(0, 4);
}

export async function downloadSound(sound: Sound): Promise<string> {
  const tokenData = await readToken();
  if (!tokenData || !tokenData.access_token) {
    throw new Error('Not authenticated. Access token is missing.');
  }

  const tempDirPrefix = path.join(os.tmpdir(), 'freesound-');
  const uniqueTempDir = await fsPromises.mkdtemp(tempDirPrefix);
  const filePath = path.join(uniqueTempDir, `${sound.id}.mp3`);

  const response = await axios.get(sound.download, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
    responseType: 'stream',
  });

  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(filePath));
    writer.on('error', reject);
  });
}
