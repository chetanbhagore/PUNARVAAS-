import React, { useState } from 'react';
import { Play, Database, ChevronDown } from 'lucide-react';

export default function StatusBar({ 
  stats, 
  onTriggerJudgeDemo, 
  isJudgeDemoLoading,
  onSimulateScenario
}) {
  const [showDemoDropdown, setShowDemoDropdown] = useState(false);
  const redCount = stats?.active_alerts_red ?? 0;
  const orangeCount = stats?.active_alerts_orange ?? 0;
  const yellowCount = stats?.active_alerts_yellow ?? 0;
  const districtsCount = stats?.districts_monitored ?? 8;

  return (
    <header className="sticky top-0 z-30 bg-[#16232E] text-white border-b border-[#3D5A73] px-6 py-2.5 flex items-center justify-between shadow-sm">
      {/* Left: Standard SDMA Status Bar */}
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

      {/* Right: Clean Judge Demo Mode (Single button matching previous version) */}
      <div className="relative flex items-center gap-2">
        <div className="inline-flex rounded shadow-xs">
          <button
            onClick={onTriggerJudgeDemo}
            disabled={isJudgeDemoLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-l text-xs font-semibold bg-[#3D5A73] hover:bg-[#4E6F8C] active:bg-[#2D4559] text-white transition-colors cursor-pointer border border-[#5C6B76]/50 disabled:opacity-50"
            title="Simulates rapid river gauge escalation for live judging evaluation"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isJudgeDemoLoading ? 'Running Demo...' : 'Judge Demo Mode'}</span>
          </button>
          {onSimulateScenario && (
            <button
              onClick={() => setShowDemoDropdown(prev => !prev)}
              disabled={isJudgeDemoLoading}
              className="px-2 py-1.5 rounded-r bg-[#2D4559] hover:bg-[#3D5A73] text-white text-xs font-bold border-t border-r border-b border-[#5C6B76]/50 cursor-pointer disabled:opacity-50"
              title="Select specific evaluation scenario"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          )}
        </div>

        {showDemoDropdown && onSimulateScenario && (
          <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#16232E] border border-[#3D5A73] rounded-md shadow-xl z-50 text-xs py-1 animate-in fade-in">
            <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-[#80D8FF] tracking-wider border-b border-[#3D5A73]/50">
              Select Evaluation Scenario
            </div>
            <button
              onClick={() => {
                setShowDemoDropdown(false);
                onTriggerJudgeDemo();
              }}
              className="w-full text-left px-3 py-2 text-white hover:bg-[#253847] flex items-center gap-2 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#C13F3F]"></span>
              <div>
                <p className="font-semibold text-white">Odisha River Surge (Baitarani)</p>
                <p className="text-[10px] text-[#EDF0F2]/60">Rapid Orange &rarr; Red river flood surge</p>
              </div>
            </button>
            <button
              onClick={() => {
                setShowDemoDropdown(false);
                onSimulateScenario('assam_brahmaputra_surge');
              }}
              className="w-full text-left px-3 py-2 text-white hover:bg-[#253847] flex items-center gap-2 border-t border-[#3D5A73]/40 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
              <div>
                <p className="font-semibold text-white">Assam Brahmaputra & Barak Flood</p>
                <p className="text-[10px] text-[#EDF0F2]/60">Majuli, Dhemaji, Cachar & Barpeta</p>
              </div>
            </button>
            <button
              onClick={() => {
                setShowDemoDropdown(false);
                onSimulateScenario('cyclone_landfall_acute');
              }}
              className="w-full text-left px-3 py-2 text-white hover:bg-[#253847] flex items-center gap-2 border-t border-[#3D5A73]/40 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#D97A2E]"></span>
              <div>
                <p className="font-semibold text-white">Puri Coastal Cyclone Surge</p>
                <p className="text-[10px] text-[#EDF0F2]/60">Category-4 IMD storm landfall</p>
              </div>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
