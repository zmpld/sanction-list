const API_BASE =
  import.meta.env.VITE_API_URL || '/api';

export async function fetchSanctionsData() {
  const res = await fetch(
    `${API_BASE}/automation/sanctions`
  );

  if (!res.ok) {
    throw new Error('Failed to load sanctions data');
  }

  const data = await res.json();
  return data.records || [];
}

export async function fetchAutomationStatus() {
  const res = await fetch(
    `${API_BASE}/automation/status`
  );

  if (!res.ok) {
    throw new Error('Failed to load automation status');
  }

  return res.json();
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

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.error || 'Automation failed'
    );
  }

  return data;
}

export async function cancelAutomation() {
  const res = await fetch(
    `${API_BASE}/automation/cancel`,
    { method: 'POST' }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.error || 'Failed to cancel automation'
    );
  }

  return data;
}
