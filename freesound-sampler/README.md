# Freesound Sampler

This web app fetches random audio samples from Freesound.org,
processes them into short clips, and presents them in a 4x4 grid
for auditioning. It helps you discover new sonic textures for
your sampler workflows.

## Features

*   Fetches random long audio files from Freesound.org
    (Creative Commons 0 license).
*   Chops each long audio file into 4 short (10-second) samples
    using `sox`.
*   Presents a total of 16 samples in a 4x4 grid.
*   Each sample is playable directly in the browser.
*   "Get New Samples" button to refresh the grid with new sounds.

## Technologies Used

*   **Frontend:** React, TypeScript, Vite
*   **Backend:** Node.js, Express, TypeScript
*   **Audio Processing:** `sox` (command-line tool)

## Setup and Running

### Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js** (LTS version recommended)
*   **npm** (comes with Node.js)
*   **`sox`**: This command-line audio processing tool is crucial.
    *   **On Debian/Ubuntu:** `sudo apt-get install sox libsox-fmt-all`
    *   **On macOS (using Homebrew):** `brew install sox`
    *   **On Windows:** Download from the [SoX website]
        (http://sox.sourceforge.net/).

### 1. Freesound API Credentials

1.  Go to [Freesound.org](https://freesound.org/) and create a free
    account if you don't have one.
2.  Once logged in, navigate to your [API access page]
    (https://freesound.org/home/api/) to create a new credential.
3.  When creating the credential, you must select **"Confidential"** for the
    client type when asked "Is your client confidential?".
4.  You will be provided with a **Client ID** and a **Client Secret**.
5.  Create a file named `.env` in the project root
    (`freesound-sampler/.env`).
6.  Add your Client ID and Client Secret to this file:

    ```
    FREESOUND_CLIENT_ID=YOUR_CLIENT_ID_HERE
    FREESOUND_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
    ```
    Replace the placeholders with your actual credentials.

### 2. Install Dependencies

Navigate to the `freesound-sampler` directory in your terminal and
install the Node.js dependencies:

```bash
cd freesound-sampler
npm install
```

### 3. Run the App and Authenticate

1.  Run the development server:
    ```bash
    npm run dev
    ```
2.  Open the application in your browser (e.g., `http://localhost:5173`).
3.  The app will detect that it's not yet authenticated and will guide
    you through a two-step process on-screen to get the necessary token.
    This is a one-time setup.

The application should be accessible in your web browser, typically at
`http://localhost:5173`. The backend API will be running on
`http://localhost:3000`.

### 4. Build for Production

To create a production-ready build of both the frontend and backend:

```bash
npm run build
```

This will compile the TypeScript code and build the React frontend,
placing the output in the `dist/` directory.

### 5. Start the Production Server

After building, you can start the production server:

```bash
npm start
```

The application will then be served by the Express backend, typically
on `http://localhost:3000`.

## Project Structure

```
freesound-sampler/
├── public/                 # Static files served by Express
│   └── samples/            # Generated audio samples (gitignored)
├── src/
│   ├── client/             # React frontend source code
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   └── server/             # Node.js/Express backend source code
│       ├── audio.ts        # Logic for audio processing with sox
│       ├── freesound.ts    # Freesound API client
│       └── index.ts        # Main Express server
├── .env                    # Environment variables (Freesound API Key)
├── .gitignore
├── index.html              # Main HTML file for the frontend
├── package.json            # Project dependencies and scripts
├── tsconfig.json           # TypeScript config for the client
├── tsconfig.server.json    # TypeScript config for the server
└── vite.config.ts          # Vite config for the frontend
```

## TODO

* Adhere to my coding standards (see instructions in `.gemini/`)
* We need to make sure that a bajillion wav files don't accumulate in the
  `public/samples` directory over time.
* Provide incremental feedback in the form of a progress bar (e.g.,)
  "Loading sample 3 of 16...") while the samples are downloading.
* Instead of rendering an `audio` element on the page, render a large ▶️ button
  that turns into a ⏸️ button.  Thee audio element itself can be hidden. The
  goal is to make it easier for the user to click to play.
* When a sample is played, highlight its border or background color to give
  visual feedback about which sample is currently playing.
* When a sample is played, stop any other samples that are currently playing.
* Display information about each sound (title, author, etc.) when hovering.
* Remove "Sample X" labels under each audio clip. Instead, display a short
  indicator of which Freesound sound it is.
* Consider using colors or other visual indicators (emoji?) to show which
  samples come from the same original long sound.
* Provide a button to download all 16 samples as a zip file.
* Allow the user to select which samples to replace, and then click the "get new
  samples" button to replace them.
* Improve the way we generate random search terms. We could use
  `/usr/share/dict/words` or a similar word list to get more varied terms.
* Another interesting idea is fetch the daily featured Wikipedia article
  title and use that as a search term to get more eclectic sounds.
* Try using the [Similar Sounds
endpoint](https://freesound.org/docs/api/resources_apiv2.html#similar-sounds-1)
to find similar sounds based on an initial random sound.
