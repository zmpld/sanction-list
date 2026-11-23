# sanction-list

An automated sanctions monitoring tool for Anti-Money Laundering Council (AMLC) terrorism financing resolutions that scrapes PDF links, extracts sanctioned entities using Google Gemini, consolidates records into a CSV dataset, optionally syncs data to GitHub, and supports scheduled cron execution and Electron desktop packaging.

## What it does

1. Scrapes the [AMLC Resolution TF page](http://www.amlc.gov.ph/laws/terrorism-financing/resolution-related-to-terrorism-financing) for PDF links
2. Downloads each PDF and extracts sanction entities using Google Gemini
3. Merges results into `data/sanctions_list.csv`
4. Optionally syncs the CSV to GitHub
5. Runs on a daily cron schedule (configurable)

## Desktop app (.exe) with Electron

Package the full app as a Windows executable. Electron starts the backend automatically and opens the UI in a desktop window.

### One-time setup

```bash
npm run install:all
Ensure API keys are set before building:

backend/.env — GEMINI_API_KEY (automation)

frontend/.env — VITE_GEMINI_API_KEY (manual PDF upload)

Run as desktop app (development)
Bash
npm run dev:electron
Build Windows .exe installer
Bash
npm run build:exe
Output: dist-electron/Sanction List Monitor Setup *.exe

How the .exe works
Starts an embedded Express server on 127.0.0.1:58392

Serves the built React UI and /api/* from one process

Stores data in %APPDATA%/sanction-list-monitor/data/

Copies backend/.env to %APPDATA%/sanction-list-monitor/.env on first launch
