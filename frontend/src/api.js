/**
 * Centralized API client for PUNARVAAS backend
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchHabitations(params = {}) {
  const query = new URLSearchParams();
  if (params.district) query.set('district', params.district);
  if (params.hazard_type) query.set('hazard_type', params.hazard_type);
  if (params.zone) query.set('zone', params.zone);
  if (params.search) query.set('search', params.search);

  const res = await fetch(`${API_BASE}/habitations?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch habitations');
  return res.json();
}

export async function fetchHabitationDetail(id) {
  const res = await fetch(`${API_BASE}/habitations/${id}`);
  if (!res.ok) throw new Error('Failed to fetch habitation');
  return res.json();
}

export async function fetchAlerts(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.severity) query.set('severity', params.severity);
  if (params.district) query.set('district', params.district);
  if (params.hazard_type) query.set('hazard_type', params.hazard_type);

  const res = await fetch(`${API_BASE}/alerts?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function fetchAlertDetail(id) {
  const res = await fetch(`${API_BASE}/alerts/${id}`);
  if (!res.ok) throw new Error('Failed to fetch alert detail');
  return res.json();
}

export async function fetchSafeSites(district = null) {
  const url = district ? `${API_BASE}/safe-sites?district=${encodeURIComponent(district)}` : `${API_BASE}/safe-sites`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch safe sites');
  return res.json();
}

export async function fetchCapacity() {
  const res = await fetch(`${API_BASE}/capacity`);
  if (!res.ok) throw new Error('Failed to fetch carrying capacity');
  return res.json();
}

export async function fetchScenarios() {
  const res = await fetch(`${API_BASE}/scenarios`);
  if (!res.ok) throw new Error('Failed to fetch scenarios');
  return res.json();
}

export async function triggerSimulation(scenarioId) {
  const res = await fetch(`${API_BASE}/scenarios/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario_id: scenarioId })
  });
  if (!res.ok) throw new Error('Failed to trigger simulation');
  return res.json();
}

export async function triggerJudgeDemo() {
  const res = await fetch(`${API_BASE}/scenarios/judge-demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to trigger Judge Demo Mode');
  return res.json();
}

export async function fetchMlInfo() {
  const res = await fetch(`${API_BASE}/ml/info`);
  if (!res.ok) throw new Error('Failed to fetch ML info');
  return res.json();
}

export async function fetchAnalytics() {
  const res = await fetch(`${API_BASE}/analytics`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function fetchRelocationPlan() {
  const res = await fetch(`${API_BASE}/relocation/plan`);
  if (!res.ok) throw new Error('Failed to fetch relocation plan');
  return res.json();
}

export async function fetchHabitationLogistics(habitationId) {
  const res = await fetch(`${API_BASE}/relocation/recommendations/${encodeURIComponent(habitationId)}`);
  if (!res.ok) throw new Error('Failed to fetch habitation logistics');
  return res.json();
}
