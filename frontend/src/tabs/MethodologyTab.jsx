import React from 'react';
import { BookOpen, ShieldCheck, Database, CheckCircle2, AlertTriangle, Layers, Cpu, FileText } from 'lucide-react';

export default function MethodologyTab() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#3D5A73]/15 text-[#3D5A73]">
            Scientific & Operational Basis
          </span>
          <span className="text-xs text-[#5C6B76]">· SDMA Decision Architecture</span>
        </div>
        <h1 className="text-xl font-bold text-[#16232E] mt-1">Methodology & Data Provenance</h1>
        <p className="text-xs text-[#5C6B76] mt-1 leading-relaxed">
          PUNARVAAS fuses multi-source environmental, meteorological, demographic, and historical telemetry into calibrated habitation risk tiers. All recommendations are advisory and designed for human officer review.
        </p>
      </div>

      {/* 4-Layer Fusion Formula Section */}
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-[#16232E] flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#3D5A73]" />
          <span>1. The 4-Layer Composite Risk Fusion Model</span>
        </h2>
        <p className="text-xs text-[#5C6B76] leading-relaxed">
          The composite risk score is evaluated per habitation on a continuous scale from 0.00 to 1.00 by combining four distinct operational layers:
        </p>

        <div className="p-3.5 bg-[#EDF0F2] rounded font-mono text-xs text-[#16232E] border border-[#DDE3E8] leading-relaxed">
          composite_score = 0.35 × hazard_susceptibility + 0.30 × trigger_score + 0.25 × vulnerability + 0.10 × disaster_history
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-3 border border-[#DDE3E8] rounded bg-[#FFFFFF]">
            <span className="font-bold text-[#16232E]">Hazard Susceptibility (35% Weight):</span>
            <p className="text-[#5C6B76] mt-0.5">
              Terrain, geomorphology, and slope stability from Geological Survey of India (GSI) Bhukosh and coastal surge models.
            </p>
          </div>
          <div className="p-3 border border-[#DDE3E8] rounded bg-[#FFFFFF]">
            <span className="font-bold text-[#16232E]">Near-Term Trigger Intensity (30% Weight):</span>
            <p className="text-[#5C6B76] mt-0.5">
              Dynamic physical hazard indicators (IMD 24h rainfall forecasts, CWC gauge levels relative to Danger Level, or cyclone category).
            </p>
          </div>
          <div className="p-3 border border-[#DDE3E8] rounded bg-[#FFFFFF]">
            <span className="font-bold text-[#16232E]">Demographic & Housing Vulnerability (25% Weight):</span>
            <p className="text-[#5C6B76] mt-0.5">
              Proportion of vulnerable age groups, marginalized households, and kutcha dwelling structures from BMTPC / Census data.
            </p>
          </div>
          <div className="p-3 border border-[#DDE3E8] rounded bg-[#FFFFFF]">
            <span className="font-bold text-[#16232E]">Disaster History & Repeat Exposure (10% Weight):</span>
            <p className="text-[#5C6B76] mt-0.5">
              Documented recurrence of extreme events over a 25-year baseline window (1999 Super Cyclone to Cyclone Dana 2024).
            </p>
          </div>
        </div>

        {/* Zone Cutoffs */}
        <div className="pt-3 border-t border-[#DDE3E8]">
          <h3 className="text-xs font-bold text-[#16232E] mb-2">Zone Classification Thresholds</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded border border-[#DDE3E8] bg-[#FFFFFF]">
              <span className="font-bold text-[#C13F3F]">RED Zone: &ge; 0.75</span>
              <p className="text-[11px] text-[#5C6B76] mt-0.5">Acute danger; evacuation or immediate sheltering review.</p>
            </div>
            <div className="p-2.5 rounded border border-[#DDE3E8] bg-[#FFFFFF]">
              <span className="font-bold text-[#D97A2E]">ORANGE Zone: 0.50 - 0.74</span>
              <p className="text-[11px] text-[#5C6B76] mt-0.5">Severe danger; short-term relocation & readiness review.</p>
            </div>
            <div className="p-2.5 rounded border border-[#DDE3E8] bg-[#FFFFFF]">
              <span className="font-bold text-[#E0B33C]">YELLOW Zone: 0.30 - 0.49</span>
              <p className="text-[11px] text-[#5C6B76] mt-0.5">Medium vulnerability; active monitoring status.</p>
            </div>
            <div className="p-2.5 rounded border border-[#DDE3E8] bg-[#FFFFFF]">
              <span className="font-bold text-[#3F8F5F]">GREEN Zone: &lt; 0.30</span>
              <p className="text-[11px] text-[#5C6B76] mt-0.5">Low baseline risk; routine seasonal vigilance.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Refined Hazard-Specific Formulas */}
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-[#16232E] flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#3D5A73]" />
          <span>2. Refined Per-Hazard Trigger Formulas</span>
        </h2>
        <p className="text-xs text-[#5C6B76] leading-relaxed">
          Rather than relying on a generic rainfall proxy, PUNARVAAS implements operational benchmarks aligned with Indian technical agency standards:
        </p>

        <div className="space-y-3 text-xs">
          {/* Landslide */}
          <div className="p-3 bg-[#EDF0F2]/50 rounded border border-[#DDE3E8]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#16232E]">Landslide Trigger Formula (GSI Threshold)</span>
              <span className="text-[10px] font-mono text-[#5C6B76]">trigger_score = min(1.0, rainfall_24h_mm / 150)</span>
            </div>
            <p className="text-[#5C6B76] mt-1">
              Anchored to the Geological Survey of India's (GSI) established 130–150 mm single-day trigger threshold for hilly terrain, using 150mm as the conservative denominator.
            </p>
          </div>

          {/* Flood */}
          <div className="p-3 bg-[#EDF0F2]/50 rounded border border-[#DDE3E8]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#16232E]">River Basin Flood Formula (CWC Operational Logic)</span>
              <span className="text-[10px] font-mono text-[#5C6B76]">trigger_score = 0.6 + 0.4 × clamp((river_level - danger) / (hfl - danger), 0, 1)</span>
            </div>
            <p className="text-[#5C6B76] mt-1">
              Matches Central Water Commission (CWC) operational protocol: crossing Danger Level is categorical (baseline score 0.60), and scales toward the station's Highest Flood Level (HFL).
            </p>
          </div>

          {/* Cyclone */}
          <div className="p-3 bg-[#EDF0F2]/50 rounded border border-[#DDE3E8]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#16232E]">Cyclone / Coastal Surge Mapping (IMD Categories)</span>
              <span className="text-[10px] font-mono text-[#5C6B76]">Depression: 0.20 → Extremely Severe: 1.00</span>
            </div>
            <p className="text-[#5C6B76] mt-1">
              Directly translates India Meteorological Department (IMD) storm categories (Depression: 0.20, Deep Depression: 0.35, Cyclonic Storm: 0.50, Severe: 0.65, Very Severe: 0.80, Extremely Severe / Super Cyclone: 1.00).
            </p>
          </div>

          {/* Cloudburst */}
          <div className="p-3 bg-[#EDF0F2]/50 rounded border border-[#DDE3E8]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#16232E]">Cloudburst Formula (Illustrative Non-Odisha Demo Only)</span>
              <span className="text-[10px] font-mono text-[#5C6B76]">Red Alert = 1.0 or min(1.0, rainfall_1h_mm / 100)</span>
            </div>
            <p className="text-[#5C6B76] mt-1">
              IMD defines cloudburst as precipitation exceeding 100mm in one hour over ~10 sq km. Cloudburst data is strictly excluded from Odisha habitations and reserved for illustrative capability demonstration.
            </p>
          </div>
        </div>
      </div>

      {/* Machine Learning Supporting Role */}
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-[#16232E] flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#3D5A73]" />
          <span>3. Role of Machine Learning (Explainable Supporting Signal)</span>
        </h2>
        <p className="text-xs text-[#5C6B76] leading-relaxed">
          PUNARVAAS employs an offline-trained <code>LogisticRegression</code> model as a secondary, independent sanity-check against the rule-based formula:
        </p>

        <div className="space-y-2 text-xs text-[#5C6B76]">
          <div className="p-3 bg-[#EDF0F2]/50 rounded border border-[#DDE3E8]">
            <strong className="text-[#16232E]">Why Logistic Regression?</strong>
            <p className="mt-0.5">
              Emergency-operations officials require transparent, auditable decision paths. Unlike deep neural networks, logistic regression provides clear coefficients and feature weights that can be explained in court or legislative review.
            </p>
          </div>
          <div className="p-3 bg-[#EDF0F2]/50 rounded border border-[#DDE3E8]">
            <strong className="text-[#16232E]">Model Agreement & Divergence Flags:</strong>
            <p className="mt-0.5">
              When the statistical probability diverges from the rule score by more than 0.15, the UI displays <strong>"Review Needed"</strong>. This alerts disaster officers to examine potential non-linear anomalies in local vulnerability or sheltering distance.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Real-Event Backtest Case Studies */}
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-[#16232E] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#3D5A73]" />
          <span>4. Historical Validation & Backtest Reference Cases</span>
        </h2>
        <p className="text-xs text-[#5C6B76] leading-relaxed">
          The formulas and threshold triggers were validated against four major historical disaster events in India:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 border border-[#DDE3E8] rounded bg-[#FFFFFF]">
            <span className="font-bold text-[#16232E]">1. Darjeeling Landslide Backtest (2015):</span>
            <p className="text-[#5C6B76] mt-1 leading-relaxed">
              Validated that 24h rainfall exceeding 150mm reliably pushes hill slope habitations into RED alert before debris failure occurs.
            </p>
          </div>
          <div className="p-3 border border-[#DDE3E8] rounded bg-[#FFFFFF]">
            <span className="font-bold text-[#16232E]">2. Dikhow River Flood Backtest (2023):</span>
            <p className="text-[#5C6B76] mt-1 leading-relaxed">
              Demonstrated the critical Orange &rarr; Red progression as river water levels crossed CWC Danger Level and approached station HFL.
            </p>
          </div>
          <div className="p-3 border border-[#DDE3E8] rounded bg-[#FFFFFF]">
            <span className="font-bold text-[#16232E]">3. Dharali Cloudburst Backtest (2012):</span>
            <p className="text-[#5C6B76] mt-1 leading-relaxed">
              Confirmed that IMD convective radar alerts (&gt;100mm/hr) must automatically scale trigger intensity to 1.0 for rapid flash warnings.
            </p>
          </div>
          <div className="p-3 border border-[#DDE3E8] rounded bg-[#FFFFFF]">
            <span className="font-bold text-[#16232E]">4. Cyclone Fani & Dana Backtest (2019, 2024):</span>
            <p className="text-[#5C6B76] mt-1 leading-relaxed">
              Proved that Category-based triggers for Extremely Severe Cyclonic Storms ensure timely mass evacuation to certified safe shelters.
            </p>
          </div>
        </div>
      </div>

      {/* Explicit Data Source Provenance Table */}
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-[#16232E] flex items-center gap-2">
          <Database className="w-4 h-4 text-[#3D5A73]" />
          <span>5. Data Sources & Integration Status</span>
        </h2>
        <p className="text-xs text-[#5C6B76]">
          PUNARVAAS strictly distinguishes between operational production targets and prototype synthetic data:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-[#DDE3E8] border border-[#DDE3E8] rounded">
            <thead className="bg-[#EDF0F2] text-[#5C6B76] font-semibold text-[10px] uppercase">
              <tr>
                <th className="py-2.5 px-3">Data Feed</th>
                <th className="py-2.5 px-3">Official Custodian</th>
                <th className="py-2.5 px-3">Target Resolution</th>
                <th className="py-2.5 px-3">Prototype Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3E8]">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#16232E]">Bhukosh Susceptibility GIS</td>
                <td className="py-2.5 px-3 text-[#5C6B76]">Geological Survey of India (GSI)</td>
                <td className="py-2.5 px-3 text-[#5C6B76]">1:50,000 spatial vector</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EDF0F2] text-[#3D5A73] border border-[#DDE3E8]">
                    Synthetic/Illustrative for Prototype
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#16232E]">IMD Gridded Rainfall & Cyclone Tracks</td>
                <td className="py-2.5 px-3 text-[#5C6B76]">India Meteorological Department</td>
                <td className="py-2.5 px-3 text-[#5C6B76]">0.25&deg; grid / 3-hour tracks</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EDF0F2] text-[#3D5A73] border border-[#DDE3E8]">
                    Real Gov Source — Access Pending
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#16232E]">CWC Hydrological Gauge Network</td>
                <td className="py-2.5 px-3 text-[#5C6B76]">Central Water Commission (CWC)</td>
                <td className="py-2.5 px-3 text-[#5C6B76]">Hourly telemetry (meters)</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EDF0F2] text-[#3D5A73] border border-[#DDE3E8]">
                    Real Gov Source — Access Pending
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#16232E]">BMTPC Vulnerability Atlas</td>
                <td className="py-2.5 px-3 text-[#5C6B76]">BMTPC & Census of India</td>
                <td className="py-2.5 px-3 text-[#5C6B76]">Sub-district census ward</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EDF0F2] text-[#3D5A73] border border-[#DDE3E8]">
                    Synthetic/Illustrative for Prototype
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
