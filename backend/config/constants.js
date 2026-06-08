const path = require('path');

const AMLC_SOURCE_URL =
  process.env.AMLC_SOURCE_URL ||
  'http://www.amlc.gov.ph/laws/terrorism-financing/resolution-related-to-terrorism-financing';

const AMLC_BASE_URL = 'http://www.amlc.gov.ph';

// Use /tmp on Vercel (serverless environment), otherwise use local data directory
const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'sanction-list-data')
  : path.join(__dirname, '..', '..', 'data');

const CSV_PATH = path.join(DATA_DIR, 'sanctions_list.csv');

const PROCESSED_STATE_PATH = path.join(
  DATA_DIR,
  'processed_pdfs.json'
);

const RATE_LIMIT_DELAY_MS = Number(
  process.env.RATE_LIMIT_DELAY_MS || 2000
);

const CRON_SCHEDULE =
  process.env.CRON_SCHEDULE || '0 6 * * *';

const CSV_COLUMNS = [
  'DataId',
  'VersionNumber',
  'Title',
  'LastNameCorporateName',
  'FirstName',
  'MiddleName',
  'ReferenceNumber',
  'IndividualCorporateType',
  'WatchListType',
  'Position',
  'WatchListSource',
  'Remarks',
  'CreatedDate',
  'UpdatedDate',
  'ContactPersonLastName',
  'ContactPersonFirstName',
  'Gender',
  'Deceased',
  'SantionSinceDay',
  'SantionSinceMonth',
  'SantionSinceYear',
  'SantionToDay',
  'SanctionToMonth',
  'SantionToYear',
  'URL',
  'SourceNameLink',
  'Image',
  'AdditionalDate',
  'LastReviewedDate',
  'DJStatus',
];

module.exports = {
  AMLC_SOURCE_URL,
  AMLC_BASE_URL,
  DATA_DIR,
  CSV_PATH,
  PROCESSED_STATE_PATH,
  RATE_LIMIT_DELAY_MS,
  CRON_SCHEDULE,
  CSV_COLUMNS,
};
