import React, { useState } from 'react';
import {
  Video,
  ChevronRight,
  ChevronLeft,
  Play,
  RotateCcw,
  X,
  Compass,
  MapPin,
  Radio,
  FileCheck,
  ShieldAlert,
  Sparkles,
  Waves,
  Eye,
  CheckCircle2,
  Minimize2,
  Maximize2
} from 'lucide-react';

export default function VideoDemoGuide({
  onNavigateTab,
  onTriggerAssamDemo,
  onSelectHabitation,
  onSelectAlert,
  onResetBaseline,
  isAssamLoading,
  onClose,
  habitations = [],
  alerts = []
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const steps = [
    {
      stepNumber: 1,
      title: 'Assam Flood & River Surge Trigger',
      duration: '~20s',
      tabTarget: 'alerts',
      icon: Waves,
      tag: 'CWC Telemetry Breach',
      narration:
        "\"Here we show how PUNARVAAS solves the recurring Assam flood crisis. In this live scenario, the CWC river gauge at Nimati Ghat (Majuli) crosses the Danger Level to 86.85m. Our engine detects this 36 hours ahead, sounding acute RED alerts for vulnerable char habitations before access cuts off.\"",
      actionLabel: '⚡ Trigger Assam Flood Crisis Alert',
      execute: async () => {
        if (onTriggerAssamDemo) {
          await onTriggerAssamDemo();
        }
        if (onNavigateTab) {
          onNavigateTab('alerts');
        }
      }
    },
    {
      stepNumber: 2,
      title: 'Live Map & Certified Blue Zone Relocation Havens',
      duration: '~25s',
      tabTarget: 'live_map',
      icon: MapPin,
      tag: 'Zero Highway Squatting',
      narration:
        "\"Notice the map: in red are submerged river settlements. But crucially, look at the BLUE ZONE havens! Instead of ad-hoc camps on muddy highway embankments, PUNARVAAS maps evacuees to certified high-plinth safe centers raised 5.2m above Brahmaputra HFL with solar RO water, ICU clinic bays, and boat docking ramps.\"",
      actionLabel: '🗺️ Jump to Map & Inspect Blue Zone Havens',
      execute: () => {
        if (onNavigateTab) {
          onNavigateTab('live_map');
        }
      }
    },
    {
      stepNumber: 3,
      title: 'Dual-Layer Explainable AI (XAI) for Assam Char Villages',
      duration: '~25s',
      tabTarget: 'directory',
      icon: Sparkles,
      tag: 'Kutcha Housing Fragility',
      narration:
        "\"Civil defense officers require full transparency. For Salmora Pottery Hamlet, PUNARVAAS outputs an auditable 4-layer breakdown: 35% static bank-cutting susceptibility, 30% CWC river surge, 25% socio-physical vulnerability (82% kutcha bamboo dwellings), and 10% flood history. Machine learning independently confirms 98% risk agreement.\"",
      actionLabel: '🔍 Inspect High-Risk Assam Habitation (Salmora)',
      execute: () => {
        const salmora = habitations.find(h => h.village && h.village.includes('Salmora')) || habitations[0];
        if (onSelectHabitation && salmora) {
          onSelectHabitation(salmora);
        }
        if (onNavigateTab) {
          onNavigateTab('live_map');
        }
      }
    },
    {
      stepNumber: 4,
      title: 'Automated Blue Zone Relocation Order & Supply Calculation',
      duration: '~25s',
      tabTarget: 'relocation',
      icon: Compass,
      tag: 'Sphere Relief Calculator',
      narration:
        "\"The relocation engine matches every village to certified Blue Zone safe havens without overcrowding. It computes exact humanitarian supplies based on Sphere standards: 3L water/person/day, food packets, bio-toilets, and infant care kits, providing District Magistrates with a 1-click official Relocation Order.\"",
      actionLabel: '📋 View Blue Zone Relocation Order & Roster',
      execute: () => {
        if (onNavigateTab) {
          onNavigateTab('relocation');
        }
      }
    },
    {
      stepNumber: 5,
      title: 'Evacuation Execution Board & Rescue Boat Escalation',
      duration: '~25s',
      tabTarget: 'evacuation_execution',
      icon: Radio,
      tag: 'SDRF Boat Dispatch',
      narration:
        "\"Finally, our Evacuation Board turns decision into verified field execution. When floodwaters cut off roads, field officers report a blocker, instantly triggering SDRF Inflatable Motor Boats (BIMB) and 4x4 tractors. Every transition to Checked-In at the Blue Zone is logged in an immutable, legally auditable ledger.\"",
      actionLabel: '🚤 Open Evacuation Execution Board & Rescue Log',
      execute: () => {
        if (onNavigateTab) {
          onNavigateTab('evacuation_execution');
        }
      }
    }
  ];

  const current = steps[currentStep];
  const StepIcon = current.icon;

  if (isMinimized) {
    return (
      <aside 
        aria-label="Video Demo Guide Minimized" 
        className="fixed bottom-4 left-6 z-50 bg-[#16232E] text-white border-2 border-[#2563EB] shadow-2xl rounded-full px-4 py-2 flex items-center gap-3 animate-bounce"
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-xs font-bold tracking-wide">VIDEO DEMO FLOW</span>
          <span className="text-[11px] bg-[#2563EB] px-2 py-0.5 rounded-full font-mono">
            Step {currentStep + 1}/5
          </span>
        </div>
        <button
          onClick={() => setIsMinimized(false)}
          className="text-white/80 hover:text-white cursor-pointer ml-1"
          title="Expand Video Guide"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside 
      aria-label="Video Demo Guide"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-3xl bg-[#16232E]/98 backdrop-blur-md text-white border-2 border-[#2563EB] shadow-2xl rounded-xl p-4 transition-all duration-300"
    >
      {/* Top Bar of the Guide */}
      <div className="flex items-center justify-between border-b border-[#3D5A73] pb-2.5 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-600/90 text-white text-[10px] font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>PROTOTYPE VIDEO EASYFLOW</span>
          </div>
          <span className="text-xs text-[#EDF0F2]/70 font-mono">
            Chapter {current.stepNumber} of {steps.length} ({current.duration})
          </span>
        </div>

        <div className="flex items-center gap-1 text-[#EDF0F2]/70">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:text-white hover:bg-[#3D5A73]/40 rounded cursor-pointer transition-colors"
            title="Minimize Guide"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:text-white hover:bg-red-600/40 rounded cursor-pointer transition-colors"
              title="Close Guide"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="space-y-3">
        {/* Title & Tag */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-[#2563EB] text-white">
              <StepIcon className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              {current.title}
            </h2>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40">
            {current.tag}
          </span>
        </div>

        {/* Script Teleprompter Box */}
        <div className="bg-[#0B1219] p-3 rounded-lg border border-[#3D5A73]/80 space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-[#E0B33C]">
            <span>🗣️ What to say in your video / pitch:</span>
            <span className="text-[#5C6B76]">Read or improvise</span>
          </div>
          <p className="text-xs text-[#EDF0F2] italic leading-relaxed">
            {current.narration}
          </p>
        </div>

        {/* Action & Nav Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {/* Action Button */}
          <button
            onClick={current.execute}
            disabled={isAssamLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-xs font-bold cursor-pointer transition-all shadow-md border border-[#60A5FA]/40 hover:scale-[1.02]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isAssamLoading ? 'Running Simulation...' : current.actionLabel}</span>
          </button>

          {/* Stepper buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className={`p-1.5 rounded border border-[#3D5A73] text-xs font-semibold flex items-center gap-1 ${
                currentStep === 0
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-[#3D5A73] text-white cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {/* Step Bubbles */}
            <div className="flex items-center gap-1">
              {steps.map((s, idx) => (
                <button
                  key={s.stepNumber}
                  onClick={() => setCurrentStep(idx)}
                  className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center cursor-pointer transition-all ${
                    idx === currentStep
                      ? 'bg-[#2563EB] text-white ring-2 ring-[#60A5FA]'
                      : idx < currentStep
                      ? 'bg-[#3F8F5F] text-white'
                      : 'bg-[#3D5A73]/60 text-white/60 hover:bg-[#3D5A73]'
                  }`}
                  title={s.title}
                >
                  {s.stepNumber}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
              disabled={currentStep === steps.length - 1}
              className={`p-1.5 rounded border border-[#3D5A73] text-xs font-semibold flex items-center gap-1 ${
                currentStep === steps.length - 1
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-[#3D5A73] text-white cursor-pointer'
              }`}
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {onResetBaseline && (
              <button
                onClick={onResetBaseline}
                className="ml-2 px-2 py-1.5 rounded bg-[#3D5A73]/40 hover:bg-[#3D5A73] text-white/80 hover:text-white text-[10px] font-semibold border border-[#3D5A73] cursor-pointer flex items-center gap-1"
                title="Reset to Baseline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
