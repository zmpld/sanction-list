const API_BASE =
  import.meta.env.VITE_API_URL || '/api';

export async function fetchSanctionsData() {
  try {
    const res = await fetch(
      `${API_BASE}/automation/sanctions`
    );

    const contentType = res.headers.get('content-type');

    if (!res.ok) {
      throw new Error(
        `API returned ${res.status}: ${res.statusText}`
      );
    }

    if (!contentType?.includes('application/json')) {
      console.error(
        'API returned non-JSON response:',
        contentType,
        res
      );
      throw new Error(
        `Expected JSON but got ${contentType || 'unknown'} from ${res.url}`
      );
    }

    const data = await res.json();
    return data.records || [];
  } catch (error) {
    console.error('fetchSanctionsData error:', error);
    throw new Error(
      `Failed to load sanctions data: ${error.message}`
    );
  }
}

export async function fetchAutomationStatus() {
  try {
    const res = await fetch(
      `${API_BASE}/automation/status`
    );

    const contentType = res.headers.get('content-type');

    if (!res.ok) {
      throw new Error(
        `API returned ${res.status}: ${res.statusText}`
      );
    }

    if (!contentType?.includes('application/json')) {
      throw new Error(
        `Expected JSON but got ${contentType || 'unknown'}`
      );
    }

    return await res.json();
  } catch (error) {
    console.error('fetchAutomationStatus error:', error);
    throw new Error(
      `Failed to load automation status: ${error.message}`
    );
  }
}

export async function runAutomation(options = {}) {
  try {
    const res = await fetch(
      `${API_BASE}/automation/run`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      }
    );

    const contentType = res.headers.get('content-type');

    if (!contentType?.includes('application/json')) {
      console.error(
        'Non-JSON response from /automation/run',
        contentType,
        res.status
      );
      throw new Error(
        `Expected JSON but got ${contentType || 'unknown'} (status: ${res.status})`
      );
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error || `Automation failed: ${res.status}`
      );
    }

    return data;
  } catch (error) {
    console.error('runAutomation error:', error);
    throw error;
  }
}

export async function cancelAutomation() {
  try {
    const res = await fetch(
      `${API_BASE}/automation/cancel`,
      { method: 'POST' }
    );

    const contentType = res.headers.get('content-type');

    if (!res.ok) {
      throw new Error(
        `API returned ${res.status}: ${res.statusText}`
      );
    }

    if (!contentType?.includes('application/json')) {
      throw new Error(
        `Expected JSON but got ${contentType || 'unknown'}`
      );
    }

    return await res.json();
  } catch (error) {
    console.error('cancelAutomation error:', error);
    throw error;
  }
}
