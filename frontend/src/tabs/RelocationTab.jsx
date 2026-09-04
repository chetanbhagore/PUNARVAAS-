import React, { useState } from 'react';
import { Compass, AlertCircle, CheckCircle, Clock, Shield } from 'lucide-react';

const TIER_BADGE = {
  IMMEDIATE: 'bg-[#C13F3F] text-white',
  SHORT_TERM: 'bg-[#D97A2E] text-white',
  MEDIUM_TERM: 'bg-[#E0B33C] text-black font-semibold',
  MONITOR: 'bg-[#3F8F5F] text-white'
};

export default function RelocationTab({ habitations }) {
  const [approvedIds, setApprovedIds] = useState(new Set());

  // Habitations sorted by urgency tier: IMMEDIATE, SHORT_TERM, MEDIUM_TERM, MONITOR
  const sortedHabs = [...(habitations || [])].sort((a, b) => {
    const rank = { IMMEDIATE: 4, SHORT_TERM: 3, MEDIUM_TERM: 2, MONITOR: 1 };
    return (rank[b.relocation_urgency_tier] || 0) - (rank[a.relocation_urgency_tier] || 0);
  });

  const toggleApproval = (id) => {
    setApprovedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Mandatory In-Progress UI Note Banner */}
      <div className="bg-[#FFFFFF] border-2 border-[#DDE3E8] p-5 rounded shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded bg-[#EDF0F2] text-[#3D5A73] shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#5C6B76] uppercase tracking-wider">
              Scaffold Phase Specification
            </span>
            <h1 className="text-base font-bold text-[#16232E] mt-0.5">
              Relocation Planning & Urgency Tiers
            </h1>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#EDF0F2] border border-[#DDE3E8] text-xs font-semibold text-[#16232E]">
              <AlertCircle className="w-4 h-4 text-[#3D5A73]" />
              <span>Detailed relocation-site recommendation and sequencing logic — in progress.</span>
            </div>
            <p className="text-xs text-[#5C6B76] mt-2 max-w-3xl leading-relaxed">
              This module displays the computed <code>relocation_urgency_tier</code> derived deterministically from the 4-layer risk classification matrix (Zone × Trigger Trend). In accordance with SDMA operational protocol, no autonomous site-allocation or sequencing is performed; every decision requires explicit human official review.
            </p>
          </div>
        </div>
      </div>

      {/* Relocation Urgency Tiers Table */}
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#DDE3E8] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#16232E]">Settlement Relocation Urgency Catalog</h2>
            <p className="text-xs text-[#5C6B76]">
              Pre-computed operational urgency classification based on Section 9 lookup matrix
            </p>
          </div>
          <div className="text-xs text-[#5C6B76]">
            Approved for review: <strong className="text-[#16232E]">{approvedIds.size}</strong> settlements
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-[#DDE3E8]">
            <thead className="bg-[#EDF0F2] text-[#5C6B76] font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Habitation ID</th>
                <th className="py-3 px-4">Settlement Name</th>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">Hazard Type</th>
                <th className="py-3 px-4">Population</th>
                <th className="py-3 px-4">Risk Zone</th>
                <th className="py-3 px-4">Urgency Tier</th>
                <th className="py-3 px-4 text-right">Human Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3E8] text-[#16232E]">
              {sortedHabs.slice(0, 30).map((h) => {
                const isApproved = approvedIds.has(h.habitation_id);
                return (
                  <tr key={h.habitation_id} className="hover:bg-[#EDF0F2]/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#16232E]">{h.habitation_id}</td>
                    <td className="py-3 px-4 font-medium text-[#16232E]">{h.village}</td>
                    <td className="py-3 px-4 text-[#5C6B76]">{h.district}</td>
                    <td className="py-3 px-4 text-[#5C6B76] capitalize">{h.hazard_type?.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-4 font-mono">{h.population?.total}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-xs">{h.zone}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${TIER_BADGE[h.relocation_urgency_tier] || 'bg-gray-200'}`}>
                        {h.relocation_urgency_tier}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => toggleApproval(h.habitation_id)}
                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                          isApproved
                            ? 'bg-[#3F8F5F] text-white'
                            : 'bg-[#3D5A73] hover:bg-[#4E6F8C] text-white'
                        }`}
                      >
                        {isApproved ? 'Approved for review' : 'Approve recommendation'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
