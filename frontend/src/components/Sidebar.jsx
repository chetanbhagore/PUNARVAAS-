import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  BellRing,
  Building2,
  Scale,
  Compass,
  BarChart3,
  BookOpen,
  ShieldCheck
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'live_map', label: 'Live Map', icon: MapPin },
  { id: 'alerts', label: 'Alerts & Warnings', icon: BellRing, hasBadge: true },
  { id: 'directory', label: 'Habitation Directory', icon: Building2 },
  { id: 'capacity', label: 'Carrying Capacity', icon: Scale },
  { id: 'relocation', label: 'Relocation Planning', icon: Compass },
  { id: 'analytics', label: 'Analytics & Trends', icon: BarChart3 },
  { id: 'methodology', label: 'Methodology & Data Sources', icon: BookOpen },
];

export default function Sidebar({ activeTab, onSelectTab, totalActiveAlerts }) {
  return (
    <aside className="w-64 bg-[#16232E] text-white flex flex-col shrink-0 border-r border-[#3D5A73]/40 min-h-[calc(100vh-45px)]">
      {/* Brand / Authority Header */}
      <div className="p-5 border-b border-[#3D5A73]/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#3D5A73] flex items-center justify-center text-white font-bold">
            <ShieldCheck className="w-5 h-5 text-[#EDF0F2]" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-tight">PUNARVAAS</h1>
            <p className="text-xs text-[#5C6B76] font-normal">Odisha SDMA Decision Support</p>
          </div>
        </div>
        <div className="mt-3 text-[11px] text-[#EDF0F2]/70 bg-[#3D5A73]/30 px-2.5 py-1 rounded border border-[#3D5A73]/40 leading-relaxed">
          Prototype v1.0 · Smart India Hackathon
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-sm font-medium transition-colors text-left cursor-pointer ${
                isActive
                  ? 'bg-[#3D5A73] text-white font-semibold shadow-sm'
                  : 'text-[#EDF0F2]/80 hover:bg-[#3D5A73]/40 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#5C6B76]'}`} />
                <span>{item.label}</span>
              </div>

              {item.hasBadge && totalActiveAlerts > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded bg-[#C13F3F] text-white">
                  {totalActiveAlerts}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Info */}
      <div className="p-4 border-t border-[#3D5A73]/40 text-xs text-[#5C6B76]">
        <p className="font-medium text-[#EDF0F2]/80">Pilot Districts</p>
        <p className="mt-0.5">Puri, Kendrapara, Ganjam, Kandhamal</p>
        <p className="mt-2 text-[10px] text-[#5C6B76]">Human review mandatory on all outputs</p>
      </div>
    </aside>
  );
}
