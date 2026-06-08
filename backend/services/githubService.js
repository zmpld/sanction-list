const GITHUB_API = 'https://api.github.com';

function isGithubConfigured() {
  return Boolean(
    process.env.GITHUB_TOKEN &&
      process.env.GITHUB_OWNER &&
      process.env.GITHUB_REPO
  );
}

function getGithubConfig() {
  return {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    filePath:
      process.env.GITHUB_FILE_PATH ||
      'data/sanctions_list.csv',
    branch: process.env.GITHUB_BRANCH || 'main',
  };
}

async function githubRequest(path, options = {}) {
  const { token } = getGithubConfig();

  const response = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
        `GitHub API error: ${response.status}`
    );
  }

  return data;
}

async function getFileSha() {
  const { owner, repo, filePath, branch, token } =
    getGithubConfig();

  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data.message ||
        `GitHub API error: ${response.status}`
    );
  }

  const data = await response.json();
  return data.sha;
}

async function uploadCsvToGithub(csvContent, message) {
  if (!isGithubConfigured()) {
    return { skipped: true };
  }

  const { owner, repo, filePath, branch } =
    getGithubConfig();

  const sha = await getFileSha();
  const content = Buffer.from(csvContent).toString(
    'base64'
  );

  const body = {
    message:
      message ||
      'Update sanctions list from AMLC automation',
    content,
    branch,
  };

  if (sha) {
    body.sha = sha;
  }

  const data = await githubRequest(
    `/repos/${owner}/${repo}/contents/${filePath}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  return {
    skipped: false,
    sha: data.content?.sha,
    htmlUrl: data.content?.html_url,
  };
}

module.exports = {
  isGithubConfigured,
  uploadCsvToGithub,
};
