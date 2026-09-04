import React, { useState, useEffect } from 'react';
import { BarChart3, CheckCircle2, AlertTriangle, HelpCircle, Layers } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { fetchAnalytics, fetchMlInfo } from '../api';

const ZONE_COLORS = {
  RED: '#C13F3F',
  ORANGE: '#D97A2E',
  YELLOW: '#E0B33C',
  GREEN: '#3F8F5F'
};

const HAZARD_PALETTE = ['#3D5A73', '#5C6B76', '#16232E', '#8A9CA8'];

export default function AnalyticsTab() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [mlData, setMlData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchAnalytics(), fetchMlInfo()])
      .then(([analytics, ml]) => {
        setAnalyticsData(analytics);
        setMlData(ml);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-[#5C6B76]">
        Aggregating risk telemetry and model statistics...
      </div>
    );
  }

  const zoneDist = analyticsData?.zone_distribution || [];
  const hazardBreakdown = analyticsData?.hazard_breakdown || [];
  const activeAlertsSeverity = analyticsData?.active_alerts_by_severity || [];
  const mlAgreement = mlData?.agreement_summary || {};
  const featureImportance = mlData?.feature_importance || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-4 shadow-sm">
        <h1 className="text-lg font-bold text-[#16232E]">Analytics, Trends & Model Explainability</h1>
        <p className="text-xs text-[#5C6B76] mt-0.5">
          Statistical distribution of risk zones, active warnings, and dual-layer decision model agreement metrics.
        </p>
      </div>

      {/* Model Agreement & Explainability Panel (Mandatory Section 6.7 Feature) */}
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#16232E]">Model Agreement & Feature Influence (Explainability)</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#3D5A73]/15 text-[#3D5A73]">
                Logistic Regression Signal
              </span>
            </div>
            <p className="text-xs text-[#5C6B76] mt-0.5">
              Comparison between deterministic 4-layer rule score and statistical classifier (Divergence &gt; 0.15 flags Review Needed)
            </p>
          </div>
        </div>

        {/* Agreement Stat Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 bg-[#EDF0F2]/50 rounded border border-[#DDE3E8]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5C6B76]">Model Agreement Rate</span>
              <CheckCircle2 className="w-4 h-4 text-[#3F8F5F]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#16232E]">
                {mlAgreement.consistent_pct}%
              </span>
              <span className="text-xs text-[#5C6B76]">Consistent ({mlAgreement.consistent_count} habitations)</span>
            </div>
          </div>

          <div className="p-3.5 bg-[#EDF0F2]/50 rounded border border-[#DDE3E8]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5C6B76]">Discrepancies Flagged</span>
              <AlertTriangle className="w-4 h-4 text-[#D97A2E]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#16232E]">
                {mlAgreement.review_needed_pct}%
              </span>
              <span className="text-xs text-[#5C6B76]">Review Needed ({mlAgreement.review_needed_count} habitations)</span>
            </div>
          </div>

          <div className="p-3.5 bg-[#EDF0F2]/50 rounded border border-[#DDE3E8]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5C6B76]">Model Architecture</span>
              <HelpCircle className="w-4 h-4 text-[#3D5A73]" />
            </div>
            <div className="mt-2">
              <p className="text-xs font-bold text-[#16232E]">Balanced Logistic Regression</p>
              <p className="text-[11px] text-[#5C6B76] mt-0.5">Trained offline on synthetic feature vectors</p>
            </div>
          </div>
        </div>

        {/* Feature Importance Table */}
        <div className="pt-2">
          <h3 className="text-xs font-bold text-[#16232E] mb-2">Model Feature Importance & Coefficients</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-[#DDE3E8] border border-[#DDE3E8] rounded">
              <thead className="bg-[#EDF0F2] text-[#5C6B76] font-semibold text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Predictive Feature</th>
                  <th className="py-2.5 px-3">Relative Importance %</th>
                  <th className="py-2.5 px-3">Model Weight (Coefficient)</th>
                  <th className="py-2.5 px-3">Risk Direction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE3E8]">
                {featureImportance.map((f, i) => (
                  <tr key={i} className="hover:bg-[#EDF0F2]/30">
                    <td className="py-2.5 px-3 font-semibold text-[#16232E]">{f.label}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-[#EDF0F2] rounded h-2 overflow-hidden">
                          <div className="bg-[#3D5A73] h-full" style={{ width: `${f.importance_pct}%` }} />
                        </div>
                        <span className="font-mono text-[11px]">{f.importance_pct}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#16232E]">{f.coefficient}</td>
                    <td className="py-2.5 px-3 text-[#5C6B76]">{f.direction} Correlation</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Grid: Zone Distribution across Districts & Hazard Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Zone Distribution by District (8 cols) */}
        <div className="lg:col-span-8 bg-[#FFFFFF] border border-[#DDE3E8] rounded p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-bold text-[#16232E]">Zone Distribution across Pilot Districts</h2>
              <p className="text-xs text-[#5C6B76]">Count of habitations in Red, Orange, Yellow, Green zones</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneDist} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF0F2" />
                <XAxis dataKey="district" tick={{ fontSize: 11, fill: '#16232E' }} />
                <YAxis tick={{ fontSize: 10, fill: '#5C6B76' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#16232E', color: '#fff', fontSize: '11px', borderRadius: '4px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="RED" fill="#C13F3F" name="Red Zone" stackId="a" />
                <Bar dataKey="ORANGE" fill="#D97A2E" name="Orange Zone" stackId="a" />
                <Bar dataKey="YELLOW" fill="#E0B33C" name="Yellow Zone" stackId="a" />
                <Bar dataKey="GREEN" fill="#3F8F5F" name="Green Zone" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hazard Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-[#FFFFFF] border border-[#DDE3E8] rounded p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#16232E]">Hazard Category Share</h2>
            <p className="text-xs text-[#5C6B76]">Monitored settlement count by hazard</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hazardBreakdown}
                  dataKey="count"
                  nameKey="hazard"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {hazardBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={HAZARD_PALETTE[index % HAZARD_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} habitations`, name]}
                  contentStyle={{ backgroundColor: '#16232E', color: '#fff', fontSize: '11px', borderRadius: '4px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1 text-xs text-[#5C6B76] border-t border-[#DDE3E8] pt-2">
            {hazardBreakdown.map((h, i) => (
              <div key={h.hazard} className="flex justify-between">
                <span>{h.hazard}:</span>
                <strong className="text-[#16232E]">{h.count} habitations</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
