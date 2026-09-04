import React from 'react';
import { X, AlertTriangle, Shield, CheckCircle2, AlertCircle, MapPin, Users, Compass } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const ZONE_COLORS = {
  RED: '#C13F3F',
  ORANGE: '#D97A2E',
  YELLOW: '#E0B33C',
  GREEN: '#3F8F5F'
};

export default function HabitationDetail({ habitation, onClose, onNavigateToRelocation }) {
  if (!habitation) return null;

  const zoneColor = ZONE_COLORS[habitation.zone] || '#3D5A73';
  const triggerScore = habitation.current_trigger?.trigger_score ?? 0.3;
  const suscScore = habitation.static_hazard_susceptibility?.score ?? 0.5;
  const vulnScore = (habitation.population?.vulnerable_pct ?? 0.2) * 0.6 + (habitation.population?.kutcha_pct ?? 0.4) * 0.4;
  const histScore = habitation.history_score ?? 0.3;

  // 4-layer breakdown data for chart
  const breakdownData = [
    { layer: 'Susceptibility', weight: '35%', score: Math.round(suscScore * 100), val: suscScore },
    { layer: 'Trigger', weight: '30%', score: Math.round(triggerScore * 100), val: triggerScore },
    { layer: 'Vulnerability', weight: '25%', score: Math.round(vulnScore * 100), val: vulnScore },
    { layer: 'History', weight: '10%', score: Math.round(histScore * 100), val: histScore },
  ];

  const mlAgreement = habitation.ml_agreement || 'Consistent';
  const isReviewNeeded = mlAgreement === 'Review Needed';

  return (
    <div className="fixed inset-y-0 right-0 w-96 max-w-full bg-[#FFFFFF] shadow-2xl border-l border-[#DDE3E8] z-50 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-[#DDE3E8] flex items-start justify-between bg-[#EDF0F2]/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#5C6B76]">{habitation.habitation_id}</span>
            {habitation.is_illustrative && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#3D5A73]/20 text-[#3D5A73]">
                Illustrative Demo
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-[#16232E] mt-0.5 leading-snug">{habitation.village}</h2>
          <p className="text-xs text-[#5C6B76] flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>District: {habitation.district} · Hazard: {habitation.hazard_type?.replace(/_/g, ' ')}</span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[#DDE3E8] text-[#5C6B76] hover:text-[#16232E] transition-colors"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4 flex-1 text-sm">
        {/* Risk & Zone Card */}
        <div className="p-3.5 rounded border border-[#DDE3E8] bg-[#FFFFFF] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#5C6B76] font-medium">Composite Risk Score</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold text-[#16232E]">
                  {habitation.composite_risk_score?.toFixed(2)}
                </span>
                <span className="text-xs text-[#5C6B76]">/ 1.00</span>
              </div>
            </div>

            <div className="text-right">
              <span
                className="inline-block px-2.5 py-1 rounded text-xs font-bold text-white tracking-wide"
                style={{ backgroundColor: zoneColor }}
              >
                {habitation.zone} ZONE
              </span>
              <p className="text-[11px] text-[#5C6B76] mt-1 font-medium">
                Trend: <strong>{habitation.current_trigger?.trend || 'STABLE'}</strong>
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#DDE3E8] flex items-center justify-between text-xs">
            <span className="text-[#5C6B76]">Recommended Action:</span>
            <span className="font-semibold text-[#16232E] bg-[#EDF0F2] px-2 py-0.5 rounded">
              {habitation.relocation_urgency_tier}
            </span>
          </div>
        </div>

        {/* 4-Layer Breakdown Bar Chart */}
        <div className="p-3.5 rounded border border-[#DDE3E8] bg-[#FFFFFF] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-[#16232E]">4-Layer Risk Score Breakdown</h3>
            <span className="text-[10px] text-[#5C6B76]">Weighted Formula</span>
          </div>
          
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdownData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#5C6B76' }} unit="%" />
                <YAxis dataKey="layer" type="category" tick={{ fontSize: 10, fill: '#16232E' }} width={80} />
                <Tooltip
                  formatter={(val, name, item) => [`${val}% (wt: ${item.payload.weight})`, 'Layer Score']}
                  contentStyle={{ backgroundColor: '#16232E', color: '#fff', borderRadius: '4px', fontSize: '11px' }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {breakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#3D5A73" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1 text-[11px] text-[#5C6B76] mt-1 pt-2 border-t border-[#DDE3E8]">
            <div>Susceptibility (35%): <strong className="text-[#16232E]">{Math.round(suscScore*100)}%</strong></div>
            <div>Trigger (30%): <strong className="text-[#16232E]">{Math.round(triggerScore*100)}%</strong></div>
            <div>Vulnerability (25%): <strong className="text-[#16232E]">{Math.round(vulnScore*100)}%</strong></div>
            <div>History (10%): <strong className="text-[#16232E]">{Math.round(histScore*100)}%</strong></div>
          </div>
        </div>

        {/* Machine Learning Model Validation Card */}
        <div className="p-3.5 rounded border border-[#DDE3E8] bg-[#FFFFFF] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#16232E]">ML Supporting Signal (Logistic Regression)</h3>
            <div className="flex items-center gap-1">
              {isReviewNeeded ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-[#E0B33C]/20 text-[#16232E] border border-[#E0B33C]">
                  <AlertTriangle className="w-3 h-3 text-[#D97A2E]" />
                  Review Needed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-[#3F8F5F]/20 text-[#16232E] border border-[#3F8F5F]">
                  <CheckCircle2 className="w-3 h-3 text-[#3F8F5F]" />
                  Consistent
                </span>
              )}
            </div>
          </div>

          <div className="flex items-baseline justify-between text-xs pt-1">
            <span className="text-[#5C6B76]">ML Risk Probability:</span>
            <span className="font-bold text-[#16232E]">
              {habitation.ml_risk_probability?.toFixed(2)} ({Math.round((habitation.ml_risk_probability || 0) * 100)}%)
            </span>
          </div>

          {habitation.top_features && habitation.top_features.length > 0 && (
            <div className="pt-2 border-t border-[#DDE3E8]">
              <p className="text-[11px] font-semibold text-[#5C6B76] mb-1">Top Driving Factors:</p>
              <ul className="space-y-1">
                {habitation.top_features.map((f, i) => (
                  <li key={i} className="text-xs flex items-center justify-between text-[#16232E]">
                    <span className="text-[#5C6B76]">{f.label}</span>
                    <span className="font-mono text-[11px]">+{f.impact_score}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Deterministic Explanation (Mandatory Section 14) */}
        <div className="p-3 rounded border border-[#DDE3E8] bg-[#EDF0F2]/40">
          <p className="text-[11px] font-semibold text-[#5C6B76] uppercase tracking-wider mb-1">Official Explanation String</p>
          <p className="text-xs text-[#16232E] leading-relaxed font-mono bg-white p-2.5 rounded border border-[#DDE3E8]">
            {habitation.explanation || habitation.trigger_description}
          </p>
        </div>

        {/* Demographics & Shelter Info */}
        <div className="p-3 rounded border border-[#DDE3E8] bg-[#FFFFFF] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#5C6B76]">Total Population:</span>
            <strong className="text-[#16232E]">{habitation.population?.total} persons</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#5C6B76]">Vulnerable Demographics:</span>
            <strong className="text-[#16232E]">{Math.round((habitation.population?.vulnerable_pct || 0)*100)}%</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#5C6B76]">Kutcha Housing Ratio:</span>
            <strong className="text-[#16232E]">{Math.round((habitation.population?.kutcha_pct || 0)*100)}%</strong>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-[#DDE3E8]">
            <span className="text-[#5C6B76]">Nearest Safe Shelter:</span>
            <strong className="text-[#16232E]">{habitation.nearest_safe_shelter_km} km</strong>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={() => {
              if (onNavigateToRelocation) onNavigateToRelocation();
              if (onClose) onClose();
            }}
            className="w-full py-2.5 px-3 rounded text-xs font-semibold bg-[#3D5A73] hover:bg-[#4E6F8C] active:bg-[#2D4559] text-white transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Compass className="w-4 h-4" />
            <span>Recommend relocation review</span>
          </button>
        </div>
      </div>
    </div>
  );
}
