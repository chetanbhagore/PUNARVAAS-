import React from 'react';
import { Play, Database, ShieldAlert } from 'lucide-react';

export default function StatusBar({ 
  stats, 
  onTriggerJudgeDemo, 
  isJudgeDemoLoading,
  onTriggerAssamDemo,
  isAssamDemoLoading,
  onOpenAssamModal,
  onOpenVideoGuide
}) {
  const redCount = stats?.active_alerts_red ?? 0;
  const orangeCount = stats?.active_alerts_orange ?? 0;
  const yellowCount = stats?.active_alerts_yellow ?? 0;
  const districtsCount = stats?.districts_monitored ?? 8;
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
          Districts: <strong className="text-white font-semibold">{districtsCount} (Odisha + Assam)</strong>
        </span>

        <span className="text-[#EDF0F2]/40">·</span>

        {/* Permanent Non-removable Synthetic Data Mode Indicator */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#3D5A73]/60 border border-[#3D5A73] text-xs font-medium text-[#EDF0F2]">
          <Database className="w-3.5 h-3.5 text-[#EDF0F2]/70" />
          <span>Synthetic Data Mode</span>
        </div>
      </div>

      {/* Right: Quick Demo & Video Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenVideoGuide}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-all cursor-pointer shadow-xs border border-blue-400"
          title="Step-by-step interactive walkthrough assistant for recording prototype video"
        >
          <span>🎥 Video Demo Flow</span>
        </button>

        <button
          onClick={onTriggerAssamDemo}
          disabled={isAssamDemoLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#C13F3F] hover:bg-[#9B2727] text-white transition-colors cursor-pointer border border-red-400 disabled:opacity-50"
          title="Simulates Brahmaputra Wave-2 surge in Majuli, Dhemaji, Cachar and Barpeta"
        >
          <span>🌊 {isAssamDemoLoading ? 'Surging...' : 'Assam Demo'}</span>
        </button>

        <button
          onClick={onTriggerJudgeDemo}
          disabled={isJudgeDemoLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#3D5A73] hover:bg-[#4E6F8C] active:bg-[#2D4559] text-white transition-colors cursor-pointer border border-[#5C6B76]/50 disabled:opacity-50"
          title="Simulates rapid Orange to Red river flood surge for live judging evaluation"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {isJudgeDemoLoading ? 'Running...' : 'Judge Demo'}
        </button>
      </div>
    </header>
  );
}
