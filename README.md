# sanction-list

Automated sanctions monitoring for AMLC terrorism financing resolutions.

## What it does

1. Scrapes the [AMLC Resolution TF page](http://www.amlc.gov.ph/laws/terrorism-financing/resolution-related-to-terrorism-financing) for PDF links
2. Downloads each PDF and extracts sanction entities using Google Gemini
3. Merges results into `data/sanctions_list.csv`
4. Optionally syncs the CSV to GitHub
5. Runs on a daily cron schedule (configurable)

## Setup

### Backend

```bash
cd backend
cp .env.example .env
# Add your GEMINI_API_KEY to .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and click **Fetch from AMLC Website**.

**Both must be running locally.** The frontend calls `/api/*`, which Vite proxies to the backend on port 5000.

## Desktop app (.exe) with Electron

Package the full app as a Windows executable. Electron starts the backend automatically and opens the UI in a desktop window.

### One-time setup

```bash
npm run install:all
```

Ensure API keys are set before building:

- `backend/.env` — `GEMINI_API_KEY` (automation)
- `frontend/.env` — `VITE_GEMINI_API_KEY` (manual PDF upload)

### Run as desktop app (development)

```bash
npm run dev:electron
```

### Build Windows .exe installer

```bash
npm run build:exe
```

Output: `dist-electron/Sanction List Monitor Setup *.exe`

### How the .exe works

- Starts an embedded Express server on `127.0.0.1:58392`
- Serves the built React UI and `/api/*` from one process
- Stores data in `%APPDATA%/sanction-list-monitor/data/`
- Copies `backend/.env` to `%APPDATA%/sanction-list-monitor/.env` on first launch (edit there to change settings)

## Deploy to Vercel (frontend + backend)

This repo includes `vercel.json` for a monorepo deploy:

- Frontend: served at `/`
- Backend: served at `/api/*` (Vercel adds the `/api` prefix automatically)

Set these env vars in the Vercel project dashboard:

| Variable | Service |
|----------|---------|
| `GEMINI_API_KEY` | backend |
| `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO` | backend (optional) |

No `VITE_API_URL` needed — defaults to `/api` on the same domain.

## Deploy frontend + backend separately

If the backend is on Render/Railway and frontend on Vercel:

1. Deploy backend, note its URL (e.g. `https://sanction-list-api.onrender.com`)
2. In Vercel frontend env: `VITE_API_URL=https://sanction-list-api.onrender.com`
3. Enable CORS on the backend (already enabled)

## Manual CLI run

```bash
cd backend
npm run automation              # process only new PDFs
npm run automation -- --force   # re-process all PDFs
npm run automation -- --limit=2 # process first 2 new PDFs (testing)
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `CRON_SCHEDULE` | No | Cron expression (default: `0 6 * * *`) |
| `ENABLE_CRON` | No | Set to `false` to disable scheduler |
| `RATE_LIMIT_DELAY_MS` | No | Delay between PDFs (default: 2000) |
| `GITHUB_TOKEN` | No | GitHub PAT for CSV sync |
| `GITHUB_OWNER` | No | GitHub username/org |
| `GITHUB_REPO` | No | Repository name |
| `GITHUB_FILE_PATH` | No | Path in repo (default: `data/sanctions_list.csv`) |

## API endpoints

- `POST /api/automation/run` — trigger automation (`{ "force": false, "limit": 2 }`)
- `GET /api/automation/status` — automation status and logs
- `GET /api/automation/sanctions` — current CSV data as JSON
