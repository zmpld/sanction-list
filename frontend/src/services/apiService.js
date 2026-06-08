const API_BASE =
  import.meta.env.VITE_API_URL || '/api';

export async function fetchSanctionsData() {
  const res = await fetch(
    `${API_BASE}/automation/sanctions`
  );

  if (!res.ok) {
    throw new Error('Failed to load sanctions data');
  }

  try {
    const data = await res.json();
    return data.records || [];
  } catch (error) {
    throw new Error(`Invalid response format: ${error.message}`);
  }
}

export async function fetchAutomationStatus() {
  const res = await fetch(
    `${API_BASE}/automation/status`
  );

  if (!res.ok) {
    throw new Error('Failed to load automation status');
  }

  try {
    return await res.json();
  } catch (error) {
    throw new Error(`Invalid response format: ${error.message}`);
  }
}

export async function runAutomation(options = {}) {
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

  if (!res.ok) {
    let errorMessage = 'Automation failed';
    try {
      const data = await res.json();
      errorMessage = data.error || errorMessage;
    } catch (parseError) {
      console.error('Failed to parse error response:', parseError);
      errorMessage = `Automation failed with status ${res.status}`;
    }
    throw new Error(errorMessage);
  }

  try {
    return await res.json();
  } catch (error) {
    throw new Error(`Invalid response format: ${error.message}`);
  }
}

export async function cancelAutomation() {
  const res = await fetch(
    `${API_BASE}/automation/cancel`,
    { method: 'POST' }
  );

  if (!res.ok) {
    throw new Error('Failed to cancel automation');
  }

  try {
    const data = await res.json();
    return data;
  } catch (error) {
    throw new Error(`Invalid response format: ${error.message}`);
  }
}
