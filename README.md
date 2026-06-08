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
