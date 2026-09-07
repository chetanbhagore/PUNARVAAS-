/**
 * Centralized API client for PUNARVAAS backend
 */

const API_BASE = import.meta.env.VITE_API_BASE || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? '/api' 
    : 'https://punarvaas.onrender.com/api');

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

export async function fetchEvacuationBoard() {
  const res = await fetch(`${API_BASE}/operations/evacuation-board`);
  if (!res.ok) throw new Error('Failed to fetch evacuation execution board');
  return res.json();
}

export async function fetchOperationEvents(caseId = null) {
  const url = caseId 
    ? `${API_BASE}/operations/evacuation-board/events?case_id=${encodeURIComponent(caseId)}`
    : `${API_BASE}/operations/evacuation-board/events`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch operational audit events');
  return res.json();
}

export async function updateShelterReadiness(siteId, readinessPayload) {
  const res = await fetch(`${API_BASE}/safe-sites/${encodeURIComponent(siteId)}/readiness`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(readinessPayload)
  });
  if (!res.ok) throw new Error('Failed to update shelter readiness');
  return res.json();
}

// Offline Field Sync Queue Helpers
const OFFLINE_QUEUE_KEY = 'punarvaas_offline_evac_queue';

export function getOfflineQueue() {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function enqueueOfflineTransition(caseId, payload) {
  try {
    const queue = getOfflineQueue();
    queue.push({ caseId, payload, enqueuedAt: new Date().toISOString() });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('Failed to enqueue offline transition:', err);
  }
}

export async function flushOfflineQueue() {
  const queue = getOfflineQueue();
  if (!queue.length) return { synced: 0, failed: 0 };
  
  const remaining = [];
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      await transitionEvacuationCase(item.caseId, item.payload, false);
      synced++;
    } catch (err) {
      console.warn(`Failed to sync queued case ${item.caseId}:`, err);
      failed++;
      remaining.push(item);
    }
  }

  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
  } catch {
    // Ignore storage issues
  }
  return { synced, failed, remainingCount: remaining.length };
}

export async function transitionEvacuationCase(caseId, payload, allowOfflineQueue = true) {
  try {
    const res = await fetch(`${API_BASE}/operations/evacuation-board/${encodeURIComponent(caseId)}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to update evacuation cohort');
    }
    return await res.json();
  } catch (err) {
    if (allowOfflineQueue && typeof window !== 'undefined' && !navigator.onLine) {
      enqueueOfflineTransition(caseId, payload);
      return {
        queued_offline: true,
        case: { case_id: caseId, status: payload.status, blocker_note: payload.note, blocker_category: payload.blocker_category }
      };
    }
    throw err;
  }
}

