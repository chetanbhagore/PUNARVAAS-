import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  AlertCircle,
  CheckCircle2,
  Clock,
  Shield,
  Building2,
  Users,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  Layers,
  ArrowRight,
  Filter,
  Search,
  Check
} from 'lucide-react';
import { fetchRelocationPlan } from '../api';

const TIER_BADGE = {
  IMMEDIATE: 'bg-[#C13F3F] text-white',
  SHORT_TERM: 'bg-[#D97A2E] text-white',
  MEDIUM_TERM: 'bg-[#E0B33C] text-black font-semibold',
  MONITOR: 'bg-[#3F8F5F] text-white'
};

export default function RelocationTab() {
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter and search states
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAllocId, setExpandedAllocId] = useState(null);

  // Human official approval state (Set of allocation IDs)
  const [approvedAllocations, setApprovedAllocations] = useState(() => {
    try {
      const saved = localStorage.getItem('punarvaas_approved_allocations');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    fetchRelocationPlan()
      .then((data) => {
        setPlanData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Relocation plan fetch error:', err);
        setError(err.message || 'Failed to load relocation plan');
        setLoading(false);
      });
  }, []);

  const toggleApproval = (id) => {
    setApprovedAllocations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem('punarvaas_approved_allocations', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const approveAllFiltered = (allocIds) => {
    setApprovedAllocations((prev) => {
      const next = new Set(prev);
      allocIds.forEach((id) => next.add(id));
      try {
        localStorage.setItem('punarvaas_approved_allocations', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const summary = planData?.summary || {};
  const allocations = planData?.allocations || [];
  const rankedSites = planData?.ranked_sites || [];
  const unallocated = planData?.unallocated_habitations || [];

  // Filtered allocations
  const filteredAllocations = useMemo(() => {
    return allocations.filter((a) => {
      if (selectedDistrict !== 'ALL' && a.district !== selectedDistrict) return false;
      if (selectedTier !== 'ALL' && a.urgency_tier !== selectedTier) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = a.village?.toLowerCase().includes(q);
        const matchSite = a.site_name?.toLowerCase().includes(q);
        const matchId = a.habitation_id?.toLowerCase().includes(q);
        if (!matchName && !matchSite && !matchId) return false;
      }
      return true;
    });
  }, [allocations, selectedDistrict, selectedTier, searchQuery]);

  // Export CSV function for field deployment
  const exportCSV = () => {
    if (!allocations.length) return;
    const headers = [
      'Allocation_ID',
      'Habitation_ID',
      'Village',
      'District',
      'Hazard_Type',
      'Urgency_Tier',
      'Risk_Zone',
      'Allocated_Headcount',
      'Assigned_Site_ID',
      'Assigned_Site_Name',
      'Site_District',
      'Suitability_Score',
      'Official_Approval_Status',
      'Decision_Explanation'
    ];

    const rows = filteredAllocations.map((a) => [
      a.allocation_id,
      a.habitation_id,
      `"${a.village}"`,
      a.district,
      a.hazard_type,
      a.urgency_tier,
      a.zone,
      a.allocated_headcount,
      a.site_id,
      `"${a.site_name}"`,
      a.site_district,
      a.site_score,
      approvedAllocations.has(a.allocation_id) ? 'APPROVED' : 'PENDING_REVIEW',
      `"${a.explanation.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `punarvaas_relocation_order_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] p-12 rounded text-center shadow-sm">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#3D5A73] border-t-transparent mb-3"></div>
        <div className="text-sm font-semibold text-[#16232E]">Computing optimal shelter allocations...</div>
        <div className="text-xs text-[#5C6B76] mt-1">Evaluating road access, infrastructure scores, and shelter capacities.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FFFFFF] border border-red-200 p-8 rounded text-center shadow-sm">
        <AlertCircle className="w-8 h-8 text-[#C13F3F] mx-auto mb-2" />
        <div className="text-sm font-bold text-[#16232E]">Failed to load relocation decision model</div>
        <div className="text-xs text-[#5C6B76] mt-1">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Operational Explanation Banner */}
      <div className="bg-[#FFFFFF] border-2 border-[#DDE3E8] p-5 rounded shadow-sm">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded bg-[#EDF0F2] text-[#3D5A73] shrink-0">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#5C6B76] uppercase tracking-wider bg-[#EDF0F2] px-2 py-0.5 rounded">
                  SDMA Operational Decision Support
                </span>
                <span className="text-[10px] font-bold text-[#3F8F5F] bg-[#3F8F5F]/10 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Explainable Engine Active
                </span>
              </div>
              <h1 className="text-lg font-bold text-[#16232E] mt-1">
                Relocation Planning & Capacity-Constrained Shelter Allocation
              </h1>
              <p className="text-xs text-[#5C6B76] mt-1 max-w-3xl leading-relaxed">
                Automated multi-criteria matching pairs high-urgency settlements (Immediate & Short-Term) with certified safe shelters. 
                Every assignment is bounded by shelter capacity limits and transparent scoring, requiring explicit human sign-off before field dispatch.
              </p>
            </div>
          </div>

          {/* Quick Action Export */}
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-start">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#EDF0F2] hover:bg-[#DDE3E8] text-xs font-semibold text-[#16232E] transition-colors cursor-pointer border border-[#DDE3E8]"
            >
              <Download className="w-3.5 h-3.5 text-[#3D5A73]" />
              <span>Export Relocation Plan (CSV)</span>
            </button>
          </div>
        </div>

        {/* 30-Second Judge Transparent Formula Explainer */}
        <div className="mt-4 pt-4 border-t border-[#DDE3E8] grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-[#EDF0F2]/70 p-2.5 rounded border border-[#DDE3E8]">
            <span className="text-[10px] font-bold uppercase text-[#3D5A73] block">Factor 1 (35% Weight)</span>
            <span className="text-xs font-bold text-[#16232E]">Capacity Fit & Headroom</span>
            <p className="text-[11px] text-[#5C6B76] mt-0.5">Ratio of remaining shelter capacity to village population needing relocation.</p>
          </div>
          <div className="bg-[#EDF0F2]/70 p-2.5 rounded border border-[#DDE3E8]">
            <span className="text-[10px] font-bold uppercase text-[#3D5A73] block">Factor 2 (25% Weight)</span>
            <span className="text-xs font-bold text-[#16232E]">Road Access Connectivity</span>
            <p className="text-[11px] text-[#5C6B76] mt-0.5">Certified all-weather road access and clearance for emergency evacuation buses (0–10).</p>
          </div>
          <div className="bg-[#EDF0F2]/70 p-2.5 rounded border border-[#DDE3E8]">
            <span className="text-[10px] font-bold uppercase text-[#3D5A73] block">Factor 3 (25% Weight)</span>
            <span className="text-xs font-bold text-[#16232E]">Infrastructure Readiness</span>
            <p className="text-[11px] text-[#5C6B76] mt-0.5">Potable water storage, diesel generators, sanitation, and medical triage berths (0–10).</p>
          </div>
          <div className="bg-[#EDF0F2]/70 p-2.5 rounded border border-[#DDE3E8]">
            <span className="text-[10px] font-bold uppercase text-[#3D5A73] block">Factor 4 (15% Weight)</span>
            <span className="text-xs font-bold text-[#16232E]">Secondary Threat Safety</span>
            <p className="text-[11px] text-[#5C6B76] mt-0.5">Elevation safety and clearance from secondary inundation or landslip risks.</p>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] border border-[#DDE3E8] p-4 rounded shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#5C6B76] mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Priority Evacuees</span>
            <Users className="w-4 h-4 text-[#D97A2E]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#16232E]">
            {summary.total_evacuees_needed?.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-[#5C6B76] mt-1">
            <strong className="text-[#C13F3F]">{summary.immediate_habitations_count || 0}</strong> Immediate +{' '}
            <strong className="text-[#D97A2E]">{summary.short_term_habitations_count || 0}</strong> Short-Term habitations
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#DDE3E8] p-4 rounded shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#5C6B76] mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Evacuees Allocated</span>
            <CheckCircle2 className="w-4 h-4 text-[#3F8F5F]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#3F8F5F]">
            {summary.total_evacuees_allocated?.toLocaleString() || 0}
          </div>
          <div className="text-[11px] text-[#5C6B76] mt-1">
            Assigned to {summary.sites_utilized_count || 0} of {summary.total_sites_available || 0} regional shelters
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#DDE3E8] p-4 rounded shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#5C6B76] mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Capacity Utilization</span>
            <Building2 className="w-4 h-4 text-[#3D5A73]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#16232E]">
            {summary.capacity_utilization_pct || 0}%
          </div>
          <div className="text-[11px] text-[#5C6B76] mt-1">
            {summary.total_capacity_utilized?.toLocaleString()} / {summary.total_shelter_capacity?.toLocaleString()} total plinth space
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#DDE3E8] p-4 rounded shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#5C6B76] mb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Residual Buffer / Gap</span>
            <AlertCircle className="w-4 h-4 text-[#C13F3F]" />
          </div>
          <div className={`text-2xl font-bold font-mono ${summary.residual_shortfall > 0 ? 'text-[#C13F3F]' : 'text-[#3F8F5F]'}`}>
            {summary.residual_shortfall > 0 ? `-${summary.residual_shortfall.toLocaleString()}` : '0 (Safe)'}
          </div>
          <div className="text-[11px] text-[#5C6B76] mt-1">
            {summary.residual_shortfall > 0 ? 'Requires secondary transit tent deployment' : 'All priority evacuees sheltered'}
          </div>
        </div>
      </div>

      {/* 3. Filter and Table Header */}
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#DDE3E8] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#16232E] flex items-center gap-2">
              <span>Settlement-to-Shelter Allocation Roster</span>
              <span className="px-2 py-0.5 rounded text-[11px] bg-[#EDF0F2] text-[#5C6B76] font-mono">
                {filteredAllocations.length} records
              </span>
            </h2>
            <p className="text-xs text-[#5C6B76]">
              Target habitations mapped to best-scoring safe shelters with capacity protection
            </p>
          </div>

          {/* Quick Approve All Action */}
          <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end">
            <span className="text-xs text-[#5C6B76]">
              Signed off: <strong className="text-[#3F8F5F] font-mono">{approvedAllocations.size}</strong> orders
            </span>
            <button
              onClick={() => approveAllFiltered(filteredAllocations.map((a) => a.allocation_id))}
              className="px-2.5 py-1 rounded bg-[#3D5A73] hover:bg-[#2B3F50] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Approve Filtered ({filteredAllocations.length})
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="p-3 bg-[#EDF0F2]/50 border-b border-[#DDE3E8] flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-[#5C6B76]">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold text-[11px]">Filters:</span>
          </div>

          {/* District Filter */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="bg-white border border-[#DDE3E8] rounded px-2.5 py-1 text-xs text-[#16232E] focus:outline-none focus:border-[#3D5A73]"
          >
            <option value="ALL">All Districts</option>
            <option value="Puri">Puri</option>
            <option value="Kendrapara">Kendrapara</option>
            <option value="Ganjam">Ganjam</option>
            <option value="Kandhamal">Kandhamal</option>
          </select>

          {/* Urgency Tier Filter */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="bg-white border border-[#DDE3E8] rounded px-2.5 py-1 text-xs text-[#16232E] focus:outline-none focus:border-[#3D5A73]"
          >
            <option value="ALL">All Urgencies</option>
            <option value="IMMEDIATE">Immediate Only</option>
            <option value="SHORT_TERM">Short-Term Only</option>
          </select>

          {/* Search Bar */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-[#5C6B76] absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search settlement or shelter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-white border border-[#DDE3E8] rounded text-xs text-[#16232E] placeholder-[#5C6B76]/70 focus:outline-none focus:border-[#3D5A73]"
            />
          </div>
        </div>

        {/* Allocations Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-[#DDE3E8]">
            <thead className="bg-[#EDF0F2] text-[#5C6B76] font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Settlement</th>
                <th className="py-3 px-3">District</th>
                <th className="py-3 px-3">Hazard</th>
                <th className="py-3 px-3">Urgency</th>
                <th className="py-3 px-3">Evacuees</th>
                <th className="py-3 px-4">Designated Safe Shelter</th>
                <th className="py-3 px-3 text-center">Score</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Human Sign-off</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3E8] text-[#16232E]">
              {filteredAllocations.map((a) => {
                const isApproved = approvedAllocations.has(a.allocation_id);
                const isExpanded = expandedAllocId === a.allocation_id;
                const isIntra = a.district === a.site_district;

                return (
                  <React.Fragment key={a.allocation_id}>
                    <tr className="hover:bg-[#EDF0F2]/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#16232E]">{a.village}</div>
                        <div className="text-[10px] font-mono text-[#5C6B76]">{a.habitation_id}</div>
                      </td>
                      <td className="py-3 px-3 text-[#5C6B76]">{a.district}</td>
                      <td className="py-3 px-3 text-[#5C6B76] capitalize">{a.hazard_type?.replace(/_/g, ' ')}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${TIER_BADGE[a.urgency_tier] || 'bg-gray-200'}`}>
                          {a.urgency_tier}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold">
                        {a.allocated_headcount.toLocaleString()}
                        {a.is_split && (
                          <span className="block text-[9px] text-[#D97A2E] font-bold uppercase">Split Alloc</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#16232E] flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#3D5A73] shrink-0" />
                          <span>{a.site_name}</span>
                        </div>
                        <div className="text-[10px] text-[#5C6B76] flex items-center gap-1 mt-0.5">
                          <span>{a.site_district}</span>
                          <span>•</span>
                          <span className={isIntra ? 'text-[#3F8F5F] font-semibold' : 'text-[#D97A2E] font-semibold'}>
                            {isIntra ? 'Intra-district' : 'Inter-district fallback'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#EDF0F2] text-[#16232E]">
                          {a.site_score.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setExpandedAllocId(isExpanded ? null : a.allocation_id)}
                          className="flex items-center gap-1 text-[11px] text-[#3D5A73] hover:underline font-semibold cursor-pointer"
                        >
                          <span>Why?</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => toggleApproval(a.allocation_id)}
                          className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ml-auto ${
                            isApproved
                              ? 'bg-[#3F8F5F] hover:bg-[#34774F] text-white'
                              : 'bg-[#3D5A73] hover:bg-[#4E6F8C] text-white'
                          }`}
                        >
                          {isApproved ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Approved</span>
                            </>
                          ) : (
                            <span>Approve Order</span>
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable 30-Second Explainability Drawer */}
                    {isExpanded && (
                      <tr className="bg-[#EDF0F2]/70">
                        <td colSpan={9} className="p-4">
                          <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-3 text-xs shadow-inner">
                            <div className="flex items-center gap-2 text-[#3D5A73] font-bold text-xs mb-1">
                              <Info className="w-4 h-4" />
                              <span>Deterministic Allocation Rationale (Auditable for District Magistrate)</span>
                            </div>
                            <p className="text-[#16232E] leading-relaxed font-sans mt-1">
                              {a.explanation}
                            </p>
                            <div className="mt-2.5 pt-2 border-t border-[#DDE3E8] flex flex-wrap items-center gap-4 text-[11px] text-[#5C6B76]">
                              <span>Shelter Plinth Cap: <strong>{a.site_usable_capacity?.toLocaleString()}</strong></span>
                              <span>Remaining Post-Allocation: <strong>{a.site_remaining_capacity?.toLocaleString()}</strong></span>
                              <span>Risk Score: <strong>{a.composite_risk_score}</strong></span>
                              <span>Risk Zone: <strong>{a.zone}</strong></span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Ranked Safe Shelters Capacity Readiness Table */}
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#DDE3E8] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#16232E]">Ranked Safe Shelters & Capacity Headroom</h2>
            <p className="text-xs text-[#5C6B76]">
              All 12 designated cyclone, flood, and multipurpose centers across pilot districts
            </p>
          </div>
          <div className="text-xs text-[#5C6B76]">
            Total Shelter Capacity: <strong className="text-[#16232E] font-mono">{summary.total_shelter_capacity?.toLocaleString()}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-[#DDE3E8]">
            <thead className="bg-[#EDF0F2] text-[#5C6B76] font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Shelter Name</th>
                <th className="py-3 px-3">District</th>
                <th className="py-3 px-3">Usable Capacity</th>
                <th className="py-3 px-3">Allocated Evacuees</th>
                <th className="py-3 px-4">Capacity Utilization</th>
                <th className="py-3 px-3 text-center">Road Access</th>
                <th className="py-3 px-3 text-center">Infra Readiness</th>
                <th className="py-3 px-3 text-center">Secondary Safety</th>
                <th className="py-3 px-3 text-center">Suitability</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3E8] text-[#16232E]">
              {rankedSites.map((s) => {
                const util = s.utilization_pct || 0;
                const isFull = s.status === 'FULL' || s.remaining_capacity === 0;
                const isUtilized = s.allocated_population > 0;

                return (
                  <tr key={s.site_id} className="hover:bg-[#EDF0F2]/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#16232E]">{s.name}</div>
                      <div className="text-[10px] font-mono text-[#5C6B76]">{s.site_id}</div>
                      {s.notes && <div className="text-[10px] text-[#5C6B76] italic mt-0.5">{s.notes}</div>}
                    </td>
                    <td className="py-3 px-3 text-[#5C6B76] font-medium">{s.district}</td>
                    <td className="py-3 px-3 font-mono font-semibold">{s.usable_capacity.toLocaleString()}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-[#3D5A73]">{s.allocated_population.toLocaleString()}</td>
                    <td className="py-3 px-4 min-w-[140px]">
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                        <span>{util}%</span>
                        <span className="text-[#5C6B76]">{s.remaining_capacity.toLocaleString()} left</span>
                      </div>
                      <div className="w-full bg-[#EDF0F2] rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isFull ? 'bg-[#C13F3F]' : util > 70 ? 'bg-[#D97A2E]' : 'bg-[#3F8F5F]'
                          }`}
                          style={{ width: `${Math.min(100, util)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold">
                      {s.access_score}/10
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold">
                      {s.infrastructure_score}/10
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-[#3F8F5F]">
                      {Math.round((1 - s.secondary_risk_score) * 100)}%
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#EDF0F2] text-[#16232E]">
                        {s.score.toFixed(3)}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          isFull
                            ? 'bg-[#C13F3F]/10 text-[#C13F3F]'
                            : isUtilized
                            ? 'bg-[#3D5A73]/10 text-[#3D5A73]'
                            : 'bg-[#3F8F5F]/10 text-[#3F8F5F]'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Unallocated Evacuation Deficit Warning (if any) */}
      {unallocated.length > 0 && (
        <div className="bg-[#FFFFFF] border-2 border-[#C13F3F] p-4 rounded shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#C13F3F] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-[#C13F3F]">
                Evacuation Capacity Deficit Alert ({unallocated.length} Habitations Exceed Permanent Shelters)
              </h3>
              <p className="text-xs text-[#5C6B76] mt-0.5 leading-relaxed">
                All 12 certified regional safe shelters have reached maximum plinth capacity. The following habitations require immediate dispatch of temporary tent camps, NDRF mobile relief modules, or inter-district transit mobilization:
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {unallocated.map((u, idx) => (
                  <div key={idx} className="bg-red-50 p-2 rounded border border-red-200 text-xs">
                    <div className="font-bold text-[#16232E]">{u.village} ({u.district})</div>
                    <div className="text-[11px] text-[#C13F3F] font-mono mt-0.5">
                      Unallocated: <strong>{u.unallocated_headcount.toLocaleString()}</strong> persons ({u.urgency_tier})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
