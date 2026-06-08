const fs = require('fs/promises');
const path = require('path');

const {
  CSV_PATH,
  CSV_COLUMNS,
  DATA_DIR,
} = require('../config/constants');

function escapeCsvValue(value) {
  const str = value == null ? '' : String(value);

  if (
    str.includes(',') ||
    str.includes('"') ||
    str.includes('\n')
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

function recordsToCsv(records) {
  const header = CSV_COLUMNS.join(',');
  const rows = records.map((record) =>
    CSV_COLUMNS.map((column) =>
      escapeCsvValue(record[column] || '')
    ).join(',')
  );

  return [header, ...rows].join('\n');
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseCsv(content) {
  const lines = content
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const record = {};

    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });

    return record;
  });
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readSanctionsCsv() {
  try {
    const content = await fs.readFile(
      CSV_PATH,
      'utf8'
    );
    return parseCsv(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

function entityKey(record) {
  return [
    record['URL'] || '',
    record['Title'] || '',
    record['ReferenceNumber'] || '',
    record['WatchListType'] || '',
  ]
    .join('|')
    .toLowerCase();
}

function mergeRecords(existing, incoming) {
  const merged = new Map();

  for (const record of existing) {
    merged.set(entityKey(record), record);
  }

  for (const record of incoming) {
    merged.set(entityKey(record), record);
  }

  return Array.from(merged.values());
}

async function writeSanctionsCsv(records) {
  await ensureDataDir();
  const csv = recordsToCsv(records);
  await fs.writeFile(CSV_PATH, csv, 'utf8');
}

async function appendSanctions(newRecords) {
  const existing = await readSanctionsCsv();
  const merged = mergeRecords(existing, newRecords);
  await writeSanctionsCsv(merged);
  return merged;
}

module.exports = {
  readSanctionsCsv,
  writeSanctionsCsv,
  appendSanctions,
  mergeRecords,
};
