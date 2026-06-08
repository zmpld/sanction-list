const cheerio = require('cheerio');

const {
  AMLC_SOURCE_URL,
  AMLC_BASE_URL,
} = require('../config/constants');

function resolveUrl(href) {
  if (!href) return null;

  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }

  const normalized = href.startsWith('/')
    ? href
    : `/${href}`;

  return `${AMLC_BASE_URL}${normalized}`;
}

function isAmlcResolutionTfLink(linkText, href) {
  const text = (linkText || '').trim();
  const url = (href || '').toLowerCase();

  return (
    text.includes('AMLC Resolution TF') &&
    url.endsWith('.pdf')
  );
}

async function fetchPdfLinks() {
  const response = await fetch(AMLC_SOURCE_URL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; SanctionListBot/1.0)',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch AMLC page: ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const links = [];
  const seen = new Set();

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    const linkText = $(element).text().trim();

    if (!isAmlcResolutionTfLink(linkText, href)) {
      return;
    }

    const url = resolveUrl(href);

    if (!url || seen.has(url)) {
      return;
    }

    seen.add(url);

    links.push({
      title: linkText,
      url,
    });
  });

  return links;
}

module.exports = {
  fetchPdfLinks,
};
