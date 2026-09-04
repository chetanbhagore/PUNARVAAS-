import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function JudgeDemoBanner({ scenarioName, onResetBaseline, isResetting }) {
  if (!scenarioName || scenarioName === 'baseline') return null;

  return (
    <div className="bg-[#16232E] border-b border-[#3D5A73] px-6 py-2.5 flex items-center justify-between text-white text-xs animate-fadeIn">
      <div className="flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-[#E0B33C] animate-ping" />
        <span className="font-semibold text-[#E0B33C]">Simulation Active:</span>
        <span className="text-[#EDF0F2] font-medium">{scenarioName}</span>
        <span className="text-[#5C6B76]">·</span>
        <span className="text-[#EDF0F2]/70 text-[11px]">
          Pre-cached evaluation state (Zero external API calls)
        </span>
      </div>

      <button
        onClick={onResetBaseline}
        disabled={isResetting}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#3D5A73] hover:bg-[#4E6F8C] text-white text-xs font-medium cursor-pointer transition-colors border border-[#5C6B76]/40"
      >
        <RotateCcw className="w-3 h-3" />
        {isResetting ? 'Resetting...' : 'Reset to Baseline'}
      </button>
    </div>
  );
}
