import React, { useEffect, useMemo, useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Radio, 
  RefreshCw, 
  Users, 
  History, 
  X, 
  Search, 
  Truck, 
  HeartPulse, 
  Wifi, 
  WifiOff, 
  ShieldAlert, 
  Clock,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { 
  fetchEvacuationBoard, 
  transitionEvacuationCase, 
  fetchOperationEvents,
  flushOfflineQueue,
  getOfflineQueue 
} from '../api';

const BLOCKER_TAXONOMY = [
  {
    code: 'ROAD_INUNDATED',
    label: 'Road / Culvert Inundated',
    desc: 'Water level above road threshold; regular vehicles cannot pass.',
    suggestedResource: '4x4 High-Clearance Tractor'
  },
  {
    code: 'TRANSPORT_UNAVAILABLE',
    label: 'Transport Unavailable / Overcapacity',
    desc: 'Allocated buses or trucks delayed or insufficient for cohort size.',
    suggestedResource: 'NDRF / ODRAF Transport Truck'
  },
  {
    code: 'MEDICAL_URGENT',
    label: 'Bedridden / Critical Medical Care',
    desc: 'Mobility-impaired, oxygen-dependent, or dialysis patient needing care.',
    suggestedResource: '108 Paramedic / Stretcher Van'
  },
  {
    code: 'LIVESTOCK_REFUSAL',
    label: 'Livestock / Asset Protection Refusal',
    desc: 'Household refusing evacuation without cattle refuge arrangements.',
    suggestedResource: 'Livestock Rescue & Fodder Team'
  },
  {
    code: 'UNREACHABLE_COMMUNICATION',
    label: 'Telecom Down / Village Unreachable',
    desc: 'No mobile network response; physical scout or VHF dispatch needed.',
    suggestedResource: 'Civil Defence Motorbike Scout'
  },
  {
    code: 'SHELTER_UNAVAILABLE',
    label: 'Assigned Shelter Infrastructure Failure',
    desc: 'Water pump failure, roof damage, or unexpected flooding at safe site.',
    suggestedResource: 'Emergency Shelter Reallocation'
  }
];

const NEXT_ACTION = {
  UNCONTACTED: { status: 'CONTACTED', label: 'Mark Contacted', color: 'bg-[#3D5A73] text-white hover:bg-[#16232E]' },
  CONTACTED: { status: 'PICKED_UP', label: 'Mark Picked Up', color: 'bg-[#D97A2E] text-white hover:bg-[#A24F0B]' },
  PICKED_UP: { status: 'CHECKED_IN', label: 'Mark Checked In', color: 'bg-[#3F8F5F] text-white hover:bg-[#23633C]' },
  BLOCKED: { status: 'CONTACTED', label: 'Resume Contact', color: 'bg-[#3D5A73] text-white hover:bg-[#16232E]' }
};

const STATUS_STYLE = {
  UNCONTACTED: 'bg-[#E0B33C]/15 text-[#6B5200] border-[#E0B33C]/40',
  CONTACTED: 'bg-[#3D5A73]/10 text-[#3D5A73] border-[#3D5A73]/30',
  PICKED_UP: 'bg-[#D97A2E]/10 text-[#A24F0B] border-[#D97A2E]/30',
  CHECKED_IN: 'bg-[#3F8F5F]/10 text-[#23633C] border-[#3F8F5F]/30',
  BLOCKED: 'bg-[#C13F3F]/10 text-[#9B2727] border-[#C13F3F]/30'
};

export default function EvacuationExecutionTab() {
  const [board, setBoard] = useState(null);
  const [actor, setActor] = useState('DEOC Dispatcher – Odisha Pilot');
  const [filter, setFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  // Blocker modal state
  const [blockerTarget, setBlockerTarget] = useState(null);
  const [blockerCategory, setBlockerCategory] = useState('ROAD_INUNDATED');
  const [resourceRequested, setResourceRequested] = useState('4x4 High-Clearance Tractor');
  const [blockerNote, setBlockerNote] = useState('');

  // Audit event history modal
  const [auditTarget, setAuditTarget] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  // Offline queue state
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineCount, setOfflineCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshOfflineStatus = () => {
    setOfflineCount(getOfflineQueue().length);
  };

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); autoSync(); };
    const handleOffline = () => { setIsOnline(false); refreshOfflineStatus(); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    refreshOfflineStatus();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const autoSync = async () => {
    const queue = getOfflineQueue();
    if (queue.length > 0) {
      setIsSyncing(true);
      await flushOfflineQueue();
      setIsSyncing(false);
      refreshOfflineStatus();
      await load();
    }
  };

  const load = async () => {
    setError('');
    try {
      const data = await fetchEvacuationBoard();
      setBoard(data);
      refreshOfflineStatus();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredCases = useMemo(() => {
    let list = board?.cases || [];
    if (filter !== 'ALL') list = list.filter(c => c.status === filter);
    if (urgencyFilter !== 'ALL') list = list.filter(c => c.urgency_tier === urgencyFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => 
        c.village.toLowerCase().includes(q) || 
        c.district.toLowerCase().includes(q) ||
        c.site_name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [board, filter, urgencyFilter, searchQuery]);

  const handleSimpleTransition = async (item, targetStatus) => {
    if (!actor.trim()) {
      setError('Please specify the Recording Officer or Dispatcher name.');
      return;
    }
    setBusyId(item.case_id);
    setError('');
    try {
      await transitionEvacuationCase(item.case_id, {
        status: targetStatus,
        actor_name: actor.trim(),
        note: targetStatus === 'CONTACTED' && item.status === 'BLOCKED' ? 'Blocker resolved; contact resumed.' : null
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
      refreshOfflineStatus();
    }
  };

  const openBlockerModal = (item) => {
    setBlockerTarget(item);
    setBlockerCategory('ROAD_INUNDATED');
    setResourceRequested('4x4 High-Clearance Tractor');
    setBlockerNote('');
  };

  const handleBlockerSubmit = async (e) => {
    e.preventDefault();
    if (!blockerTarget) return;
    if (!actor.trim()) {
      setError('Please specify the Recording Officer name.');
      return;
    }
    if (!blockerNote.trim()) {
      setError('Please provide a brief situation note explaining the blocker.');
      return;
    }

    setBusyId(blockerTarget.case_id);
    setError('');
    try {
      await transitionEvacuationCase(blockerTarget.case_id, {
        status: 'BLOCKED',
        actor_name: actor.trim(),
        blocker_category: blockerCategory,
        resource_requested: resourceRequested.trim() || null,
        note: blockerNote.trim()
      });
      setBlockerTarget(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
      refreshOfflineStatus();
    }
  };

  const openAuditDrawer = async (item) => {
    setAuditTarget(item);
    setIsAuditLoading(true);
    try {
      const res = await fetchOperationEvents(item.case_id);
      setAuditEvents(res.events || []);
    } catch (err) {
      setError('Failed to fetch audit ledger: ' + err.message);
    } finally {
      setIsAuditLoading(false);
    }
  };

  if (!board && !error) {
    return (
      <div className="p-12 text-center text-sm text-[#5C6B76] animate-pulse flex flex-col items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin mb-2 text-[#3D5A73]" />
        Loading PUNARVAAS Evacuation Execution Board…
      </div>
    );
  }

  const summary = board?.summary || {};
  const shelterOccupancy = board?.shelter_live_occupancy || {};

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-[#16232E] rounded-lg p-5 text-white flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-[#E0B33C] text-xs font-bold uppercase tracking-wider">
            <Radio className="w-4 h-4 animate-pulse" /> 
            Official Warning → Field Execution → Verified Safe Arrival
          </div>
          <h1 className="text-xl font-bold mt-1 tracking-tight">Evacuation Execution Board (Version 2)</h1>
          <p className="text-xs text-[#EDF0F2]/75 mt-1 max-w-2xl leading-relaxed">
            PUNARVAAS converts disaster warnings into accountable field operations. Track assigned priority cohorts through each operational stage, escalate road and transport blockers, and verify safe shelter arrival.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={load} 
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded bg-[#3D5A73] hover:bg-[#2B3F50] text-xs font-semibold cursor-pointer transition-colors text-white"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Field State
          </button>
        </div>
      </div>

      {/* Offline Status & Integrity Notice */}
      {!isOnline && (
        <div className="border border-[#D97A2E] bg-[#D97A2E]/10 rounded p-3 text-xs text-[#A24F0B] flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <WifiOff className="w-4 h-4 text-[#D97A2E]" />
            <span>Field Offline Mode Active — State transitions are queued locally and will automatically synchronize when network is restored.</span>
          </div>
          <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-[#D97A2E]/30">{offlineCount} actions queued</span>
        </div>
      )}

      {offlineCount > 0 && isOnline && (
        <div className="border border-[#3D5A73] bg-[#3D5A73]/10 rounded p-3 text-xs text-[#3D5A73] flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Wifi className="w-4 h-4" />
            <span>Network Connected — {offlineCount} offline field actions ready to synchronize with the control room ledger.</span>
          </div>
          <button 
            onClick={autoSync} 
            disabled={isSyncing}
            className="px-3 py-1 bg-[#3D5A73] text-white rounded text-xs font-semibold hover:bg-[#16232E] disabled:opacity-50"
          >
            {isSyncing ? 'Syncing…' : 'Sync Offline Actions'}
          </button>
        </div>
      )}

      <div className="border border-[#E0B33C] bg-[#E0B33C]/10 rounded p-3 text-xs text-[#5C6B76] flex gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 text-[#A77900] mt-0.5" />
        <div>
          <span className="font-semibold text-[#16232E]">Data Provenance Notice: </span>
          <span>{board?.disclaimer || 'Each row is an allocation cohort derived from synthetic habitation totals.'}</span>
        </div>
      </div>

      {error && (
        <div className="border border-[#C13F3F] bg-[#C13F3F]/10 text-[#9B2727] rounded p-3 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-[#C13F3F] hover:text-[#9B2727]"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Metric Cards with Quick Status Filters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'People Assigned', value: summary.people_assigned || 0, color: 'text-[#16232E]', sub: `${summary.cohorts_total || 0} priority cohorts`, filterKey: 'ALL' },
          { label: 'Checked In Safely', value: summary.people_checked_in || 0, color: 'text-[#3F8F5F]', sub: 'Verified safe at shelters', filterKey: 'CHECKED_IN' },
          { label: 'Blocked — Urgent Escalation', value: summary.people_blocked || 0, color: 'text-[#C13F3F]', sub: 'Road, transport or medical barrier', filterKey: 'BLOCKED' },
          { label: 'Pending Contact', value: summary.people_pending_contact || 0, color: 'text-[#A77900]', sub: 'Awaiting field volunteer reach', filterKey: 'UNCONTACTED' }
        ].map((item) => (
          <div 
            key={item.label}
            onClick={() => setFilter(item.filterKey)}
            className={`bg-white border rounded p-4 cursor-pointer transition-all hover:shadow-md ${filter === item.filterKey ? 'border-[#3D5A73] ring-1 ring-[#3D5A73]' : 'border-[#DDE3E8]'}`}
          >
            <p className="text-[11px] font-semibold text-[#5C6B76]">{item.label}</p>
            <p className={`text-2xl font-bold mt-1 ${item.color}`}>{Number(item.value).toLocaleString()}</p>
            <p className="text-[10px] text-[#5C6B76] mt-1">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Control Room Dispatcher Toolbar */}
      <div className="bg-white border border-[#DDE3E8] rounded p-4 flex flex-col md:flex-row gap-3 md:items-end">
        <label className="block flex-1 text-xs font-semibold text-[#16232E]">
          Operating Dispatcher / Field Volunteer Identity
          <input 
            value={actor} 
            onChange={e => setActor(e.target.value)} 
            maxLength={80} 
            placeholder="e.g. DEOC Officer Mohapatra, Block ASHA Coordinator"
            className="mt-1 w-full border border-[#DDE3E8] rounded px-2.5 py-2 text-sm font-normal focus:outline-none focus:border-[#3D5A73]" 
          />
        </label>

        <div className="w-full md:w-48">
          <label className="block text-xs font-semibold text-[#16232E]">Filter by Status</label>
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)} 
            className="mt-1 block w-full border border-[#DDE3E8] rounded px-2.5 py-2 text-sm font-normal focus:outline-none focus:border-[#3D5A73]"
          >
            <option value="ALL">All Statuses</option>
            <option value="BLOCKED">Blocked (Escalated)</option>
            <option value="UNCONTACTED">Uncontacted</option>
            <option value="CONTACTED">Contacted</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="CHECKED_IN">Checked In</option>
          </select>
        </div>

        <div className="w-full md:w-36">
          <label className="block text-xs font-semibold text-[#16232E]">Urgency Tier</label>
          <select 
            value={urgencyFilter} 
            onChange={e => setUrgencyFilter(e.target.value)} 
            className="mt-1 block w-full border border-[#DDE3E8] rounded px-2.5 py-2 text-sm font-normal focus:outline-none focus:border-[#3D5A73]"
          >
            <option value="ALL">All Tiers</option>
            <option value="IMMEDIATE">IMMEDIATE</option>
            <option value="SHORT_TERM">SHORT_TERM</option>
          </select>
        </div>

        <div className="w-full md:w-64">
          <label className="block text-xs font-semibold text-[#16232E]">Search Habitation / Shelter</label>
          <div className="relative mt-1">
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search village, district..."
              className="w-full border border-[#DDE3E8] rounded pl-8 pr-2.5 py-2 text-sm font-normal focus:outline-none focus:border-[#3D5A73]"
            />
            <Search className="w-4 h-4 text-[#5C6B76] absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Cohort Execution List */}
      <div className="bg-white border border-[#DDE3E8] rounded overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#DDE3E8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#F8FAFB]">
          <div>
            <h2 className="text-sm font-bold text-[#16232E]">Priority Evacuation Cohorts</h2>
            <p className="text-xs text-[#5C6B76] mt-0.5">
              Each state transition updates the live evacuation board and records an immutable audit ledger entry.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#3D5A73] bg-[#3D5A73]/10 px-2.5 py-1 rounded">
            Showing {filteredCases.length} of {board?.cases?.length || 0} cohorts
          </span>
        </div>

        {filteredCases.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#5C6B76]">
            No evacuation cohorts match the selected filters.
          </div>
        ) : (
          <div className="divide-y divide-[#DDE3E8]">
            {filteredCases.map(item => {
              const next = NEXT_ACTION[item.status];
              const isBlocked = item.status === 'BLOCKED';
              const isCheckedIn = item.status === 'CHECKED_IN';
              const isBusy = busyId === item.case_id;

              return (
                <div 
                  key={item.case_id} 
                  className={`p-4.5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-colors ${isBlocked ? 'bg-[#C13F3F]/5 border-l-4 border-l-[#C13F3F]' : ''}`}
                >
                  {/* Left: Info */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold border px-2 py-0.5 rounded tracking-wide ${STATUS_STYLE[item.status]}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.urgency_tier === 'IMMEDIATE' ? 'bg-[#C13F3F] text-white' : 'bg-[#E0B33C]/20 text-[#6B5200]'}`}>
                        {item.urgency_tier}
                      </span>
                      <span className="text-[11px] text-[#5C6B76]">
                        Cohort ID: <span className="font-mono">{item.allocation_id}</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-[#16232E] inline">
                        {item.village}, {item.district}
                      </h3>
                      <span className="text-xs text-[#5C6B76] ml-2">
                        <Users className="w-3.5 h-3.5 inline mr-1 text-[#3D5A73]" />
                        <strong className="text-[#16232E]">{item.allocated_headcount.toLocaleString()}</strong> people assigned → <strong className="text-[#16232E]">{item.site_name}</strong>
                      </span>
                    </div>

                    {/* Blocker Callout if Blocked */}
                    {isBlocked && (
                      <div className="mt-2 bg-[#C13F3F]/10 border border-[#C13F3F]/30 rounded p-2.5 text-xs text-[#9B2727] space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <ShieldAlert className="w-4 h-4 text-[#C13F3F]" />
                          <span>ESCALATION: {item.blocker_category ? item.blocker_category.replace('_', ' ') : 'Operational Blocker Reported'}</span>
                        </div>
                        {item.resource_requested && (
                          <div className="text-[11px]">
                            <strong>Resource Needed: </strong> {item.resource_requested}
                          </div>
                        )}
                        {item.blocker_note && (
                          <div className="text-[11px] text-[#5C6B76]">
                            <strong>Situation: </strong> {item.blocker_note}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => openAuditDrawer(item)}
                      className="px-2.5 py-1.5 rounded border border-[#DDE3E8] bg-white hover:bg-[#F8FAFB] text-xs text-[#5C6B76] font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <History className="w-3.5 h-3.5" /> Audit Trail
                    </button>

                    {/* Forward State Transition */}
                    {next && (
                      <button
                        disabled={isBusy}
                        onClick={() => handleSimpleTransition(item, next.status)}
                        className={`px-3.5 py-2 rounded text-xs font-semibold disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer transition-colors ${next.color}`}
                      >
                        {isBusy ? 'Updating…' : next.label}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Report Blocker Button */}
                    {!isCheckedIn && !isBlocked && (
                      <button
                        disabled={isBusy}
                        onClick={() => openBlockerModal(item)}
                        className="px-3 py-2 rounded border border-[#C13F3F] text-[#C13F3F] hover:bg-[#C13F3F]/10 text-xs font-semibold disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Report Blocker
                      </button>
                    )}

                    {/* Check-In Success State */}
                    {isCheckedIn && (
                      <span className="px-3 py-1.5 text-xs text-[#3F8F5F] font-bold bg-[#3F8F5F]/10 border border-[#3F8F5F]/30 rounded inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Verified Safe Arrival
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Structured Blocker Escalation Modal */}
      {blockerTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-[#DDE3E8] animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE3E8]">
              <div className="flex items-center gap-2 text-[#C13F3F]">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-bold text-base text-[#16232E]">Report Operational Evacuation Blocker</h3>
              </div>
              <button onClick={() => setBlockerTarget(null)} className="text-[#5C6B76] hover:text-[#16232E]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBlockerSubmit} className="space-y-4 mt-4">
              <div className="bg-[#EDF0F2] rounded p-2.5 text-xs text-[#16232E]">
                <strong>Cohort:</strong> {blockerTarget.village}, {blockerTarget.district} ({blockerTarget.allocated_headcount.toLocaleString()} people assigned to {blockerTarget.site_name})
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16232E] mb-1">Standardized Blocker Category</label>
                <select
                  value={blockerCategory}
                  onChange={e => {
                    setBlockerCategory(e.target.value);
                    const match = BLOCKER_TAXONOMY.find(b => b.code === e.target.value);
                    if (match) setResourceRequested(match.suggestedResource);
                  }}
                  className="w-full border border-[#DDE3E8] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C13F3F]"
                >
                  {BLOCKER_TAXONOMY.map(tax => (
                    <option key={tax.code} value={tax.code}>{tax.label}</option>
                  ))}
                </select>
                <p className="text-[11px] text-[#5C6B76] mt-1">
                  {BLOCKER_TAXONOMY.find(b => b.code === blockerCategory)?.desc}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16232E] mb-1">Resource Requested / Action Needed</label>
                <input
                  value={resourceRequested}
                  onChange={e => setResourceRequested(e.target.value)}
                  placeholder="e.g. 4x4 Tractor, Inflatable Boat, Medical Van"
                  className="w-full border border-[#DDE3E8] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C13F3F]"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    '4x4 High-Clearance Tractor',
                    'NDRF Inflatable Motorized Boat',
                    '108 Paramedic / Stretcher Van',
                    'Livestock Fodder & Refuge Team',
                    'Emergency Shelter Reallocation'
                  ].map(pill => (
                    <button
                      type="button"
                      key={pill}
                      onClick={() => setResourceRequested(pill)}
                      className="text-[10px] bg-[#EDF0F2] hover:bg-[#DDE3E8] text-[#3D5A73] px-2 py-0.5 rounded cursor-pointer transition-colors"
                    >
                      + {pill}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16232E] mb-1">Field Situation Note</label>
                <textarea
                  value={blockerNote}
                  onChange={e => setBlockerNote(e.target.value)}
                  rows={3}
                  placeholder="Describe location of barrier, water depth, stranded count, or specific assistance required..."
                  className="w-full border border-[#DDE3E8] rounded p-2.5 text-xs focus:outline-none focus:border-[#C13F3F]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#DDE3E8]">
                <button
                  type="button"
                  onClick={() => setBlockerTarget(null)}
                  className="px-4 py-2 rounded border border-[#DDE3E8] text-xs font-semibold text-[#5C6B76] hover:bg-[#F8FAFB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#C13F3F] text-white text-xs font-semibold hover:bg-[#9B2727] cursor-pointer"
                >
                  Escalate Blocker to Control Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Trail Drawer / Modal */}
      {auditTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-[#DDE3E8] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDE3E8] shrink-0">
              <div className="flex items-center gap-2 text-[#3D5A73]">
                <History className="w-5 h-5" />
                <h3 className="font-bold text-base text-[#16232E]">Operational Audit Ledger</h3>
              </div>
              <button onClick={() => setAuditTarget(null)} className="text-[#5C6B76] hover:text-[#16232E]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-2.5 border-b border-[#DDE3E8] text-xs text-[#5C6B76] shrink-0">
              <strong>Cohort:</strong> {auditTarget.village}, {auditTarget.district} ({auditTarget.allocated_headcount.toLocaleString()} evacuees)
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-3">
              {isAuditLoading ? (
                <div className="p-8 text-center text-xs text-[#5C6B76] animate-pulse">Loading audit history…</div>
              ) : auditEvents.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#5C6B76]">No event history recorded yet for this cohort.</div>
              ) : (
                auditEvents.map((evt, idx) => (
                  <div key={evt.event_id || idx} className="border border-[#DDE3E8] rounded p-3 text-xs bg-[#F8FAFB] relative pl-4">
                    <div className="flex items-center justify-between font-bold text-[#16232E]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#5C6B76] font-normal">{evt.from_status || 'INIT'}</span>
                        <ArrowRight className="w-3 h-3 text-[#3D5A73]" />
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${STATUS_STYLE[evt.to_status]}`}>
                          {evt.to_status}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#5C6B76] font-mono">
                        {new Date(evt.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <div className="mt-1.5 text-[#5C6B76] flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 inline text-[#3D5A73]" />
                      <span>Recorded by: <strong className="text-[#16232E]">{evt.actor_name}</strong></span>
                    </div>

                    {evt.blocker_category && (
                      <div className="mt-1 text-[11px] text-[#C13F3F]">
                        <strong>Blocker Category:</strong> {evt.blocker_category.replace('_', ' ')}
                      </div>
                    )}
                    {evt.resource_requested && (
                      <div className="mt-0.5 text-[11px] text-[#3D5A73]">
                        <strong>Requested:</strong> {evt.resource_requested}
                      </div>
                    )}
                    {evt.note && (
                      <div className="mt-1 p-1.5 bg-white rounded border border-[#DDE3E8] text-[11px] text-[#16232E]">
                        {evt.note}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[#DDE3E8] shrink-0 text-right">
              <button 
                onClick={() => setAuditTarget(null)} 
                className="px-4 py-2 bg-[#3D5A73] hover:bg-[#16232E] text-white rounded text-xs font-semibold cursor-pointer"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
