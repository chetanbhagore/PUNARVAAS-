import React from 'react';
import {
  X,
  Waves,
  ShieldCheck,
  Building2,
  Navigation,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Users,
  Compass,
  Radio,
  ExternalLink,
  Play
} from 'lucide-react';

export default function AssamCrisisSolutionModal({
  isOpen,
  onClose,
  onTriggerAssamDemo,
  isAssamLoading,
  onNavigateTab
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="assam-solution-modal-title"
        className="bg-white rounded-xl shadow-2xl border border-[#DDE3E8] max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#16232E] text-white p-5 flex items-center justify-between border-b border-[#3D5A73]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#2563EB] text-white">
              <Waves className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#2563EB] text-white px-2 py-0.5 rounded">
                  Disaster Case Study & Solution Architecture
                </span>
                <span className="text-xs text-[#EDF0F2]/70 font-mono">
                  Brahmaputra & Barak Basins
                </span>
              </div>
              <h1 id="assam-solution-modal-title" className="text-lg font-bold text-white mt-0.5">
                How PUNARVAAS Solves the Assam Flood & River Erosion Crisis
              </h1>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-md hover:bg-[#3D5A73]/50 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-[#16232E]">
          {/* Executive Overview Banner */}
          <div className="bg-[#2563EB]/5 border border-[#2563EB]/30 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase text-[#1D4ED8] tracking-wider">
                The Core Problem in Assam
              </span>
              <p className="text-xs text-[#16232E] leading-relaxed">
                Assam floods displace <strong>30+ lakh people annually</strong> across Majuli, Dhemaji, Cachar (Silchar), and Barpeta. 
                Victims are routinely marooned within 4 hours, forcing families to squat under plastic tarpaulins on highway dividers with 
                zero clean water, leading to diarrheal disease, snakebites, and chaotic relief distribution.
              </p>
            </div>
            <button
              onClick={() => {
                if (onTriggerAssamDemo) onTriggerAssamDemo();
                if (onClose) onClose();
              }}
              disabled={isAssamLoading}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold cursor-pointer transition-colors shadow-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isAssamLoading ? 'Running Demo...' : 'Run Live Assam Simulation'}</span>
            </button>
          </div>

          {/* 5 Architectural Breakthroughs Grid */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase text-[#5C6B76] tracking-wider">
              5 Ways PUNARVAAS Solves Every Assam Disaster Bottleneck
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Pillar 1 */}
              <div className="p-4 rounded-lg border border-[#DDE3E8] bg-[#F8FAFB] space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#16232E]">
                  <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs shrink-0">1</span>
                  <span>36-Hour CWC River Telemetry Pre-Alert</span>
                </div>
                <p className="text-[#5C6B76] leading-relaxed pl-8">
                  PUNARVAAS monitors real-time gauge acceleration at <strong>Nimati Ghat (Majuli)</strong> and <strong>Annapurna Ghat (Silchar)</strong>. 
                  When levels trend toward CWC Danger Level, our near-term trigger alerts SDMA officers 24 to 36 hours before peak inundation hits habitations.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="p-4 rounded-lg border border-[#DDE3E8] bg-[#F8FAFB] space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#16232E]">
                  <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs shrink-0">2</span>
                  <span>Certified BLUE ZONE Relocation Havens</span>
                </div>
                <p className="text-[#5C6B76] leading-relaxed pl-8">
                  <strong>Zero highway embankment squatting.</strong> The capacity engine algorithmically matches every Red-zone char village directly 
                  to engineered high-plinth flood centers raised <strong>5.2 meters above the Brahmaputra HFL</strong> with verified solar power and deep borewells.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="p-4 rounded-lg border border-[#DDE3E8] bg-[#F8FAFB] space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#16232E]">
                  <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs shrink-0">3</span>
                  <span>Kutcha & Island Demographics Prioritization</span>
                </div>
                <p className="text-[#5C6B76] leading-relaxed pl-8">
                  Over 82% of Assam rural dwellings are bamboo/ikra thatch (kutcha). PUNARVAAS factors in a 25% socio-physical vulnerability index 
                  so infants, pregnant women, and fragile riverine char habitations receive priority evacuation orders first.
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="p-4 rounded-lg border border-[#DDE3E8] bg-[#F8FAFB] space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#16232E]">
                  <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs shrink-0">4</span>
                  <span>Amphibious Evacuation & Rescue Boat Dispatch</span>
                </div>
                <p className="text-[#5C6B76] leading-relaxed pl-8">
                  When roads submerge, the Evacuation Board's blocker taxonomy immediately flags <code>ROAD_INUNDATED</code> or <code>RIVER_CREEK_SUBMERGED</code>, 
                  automatically scheduling <strong>SDRF Inflatable Motor Boats (BIMB)</strong> and 4x4 tractors with full audit accountability.
                </p>
              </div>

              {/* Pillar 5 (Span 2) */}
              <div className="p-4 rounded-lg border border-[#DDE3E8] bg-[#F8FAFB] space-y-1.5 md:col-span-2">
                <div className="flex items-center gap-2 font-bold text-[#16232E]">
                  <span className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs shrink-0">5</span>
                  <span>Sphere Humanitarian Relief Supplies Requisition</span>
                </div>
                <p className="text-[#5C6B76] leading-relaxed pl-8">
                  Eliminates relief supply guesswork. For every allocated evacuee, PUNARVAAS computes exact daily quotas: <strong>3.0 Litres/day of clean potable water</strong> (preventing cholera), 
                  cooked hot meals, bio-toilets, halazone tablets, and dedicated cattle shelter pens for agrarian livestock protection.
                </p>
              </div>
            </div>
          </div>

          {/* Comparative Table: Status Quo vs PUNARVAAS */}
          <div className="border border-[#DDE3E8] rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#16232E] text-white">
                  <th className="p-3 font-bold w-1/3">Assam Challenge Dimension</th>
                  <th className="p-3 font-bold w-1/3 bg-red-950/60 text-red-200">Ad-Hoc Status Quo</th>
                  <th className="p-3 font-bold w-1/3 bg-blue-950/60 text-blue-200">PUNARVAAS Operational Protocol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE3E8]">
                <tr>
                  <td className="p-3 font-semibold text-[#16232E]">Early Warning</td>
                  <td className="p-3 text-red-700 bg-red-50/50">Reactionary after creeks submerge (0–4 hours)</td>
                  <td className="p-3 text-blue-700 bg-blue-50/50 font-medium">Deterministic CWC telemetry trigger (24–36 hrs ahead)</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[#16232E]">Evacuee Shelter</td>
                  <td className="p-3 text-red-700 bg-red-50/50">Squatting under tarpaulins on highway dividers</td>
                  <td className="p-3 text-blue-700 bg-blue-50/50 font-medium">Certified BLUE ZONE elevated high-plinth havens</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[#16232E]">Water & Sanitation</td>
                  <td className="p-3 text-red-700 bg-red-50/50">Contaminated flood water; high waterborne cholera</td>
                  <td className="p-3 text-blue-700 bg-blue-50/50 font-medium">Sphere standard 3L/day clean RO water + Bio-toilets</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[#16232E]">Char Transit</td>
                  <td className="p-3 text-red-700 bg-red-50/50">Unorganized country boats; capsizing risk</td>
                  <td className="p-3 text-blue-700 bg-blue-50/50 font-medium">SDRF Inflatable Motor Boats (BIMB) logged in audit trail</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#F8FAFB] p-4 border-t border-[#DDE3E8] flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-[#5C6B76]">
            Pilot Coverage: Majuli (Kamalabari/Salmora), Dhemaji, Cachar (Silchar Bethukandi), Barpeta
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onNavigateTab) onNavigateTab('live_map');
                if (onClose) onClose();
              }}
              className="px-3 py-1.5 rounded bg-[#EDF0F2] hover:bg-[#DDE3E8] text-[#16232E] font-semibold cursor-pointer transition-colors"
            >
              View on Live Map
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-[#16232E] hover:bg-[#3D5A73] text-white font-bold cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
