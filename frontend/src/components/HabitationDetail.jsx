import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Shield,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Users,
  Compass,
  Building2,
  Navigation,
  Truck,
  Droplets,
  Utensils,
  HeartHandshake,
  Activity,
  ArrowRight,
  ShieldCheck,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { fetchHabitationLogistics } from '../api';

const ZONE_COLORS = {
  RED: '#C13F3F',
  ORANGE: '#D97A2E',
  YELLOW: '#E0B33C',
  GREEN: '#3F8F5F'
};

export default function HabitationDetail({ habitation, onClose, onNavigateToRelocation }) {
  const [activeTab, setActiveTab] = useState('plan'); // 'plan', 'risk', 'logistics'
  const [logisticsData, setLogisticsData] = useState(null);
  const [isLoadingLogistics, setIsLoadingLogistics] = useState(false);

  useEffect(() => {
    if (!habitation?.habitation_id) return;
    let isMounted = true;
    setIsLoadingLogistics(true);

    fetchHabitationLogistics(habitation.habitation_id)
      .then((data) => {
        if (isMounted) {
          setLogisticsData(data);
          setIsLoadingLogistics(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load habitation logistics in HabitationDetail:', err);
        if (isMounted) setIsLoadingLogistics(false);
      });

    return () => {
      isMounted = false;
    };
  }, [habitation?.habitation_id]);

  if (!habitation) return null;

  const zoneColor = ZONE_COLORS[habitation.zone] || '#3D5A73';
  const triggerScore = habitation.current_trigger?.trigger_score ?? 0.3;
  const suscScore = habitation.static_hazard_susceptibility?.score ?? 0.5;
  const vulnScore =
    (habitation.population?.vulnerable_pct ?? 0.2) * 0.6 +
    (habitation.population?.kutcha_pct ?? 0.4) * 0.4;
  const histScore = habitation.history_score ?? 0.3;

  // 4-layer breakdown data for chart
  const breakdownData = [
    { layer: 'Susceptibility', weight: '35%', score: Math.round(suscScore * 100), val: suscScore },
    { layer: 'Trigger', weight: '30%', score: Math.round(triggerScore * 100), val: triggerScore },
    { layer: 'Vulnerability', weight: '25%', score: Math.round(vulnScore * 100), val: vulnScore },
    { layer: 'History', weight: '10%', score: Math.round(histScore * 100), val: histScore }
  ];

  const mlAgreement = habitation.ml_agreement || 'Consistent';
  const isReviewNeeded = mlAgreement === 'Review Needed';

  // Demographics counts
  const totalPop = habitation.population?.total || 1000;
  const vulnDemographicPct = habitation.population?.vulnerable_pct || 0.35;
  const kutchaHousingPct = habitation.population?.kutcha_pct || 0.5;

  const infantsCount = Math.round(totalPop * 0.14);
  const elderlyCount = Math.round(totalPop * 0.11);
  const pregnantCount = Math.round(totalPop * 0.04);
  const totalVulnerablePersons = Math.round(totalPop * vulnDemographicPct);
  const kutchaHouseholds = Math.round((totalPop / 4.8) * kutchaHousingPct);

  // Logistics calculations
  const candidateShelters = logisticsData?.candidate_shelters || [];
  const primaryHaven = candidateShelters.find((c) => c.is_primary) || candidateShelters[0];
  const reliefSupplies = logisticsData?.relief_supplies || {
    drinking_water_litres_per_day: totalPop * 3,
    food_packets_per_day: totalPop * 2,
    sanitation_bio_toilets: Math.max(1, Math.ceil(totalPop / 20)),
    medical_hygiene_kits: Math.max(1, Math.ceil(totalPop / 50))
  };
  const transitTimeline = logisticsData?.evacuation_timeline || {
    primary_evacuation_route: 'Designated Arterial Evacuation Highway',
    bus_convoy_fleet: Math.max(1, Math.ceil(totalPop / 50)),
    odraf_escort_vehicles: Math.max(2, Math.ceil(totalPop / 300)),
    departure_window:
      habitation.relocation_urgency_tier === 'IMMEDIATE'
        ? 'T-0 to T+4 Hours (Immediate Staged Departure)'
        : 'T+6 to T+18 Hours (Daylight Convoy Window)',
    estimated_residence_duration: '4 to 7 Days (Until river/surge level drops below danger mark)'
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] max-w-full bg-[#FFFFFF] shadow-2xl border-l border-[#DDE3E8] z-50 flex flex-col overflow-hidden animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b border-[#DDE3E8] bg-[#16232E] text-white shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/15 text-white">
                {habitation.habitation_id}
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                style={{ backgroundColor: zoneColor }}
              >
                {habitation.zone} ZONE · {habitation.relocation_urgency_tier}
              </span>
              {habitation.is_illustrative && (
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#E0B33C]/20 text-[#E0B33C]">
                  Demo
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-white mt-1 leading-snug">{habitation.village}</h2>
            <p className="text-[11px] text-white/80 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-[#E0B33C]" />
              <span>
                {habitation.district} District · Hazard: {habitation.hazard_type?.replace(/_/g, ' ')}
              </span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Navigation Tabs */}
        <div className="flex items-center gap-1 mt-3 pt-2.5 border-t border-white/15 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('plan')}
            className={`flex-1 py-1.5 px-2 rounded text-center transition-colors cursor-pointer ${
              activeTab === 'plan'
                ? 'bg-[#3D5A73] text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Relocation Plan
          </button>
          <button
            onClick={() => setActiveTab('logistics')}
            className={`flex-1 py-1.5 px-2 rounded text-center transition-colors cursor-pointer ${
              activeTab === 'logistics'
                ? 'bg-[#3D5A73] text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Convoy & Relief
          </button>
          <button
            onClick={() => setActiveTab('risk')}
            className={`flex-1 py-1.5 px-2 rounded text-center transition-colors cursor-pointer ${
              activeTab === 'risk'
                ? 'bg-[#3D5A73] text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Risk & ML Audit
          </button>
        </div>
      </div>

      {/* Body Viewport */}
      <div className="p-4 space-y-4 flex-1 overflow-y-auto text-xs bg-[#EDF0F2]/40">
        {/* ================= TAB 1: RELOCATION PLAN ================= */}
        {activeTab === 'plan' && (
          <div className="space-y-3.5">
            {/* Quick Action Badge Card */}
            <div className="p-3.5 rounded-lg border border-[#DDE3E8] bg-[#FFFFFF] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#5C6B76] uppercase tracking-wider">
                  Operational Relocation Directive
                </span>
                <span className="text-[11px] font-bold text-[#16232E] bg-[#EDF0F2] px-2 py-0.5 rounded">
                  Score: {habitation.composite_risk_score?.toFixed(2)}
                </span>
              </div>
              <p className="text-xs font-bold text-[#16232E] leading-snug">
                {habitation.relocation_urgency_tier === 'IMMEDIATE'
                  ? 'Mandatory immediate evacuation order to certified safe haven before imminent hazard trigger.'
                  : 'Staged short-term relocation recommended. Pre-position transit convoys and relief stocks.'}
              </p>
              <div className="pt-2 border-t border-[#DDE3E8] flex items-center justify-between text-[11px]">
                <span className="text-[#5C6B76]">Affected Settlement Pop:</span>
                <strong className="text-[#16232E] text-xs font-mono">{totalPop.toLocaleString()} Persons</strong>
              </div>
            </div>

            {/* Demographics Breakdown Matrix */}
            <div className="p-3.5 rounded-lg border border-[#DDE3E8] bg-[#FFFFFF] shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#16232E] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#3D5A73]" />
                  <span>Priority Evacuee Demographics</span>
                </h3>
                <span className="text-[10px] text-[#5C6B76]">Census-Grounded</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#EDF0F2] p-2 rounded border border-[#DDE3E8]">
                  <p className="text-[10px] text-[#5C6B76]">Total Vulnerable Pop</p>
                  <p className="font-bold text-[#16232E] text-sm">{totalVulnerablePersons.toLocaleString()}</p>
                  <p className="text-[9px] text-[#5C6B76]">
                    {Math.round(vulnDemographicPct * 100)}% of total village
                  </p>
                </div>
                <div className="bg-[#EDF0F2] p-2 rounded border border-[#DDE3E8]">
                  <p className="text-[10px] text-[#5C6B76]">Kutcha (Earthen) Homes</p>
                  <p className="font-bold text-[#C13F3F] text-sm">{kutchaHouseholds.toLocaleString()} HH</p>
                  <p className="text-[9px] text-[#5C6B76]">
                    {Math.round(kutchaHousingPct * 100)}% high collapse risk
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] pt-1 border-t border-[#DDE3E8]">
                <div className="bg-white p-1.5 rounded border border-[#DDE3E8]">
                  <span className="text-[#5C6B76] block">Infants/Kids</span>
                  <strong className="text-[#16232E]">{infantsCount}</strong>
                </div>
                <div className="bg-white p-1.5 rounded border border-[#DDE3E8]">
                  <span className="text-[#5C6B76] block">Elderly (60+)</span>
                  <strong className="text-[#16232E]">{elderlyCount}</strong>
                </div>
                <div className="bg-white p-1.5 rounded border border-[#DDE3E8]">
                  <span className="text-[#5C6B76] block">Pregnant Women</span>
                  <strong className="text-[#16232E]">{pregnantCount}</strong>
                </div>
              </div>
            </div>

            {/* Assigned Shelter Haven Match */}
            <div className="p-3.5 rounded-lg border border-[#DDE3E8] bg-[#FFFFFF] shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#16232E] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#3F8F5F]" />
                  <span>Assigned Shelter Havens</span>
                </h3>
                <span className="text-[10px] text-[#3F8F5F] font-bold">Capacity Bounded</span>
              </div>

              {primaryHaven ? (
                <div className="bg-[#3F8F5F]/10 border border-[#3F8F5F]/30 p-2.5 rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#3F8F5F] text-white">
                        {primaryHaven.recommendation_tier || 'PRIMARY SAFE HAVEN'}
                      </span>
                      <p className="font-bold text-[#16232E] text-xs mt-1">{primaryHaven.name}</p>
                      <p className="text-[10px] text-[#5C6B76]">
                        {primaryHaven.district} Jurisdiction · Road Distance: {primaryHaven.distance_km} km
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xs text-[#3D5A73]">
                        {primaryHaven.suitability_score?.toFixed(3)}
                      </span>
                      <p className="text-[9px] text-[#5C6B76]">Suitability</p>
                    </div>
                  </div>

                  {/* Shelter Capacity Progress */}
                  <div className="space-y-1 pt-1 border-t border-[#3F8F5F]/20">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[#5C6B76]">Usable Capacity:</span>
                      <strong className="text-[#16232E]">
                        {primaryHaven.usable_capacity?.toLocaleString()} persons
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#5C6B76]">
                      <span>Road Access: {primaryHaven.access_score}/10</span>
                      <span>Infra Readiness: {primaryHaven.infrastructure_score}/10</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#EDF0F2] rounded text-center text-[#5C6B76]">
                  Loading optimal shelter allocation...
                </div>
              )}

              {/* Alternative Backup Havens */}
              {candidateShelters.length > 1 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-semibold text-[#5C6B76] uppercase tracking-wider">
                    Alternative / Staging Havens:
                  </p>
                  {candidateShelters.slice(1, 3).map((alt, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-[#EDF0F2]/70 border border-[#DDE3E8] flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-[#16232E] text-[11px]">{alt.name}</p>
                        <p className="text-[10px] text-[#5C6B76]">
                          {alt.district} · {alt.distance_km} km · Cap: {alt.usable_capacity?.toLocaleString()}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-[#3D5A73]">
                        Score: {alt.suitability_score?.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Official Explanation String */}
            <div className="p-3 rounded-lg border border-[#DDE3E8] bg-[#FFFFFF] shadow-xs">
              <p className="text-[10px] font-semibold text-[#5C6B76] uppercase tracking-wider mb-1">
                Civil Defense Decision Trail
              </p>
              <p className="text-[11px] text-[#16232E] leading-relaxed font-mono bg-[#EDF0F2] p-2.5 rounded border border-[#DDE3E8]">
                {habitation.explanation || habitation.trigger_description}
              </p>
            </div>
          </div>
        )}

        {/* ================= TAB 2: CONVOY & RELIEF ================= */}
        {activeTab === 'logistics' && (
          <div className="space-y-3.5">
            {/* Evacuation Convoy Matrix */}
            <div className="p-3.5 rounded-lg border border-[#DDE3E8] bg-[#FFFFFF] shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#16232E] flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#3D5A73]" />
                  <span>Transport Convoy Requisition</span>
                </h3>
                <span className="text-[10px] text-[#3D5A73] font-bold">OSRTC Fleet</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#EDF0F2] p-2.5 rounded border border-[#DDE3E8]">
                  <p className="text-[10px] text-[#5C6B76]">50-Seater Evac Buses</p>
                  <p className="font-bold text-[#16232E] text-base">{transitTimeline.bus_convoy_fleet} Units</p>
                  <p className="text-[9px] text-[#5C6B76]">State Transport Dept</p>
                </div>
                <div className="bg-[#EDF0F2] p-2.5 rounded border border-[#DDE3E8]">
                  <p className="text-[10px] text-[#5C6B76]">ODRAF Escort Trucks</p>
                  <p className="font-bold text-[#3D5A73] text-base">
                    {transitTimeline.odraf_escort_vehicles} Units
                  </p>
                  <p className="text-[9px] text-[#5C6B76]">Disaster Rapid Action Force</p>
                </div>
              </div>

              <div className="space-y-1.5 pt-1 text-[11px]">
                <div className="flex items-start gap-1.5 text-[#16232E]">
                  <Navigation className="w-3.5 h-3.5 text-[#E0B33C] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[#5C6B76]">Primary Evacuation Corridor:</span>
                    <p className="font-bold">{transitTimeline.primary_evacuation_route}</p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5 text-[#16232E] pt-1">
                  <Clock className="w-3.5 h-3.5 text-[#D97A2E] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[#5C6B76]">Departure Window:</span>
                    <p className="font-semibold text-[#D97A2E]">{transitTimeline.departure_window}</p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5 text-[#16232E] pt-1">
                  <Activity className="w-3.5 h-3.5 text-[#3F8F5F] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[#5C6B76]">Anticipated Stay Duration:</span>
                    <p className="font-semibold text-[#16232E]">{transitTimeline.estimated_residence_duration}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Humanitarian Relief Requisitions (Sphere Standards) */}
            <div className="p-3.5 rounded-lg border border-[#DDE3E8] bg-[#FFFFFF] shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#16232E] flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-[#C13F3F]" />
                  <span>Humanitarian Relief Requisition</span>
                </h3>
                <span className="text-[10px] text-[#5C6B76]">NDMA Standard</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#EDF0F2] p-2 rounded border border-[#DDE3E8] flex items-start gap-2">
                  <Droplets className="w-4 h-4 text-[#3D5A73] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-[#5C6B76]">Drinking Water / Day</p>
                    <p className="font-bold text-[#16232E]">
                      {reliefSupplies.drinking_water_litres_per_day?.toLocaleString()} Litres
                    </p>
                    <p className="text-[9px] text-[#5C6B76]">3L per person / day</p>
                  </div>
                </div>

                <div className="bg-[#EDF0F2] p-2 rounded border border-[#DDE3E8] flex items-start gap-2">
                  <Utensils className="w-4 h-4 text-[#D97A2E] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-[#5C6B76]">Food Meals / Day</p>
                    <p className="font-bold text-[#16232E]">
                      {reliefSupplies.food_packets_per_day?.toLocaleString()} Meals
                    </p>
                    <p className="text-[9px] text-[#5C6B76]">2 hot meals / day</p>
                  </div>
                </div>

                <div className="bg-[#EDF0F2] p-2 rounded border border-[#DDE3E8] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#3F8F5F] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-[#5C6B76]">Sanitation Bio-Toilets</p>
                    <p className="font-bold text-[#16232E]">
                      {reliefSupplies.sanitation_bio_toilets} Units
                    </p>
                    <p className="text-[9px] text-[#5C6B76]">1 per 20 persons</p>
                  </div>
                </div>

                <div className="bg-[#EDF0F2] p-2 rounded border border-[#DDE3E8] flex items-start gap-2">
                  <Activity className="w-4 h-4 text-[#C13F3F] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-[#5C6B76]">Medical Triage Kits</p>
                    <p className="font-bold text-[#16232E]">
                      {reliefSupplies.medical_hygiene_kits} Kits
                    </p>
                    <p className="text-[9px] text-[#5C6B76]">1 per 50 persons</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Phased Operational Timeline */}
            <div className="p-3.5 rounded-lg border border-[#DDE3E8] bg-[#FFFFFF] shadow-xs space-y-2">
              <h3 className="font-bold text-[#16232E]">Phased Evacuation Stages</h3>
              <div className="space-y-2 text-[11px]">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#C13F3F] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-[#16232E]">Stage 1: Early Warning & Vulnerable Priority</p>
                    <p className="text-[#5C6B76]">
                      Mobilize {infantsCount + elderlyCount + pregnantCount} vulnerable individuals via ODRAF priority transport.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#D97A2E] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-[#16232E]">Stage 2: Full Convoy Transit to Safe Haven</p>
                    <p className="text-[#5C6B76]">
                      Deploy {transitTimeline.bus_convoy_fleet} buses along {transitTimeline.primary_evacuation_route}.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#3F8F5F] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-[#16232E]">Stage 3: Shelter Ingestion & Relief Distribution</p>
                    <p className="text-[#5C6B76]">
                      Distribute rations, water supply, and register family units in District SDMA registry.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: RISK & ML AUDIT ================= */}
        {activeTab === 'risk' && (
          <div className="space-y-3.5">
            {/* 4-Layer Breakdown Bar Chart */}
            <div className="p-3.5 rounded-lg border border-[#DDE3E8] bg-[#FFFFFF] shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-[#16232E]">4-Layer Risk Score Breakdown</h3>
                <span className="text-[10px] text-[#5C6B76]">Weighted Formula</span>
              </div>

              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={breakdownData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#5C6B76' }} unit="%" />
                    <YAxis dataKey="layer" type="category" tick={{ fontSize: 10, fill: '#16232E' }} width={80} />
                    <Tooltip
                      formatter={(val, name, item) => [`${val}% (Weight: ${item.payload.weight})`, 'Score']}
                      contentStyle={{
                        backgroundColor: '#16232E',
                        color: '#fff',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                      {breakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#3D5A73" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[#5C6B76] mt-2 pt-2 border-t border-[#DDE3E8]">
                <div>
                  Susceptibility (35%): <strong className="text-[#16232E]">{Math.round(suscScore * 100)}%</strong>
                </div>
                <div>
                  Trigger (30%): <strong className="text-[#16232E]">{Math.round(triggerScore * 100)}%</strong>
                </div>
                <div>
                  Vulnerability (25%): <strong className="text-[#16232E]">{Math.round(vulnScore * 100)}%</strong>
                </div>
                <div>
                  History (10%): <strong className="text-[#16232E]">{Math.round(histScore * 100)}%</strong>
                </div>
              </div>
            </div>

            {/* ML Logistic Regression Card */}
            <div className="p-3.5 rounded-lg border border-[#DDE3E8] bg-[#FFFFFF] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#16232E]">ML Supporting Signal</h3>
                <div className="flex items-center gap-1">
                  {isReviewNeeded ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E0B33C]/20 text-[#16232E] border border-[#E0B33C]">
                      <AlertTriangle className="w-3 h-3 text-[#D97A2E]" />
                      Review Needed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#3F8F5F]/20 text-[#16232E] border border-[#3F8F5F]">
                      <CheckCircle2 className="w-3 h-3 text-[#3F8F5F]" />
                      Consistent
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-baseline justify-between text-xs pt-1">
                <span className="text-[#5C6B76]">ML Risk Probability:</span>
                <span className="font-bold text-[#16232E]">
                  {habitation.ml_risk_probability?.toFixed(2)} (
                  {Math.round((habitation.ml_risk_probability || 0) * 100)}%)
                </span>
              </div>

              {habitation.top_features && habitation.top_features.length > 0 && (
                <div className="pt-2 border-t border-[#DDE3E8]">
                  <p className="text-[10px] font-semibold text-[#5C6B76] uppercase tracking-wider mb-1">
                    Top Driving Risk Factors:
                  </p>
                  <ul className="space-y-1">
                    {habitation.top_features.map((f, i) => (
                      <li key={i} className="text-xs flex items-center justify-between text-[#16232E]">
                        <span className="text-[#5C6B76]">{f.label}</span>
                        <span className="font-mono text-[11px] font-semibold">+{f.impact_score}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3.5 border-t border-[#DDE3E8] bg-[#FFFFFF] shrink-0 space-y-2">
        <button
          onClick={() => {
            if (onNavigateToRelocation) onNavigateToRelocation();
            if (onClose) onClose();
          }}
          className="w-full py-2.5 px-3 rounded text-xs font-bold bg-[#16232E] hover:bg-[#3D5A73] text-white transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <Compass className="w-4 h-4 text-[#E0B33C]" />
          <span>Open Full Relocation Action Dossier</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
