import React from 'react';
import { Play, Database, ShieldAlert } from 'lucide-react';

export default function StatusBar({ stats, onTriggerJudgeDemo, isJudgeDemoLoading }) {
  const redCount = stats?.active_alerts_red ?? 0;
  const orangeCount = stats?.active_alerts_orange ?? 0;
  const yellowCount = stats?.active_alerts_yellow ?? 0;
  const districtsCount = stats?.districts_monitored ?? 4;
  const lastRefresh = stats?.last_refresh ?? "Just now";

  return (
    <header className="sticky top-0 z-30 bg-[#16232E] text-white border-b border-[#3D5A73] px-6 py-2.5 flex items-center justify-between shadow-sm">
      {/* Left: Standard SDMA Status Bar Specification */}
      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm">
        <span className="text-[#EDF0F2]/80 font-normal">Active Alerts:</span>
        <div className="inline-flex items-center gap-1.5 font-medium">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#C13F3F] text-white">
            {redCount} RED
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#D97A2E] text-white">
            {orangeCount} ORANGE
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#E0B33C] text-black">
            {yellowCount} YELLOW
          </span>
        </div>

        <span className="text-[#EDF0F2]/40">·</span>

        <span className="text-[#EDF0F2]/80">
          Districts Monitored: <strong className="text-white font-semibold">{districtsCount}</strong>
        </span>

        <span className="text-[#EDF0F2]/40">·</span>

        <span className="text-[#EDF0F2]/80">
          Last Data Refresh: <span className="text-[#EDF0F2] font-mono text-xs">{lastRefresh}</span>
        </span>

        <span className="text-[#EDF0F2]/40">·</span>

        {/* Permanent Non-removable Synthetic Data Mode Indicator */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#3D5A73]/60 border border-[#3D5A73] text-xs font-medium text-[#EDF0F2]">
          <Database className="w-3.5 h-3.5 text-[#EDF0F2]/70" />
          <span>Synthetic Data Mode</span>
        </div>
      </div>

      {/* Right: Judge Demo Mode Action */}
      <div className="flex items-center gap-3">
        <button
          onClick={onTriggerJudgeDemo}
          disabled={isJudgeDemoLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#3D5A73] hover:bg-[#4E6F8C] active:bg-[#2D4559] text-white transition-colors cursor-pointer border border-[#5C6B76]/50"
          title="Simulates rapid Orange to Red river flood surge for live judging evaluation"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {isJudgeDemoLoading ? 'Running Demo...' : 'Judge Demo Mode'}
        </button>
      </div>
    </header>
  );
}
