import React, { useState, useMemo, useEffect } from 'react';
import {
  BellRing,
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Filter,
  Play,
  History,
  CheckCircle2,
  Compass,
  Calendar,
  Building,
  Building2,
  ChevronDown,
  ChevronUp,
  Waves,
  Wind,
  Mountain,
  CloudRain,
  MapPin,
  Navigation,
  Truck,
  Clock,
  Droplets,
  Utensils,
  ShieldCheck,
  Activity,
  Users,
  ArrowUpRight
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { fetchHabitationLogistics } from '../api';

const SEVERITY_BORDER = {
  RED: 'border-l-4 border-[#C13F3F]',
  ORANGE: 'border-l-4 border-[#D97A2E]',
  YELLOW: 'border-l-4 border-[#E0B33C]'
};

const SEVERITY_BADGE = {
  RED: 'bg-[#C13F3F] text-white',
  ORANGE: 'bg-[#D97A2E] text-white',
  YELLOW: 'bg-[#E0B33C] text-black font-semibold'
};

const HAZARD_ICONS = {
  cyclone_coastal: Wind,
  flood: Waves,
  landslide: Mountain,
  cloudburst: CloudRain
};

function HabitationLogisticsCard({ habId, alert, habitationsMap, onSelectHabitation }) {
  const hab = habitationsMap[habId] || { habitation_id: habId, village: habId, district: alert.district };
  const [logistics, setLogistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedShelterIdx, setSelectedShelterIdx] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchHabitationLogistics(habId)
      .then((data) => {
        if (isMounted) {
          setLogistics(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load logistics for', habId, err);
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [habId]);

  if (loading) {
    return (
      <div className="p-3 bg-[#EDF0F2]/60 rounded border border-[#DDE3E8] text-xs text-[#5C6B76] animate-pulse flex items-center justify-between">
        <span className="font-mono font-bold text-[#16232E]">{habId}</span>
        <span>Evaluating nearest candidate shelters, highway corridors & relief supply logistics...</span>
      </div>
    );
  }

  if (!logistics) {
    return (
      <div className="p-3 bg-[#EDF0F2]/40 rounded border border-[#DDE3E8] text-xs flex items-center justify-between">
        <span className="font-mono font-bold text-[#16232E]">{habId}</span>
        <span className="text-[#5C6B76]">{alert.district}</span>
      </div>
    );
  }

  const activeShelter = logistics.candidate_shelters?.[selectedShelterIdx] || logistics.candidate_shelters?.[0];

  return (
    <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-4 shadow-sm space-y-4">
      {/* 1. Location Header & Live Map Jump */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DDE3E8] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#16232E] text-white">
              {logistics.habitation_id}
            </span>
            <h4 className="text-sm font-bold text-[#16232E]">{logistics.village}</h4>
            <span className="text-xs text-[#5C6B76]">· {logistics.district}</span>
          </div>
          <div className="flex items-center flex-wrap gap-2 mt-1.5 text-[11px] text-[#5C6B76]">
            <span>GPS: <strong className="font-mono text-[#16232E]">{logistics.lat?.toFixed(4)}, {logistics.lon?.toFixed(4)}</strong></span>
            <span>·</span>
            <span>At-Risk Population: <strong className="text-[#16232E]">{logistics.population_at_risk?.toLocaleString()} evacuees</strong></span>
            <span>·</span>
            <span className="font-semibold text-[#C13F3F]">Tier: {logistics.urgency_tier}</span>
          </div>
        </div>

        {onSelectHabitation && (
          <button
            onClick={() => onSelectHabitation(hab)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#16232E] hover:bg-[#3D5A73] text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm shrink-0 self-start sm:self-center"
            title="Jump to GIS Live Map with this village and its evacuation corridor focused"
          >
            <MapPin className="w-3.5 h-3.5 text-[#E0B33C]" />
            <span>Pinpoint on Live Map</span>
            <ArrowUpRight className="w-3 h-3 opacity-70" />
          </button>
        )}
      </div>

      {/* 2. Candidate Shelters Comparison ("Recommend More Places") */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#3D5A73]" />
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#16232E]">
              Nearest Candidate Safe Shelters ({logistics.candidate_shelters?.length || 0} Evaluated)
            </h5>
          </div>
          <span className="text-[10px] text-[#5C6B76]">Ranked by proximity, road viability & capacity headroom</span>
        </div>

        {/* Shelter Switcher Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {logistics.candidate_shelters?.map((shelter, idx) => {
            const isSelected = selectedShelterIdx === idx;
            return (
              <button
                key={shelter.site_id}
                type="button"
                onClick={() => setSelectedShelterIdx(idx)}
                className={`p-2.5 rounded border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#16232E] text-white border-[#16232E] shadow-sm'
                    : 'bg-[#EDF0F2]/50 hover:bg-[#EDF0F2] text-[#16232E] border-[#DDE3E8]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className={`px-1.5 py-0.2 rounded font-bold ${
                    isSelected
                      ? 'bg-white/20 text-[#E0B33C]'
                      : shelter.is_primary ? 'bg-[#3F8F5F]/20 text-[#3F8F5F]' : 'bg-[#5C6B76]/20 text-[#5C6B76]'
                  }`}>
                    {shelter.recommendation_tier}
                  </span>
                  <span className={isSelected ? 'text-white/80 font-mono' : 'text-[#5C6B76] font-mono'}>
                    {shelter.distance_km} km
                  </span>
                </div>
                <p className="text-xs font-bold truncate">{shelter.name}</p>
                <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-white/70' : 'text-[#5C6B76]'}`}>
                  Cap: {shelter.usable_capacity?.toLocaleString()} · Access: {shelter.access_score}/10
                </p>
              </button>
            );
          })}
        </div>

        {/* Selected Candidate Detailed Inspection Card */}
        {activeShelter && (
          <div className="bg-[#EDF0F2]/40 rounded p-3 border border-[#DDE3E8] text-xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#DDE3E8] pb-1.5">
              <div>
                <span className="font-bold text-[#16232E]">{activeShelter.name}</span>
                <span className="text-[#5C6B76] ml-2">({activeShelter.district} · {activeShelter.site_id})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3F8F5F]/15 text-[#3F8F5F]">
                  Suitability: {activeShelter.suitability_score.toFixed(3)}
                </span>
                <span className="text-[11px] font-semibold text-[#16232E]">
                  {activeShelter.distance_km} km away
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#16232E]/80 leading-relaxed">
              {activeShelter.notes}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="bg-white p-2 rounded border border-[#DDE3E8]">
                <span className="text-[#5C6B76] block text-[10px]">Usable Capacity</span>
                <strong className="text-[#16232E]">{activeShelter.usable_capacity?.toLocaleString()} persons</strong>
              </div>
              <div className="bg-white p-2 rounded border border-[#DDE3E8]">
                <span className="text-[#5C6B76] block text-[10px]">Road Access Score</span>
                <strong className="text-[#16232E]">{activeShelter.access_score} / 10</strong>
              </div>
              <div className="bg-white p-2 rounded border border-[#DDE3E8]">
                <span className="text-[#5C6B76] block text-[10px]">Infrastructure Ready</span>
                <strong className="text-[#16232E]">{activeShelter.infrastructure_score} / 10</strong>
              </div>
              <div className="bg-white p-2 rounded border border-[#DDE3E8]">
                <span className="text-[#5C6B76] block text-[10px]">Secondary Hazard</span>
                <strong className="text-[#3F8F5F]">{activeShelter.secondary_risk_score} (Safe Ground)</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Humanitarian Relief Supplies Calculator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-[#D97A2E]" />
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#16232E]">
              Required Relief Supplies Requisition
            </h5>
          </div>
          <span className="text-[10px] text-[#5C6B76]">{logistics.relief_supplies.standards_basis}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <div className="bg-[#EDF0F2]/50 p-2.5 rounded border border-[#DDE3E8]">
            <div className="flex items-center gap-1 text-[#3D5A73] mb-1">
              <Droplets className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold uppercase">Drinking Water</span>
            </div>
            <p className="text-sm font-bold text-[#16232E]">
              {logistics.relief_supplies.drinking_water_litres_per_day?.toLocaleString()} <span className="text-xs font-normal">L/day</span>
            </p>
            <span className="text-[10px] text-[#5C6B76]">3.0 Litres/person/day</span>
          </div>

          <div className="bg-[#EDF0F2]/50 p-2.5 rounded border border-[#DDE3E8]">
            <div className="flex items-center gap-1 text-[#D97A2E] mb-1">
              <Utensils className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold uppercase">Food Rations</span>
            </div>
            <p className="text-sm font-bold text-[#16232E]">
              {logistics.relief_supplies.food_packets_per_day?.toLocaleString()} <span className="text-xs font-normal">meals/day</span>
            </p>
            <span className="text-[10px] text-[#5C6B76]">2 cooked meals/day</span>
          </div>

          <div className="bg-[#EDF0F2]/50 p-2.5 rounded border border-[#DDE3E8]">
            <div className="flex items-center gap-1 text-[#3F8F5F] mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold uppercase">Bio-Toilets</span>
            </div>
            <p className="text-sm font-bold text-[#16232E]">
              {logistics.relief_supplies.sanitation_bio_toilets} <span className="text-xs font-normal">units</span>
            </p>
            <span className="text-[10px] text-[#5C6B76]">1 toilet per 20 persons</span>
          </div>

          <div className="bg-[#EDF0F2]/50 p-2.5 rounded border border-[#DDE3E8]">
            <div className="flex items-center gap-1 text-[#C13F3F] mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold uppercase">Medical / Triage</span>
            </div>
            <p className="text-sm font-bold text-[#16232E]">
              {logistics.relief_supplies.medical_hygiene_kits} <span className="text-xs font-normal">kits</span>
            </p>
            <span className="text-[10px] text-[#5C6B76]">ORS & Halazone kits</span>
          </div>

          <div className="bg-[#EDF0F2]/50 p-2.5 rounded border border-[#DDE3E8] col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1 text-[#16232E] mb-1">
              <Users className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold uppercase">Special Care</span>
            </div>
            <p className="text-sm font-bold text-[#16232E]">
              {logistics.relief_supplies.vulnerable_individuals_count} <span className="text-xs font-normal">persons</span>
            </p>
            <span className="text-[10px] text-[#5C6B76]">Infants & elderly</span>
          </div>
        </div>
      </div>

      {/* 4. Evacuation Transit Route & Approximate Timeline Window */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-[#3D5A73]" />
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#16232E]">
              Evacuation Transit Corridor & Timeline Schedule
            </h5>
          </div>
          <span className="text-[10px] text-[#5C6B76]">Operational dispatch logistics</span>
        </div>

        <div className="bg-[#16232E] text-white p-3.5 rounded border border-[#3D5A73] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#3D5A73]/70 pb-2">
            <div>
              <span className="text-[10px] text-[#E0B33C] uppercase tracking-wider font-semibold block">Designated Highway Corridor</span>
              <p className="font-bold text-xs text-white mt-0.5">{logistics.evacuation_timeline.primary_evacuation_route}</p>
              <p className="text-[11px] text-[#EDF0F2]/70">{logistics.evacuation_timeline.road_condition}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-[#3D5A73]/60 px-2.5 py-1.5 rounded text-center border border-[#5C6B76]/40">
                <span className="text-[10px] text-[#EDF0F2]/70 block">Buses Needed</span>
                <strong className="text-xs text-[#E0B33C]">{logistics.evacuation_timeline.bus_convoy_fleet} (50-Seater)</strong>
              </div>
              <div className="bg-[#3D5A73]/60 px-2.5 py-1.5 rounded text-center border border-[#5C6B76]/40">
                <span className="text-[10px] text-[#EDF0F2]/70 block">Escort 4x4</span>
                <strong className="text-xs text-white">{logistics.evacuation_timeline.odraf_escort_vehicles} Trucks</strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <div className="flex items-center gap-1 text-[#E0B33C] mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase">Departure Window</span>
              </div>
              <p className="font-semibold text-white text-[11px] leading-tight">
                {logistics.evacuation_timeline.departure_window}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1 text-[#3F8F5F] mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase">Residence Duration</span>
              </div>
              <p className="font-semibold text-white text-[11px] leading-tight">
                {logistics.evacuation_timeline.estimated_residence_duration}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1 text-[#EDF0F2]/70 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#3F8F5F]" />
                <span className="text-[10px] font-bold uppercase">Re-Entry Protocol</span>
              </div>
              <p className="text-[#EDF0F2]/80 text-[11px] leading-tight">
                {logistics.evacuation_timeline.repatriation_protocol}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AlertsTab({
  alerts,
  selectedAlert,
  onSelectAlert,
  onNavigateTab,
  habitations = [],
  onSelectHabitation,
  scenarios,
  activeScenario,
  onSimulateScenario,
  onTriggerJudgeDemo,
  isSimulating,
  isJudgeDemoLoading
}) {
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [hazardFilter, setHazardFilter] = useState('ALL');
  const [historySearch, setHistorySearch] = useState('');

  const habitationsMap = useMemo(() => {
    const map = {};
    (habitations || []).forEach((h) => {
      map[h.habitation_id] = h;
    });
    return map;
  }, [habitations]);

  // Sync expanded card if selectedAlert changes
  React.useEffect(() => {
    if (selectedAlert) {
      setExpandedAlertId(selectedAlert.alert_id);
    }
  }, [selectedAlert]);

  // Separate Active and Resolved alerts
  const activeAlerts = useMemo(() => {
    return (alerts || []).filter((a) => {
      if (a.status !== 'ACTIVE') return false;
      if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
      if (districtFilter !== 'ALL' && a.district !== districtFilter) return false;
      if (hazardFilter !== 'ALL' && a.hazard_type !== hazardFilter) return false;
      return true;
    });
  }, [alerts, severityFilter, districtFilter, hazardFilter]);

  const resolvedAlerts = useMemo(() => {
    return (alerts || []).filter((a) => {
      if (a.status !== 'RESOLVED') return false;
      if (historySearch) {
        const q = historySearch.toLowerCase();
        return (
          a.alert_id.toLowerCase().includes(q) ||
          a.district.toLowerCase().includes(q) ||
          a.message.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [alerts, historySearch]);

  const toggleExpand = (alertId) => {
    setExpandedAlertId(prev => (prev === alertId ? null : alertId));
  };

  const renderTrendIcon = (trend) => {
    if (trend === 'ACUTE') {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-[#16232E]">
          <ArrowUp className="w-3.5 h-3.5 text-[#16232E]" /> ↑ Rising (Acute)
        </span>
      );
    }
    if (trend === 'ELEVATED') {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-[#16232E]">
          <ArrowRight className="w-3.5 h-3.5 text-[#16232E]" /> → Elevated
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[#5C6B76]">
        <ArrowDown className="w-3.5 h-3.5" /> ↓ Stable
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Operations Header: Simulation Bar & Quick Demo */}
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#3D5A73]/15 text-[#3D5A73]">
              Emergency Operations Center
            </span>
            <span className="text-xs text-[#5C6B76]">· Real-Time Automated Decision Logic</span>
          </div>
          <h1 className="text-lg font-bold text-[#16232E] mt-0.5">Alerts & Warning System</h1>
          <p className="text-xs text-[#5C6B76]">
            Deterministic trigger escalation logic anchored to CWC flood levels, GSI landslide thresholds, and IMD cyclone categories.
          </p>
        </div>

        {/* Simulation Controls Group */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
          {/* Scenario Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#5C6B76] font-medium">Simulate scenario:</span>
            <select
              value={activeScenario}
              onChange={(e) => onSimulateScenario(e.target.value)}
              disabled={isSimulating}
              className="bg-[#EDF0F2] text-[#16232E] border border-[#DDE3E8] rounded px-3 py-1.5 text-xs font-semibold cursor-pointer focus:outline-none focus:border-[#3D5A73]"
            >
              <option value="baseline">Baseline Seasonal State</option>
              <option value="flood_dikhow_surge">Baitarani Flood Surge (Orange → Red)</option>
              <option value="cyclone_landfall_escalation">Cyclone Landfall Escalation (Puri Coast)</option>
              <option value="landslide_monsoon_saturation">Kandhamal Hill Saturation (195mm Saturation)</option>
            </select>
          </div>

          {/* Mandatory Judge Demo Mode Button */}
          <button
            onClick={onTriggerJudgeDemo}
            disabled={isJudgeDemoLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#3D5A73] hover:bg-[#4E6F8C] active:bg-[#2D4559] text-white transition-colors cursor-pointer border border-[#3D5A73] shadow-sm"
            title="Demonstrates rapid river gauge escalation into RED zone in one click"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isJudgeDemoLoading ? 'Running Demo...' : 'Judge Demo Mode'}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-3 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center gap-1 font-bold text-[#16232E] mr-1">
            <Filter className="w-3.5 h-3.5 text-[#3D5A73]" />
            <span>Filter Active Alerts:</span>
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#EDF0F2] text-[#16232E] border border-[#DDE3E8] rounded px-2.5 py-1 font-medium cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="RED">RED Alerts Only</option>
            <option value="ORANGE">ORANGE Alerts Only</option>
            <option value="YELLOW">YELLOW Alerts Only</option>
          </select>

          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="bg-[#EDF0F2] text-[#16232E] border border-[#DDE3E8] rounded px-2.5 py-1 font-medium cursor-pointer"
          >
            <option value="ALL">All Districts</option>
            <option value="Puri">Puri</option>
            <option value="Kendrapara">Kendrapara</option>
            <option value="Ganjam">Ganjam</option>
            <option value="Kandhamal">Kandhamal</option>
            <option value="Uttarkashi (Illustrative Demo)">Uttarkashi (Illustrative)</option>
          </select>

          <select
            value={hazardFilter}
            onChange={(e) => setHazardFilter(e.target.value)}
            className="bg-[#EDF0F2] text-[#16232E] border border-[#DDE3E8] rounded px-2.5 py-1 font-medium cursor-pointer"
          >
            <option value="ALL">All Hazards</option>
            <option value="flood">Flood</option>
            <option value="cyclone_coastal">Cyclone & Surge</option>
            <option value="landslide">Landslide</option>
            <option value="cloudburst">Cloudburst (Illustrative)</option>
          </select>
        </div>

        <div className="text-[#5C6B76] font-medium">
          Showing <strong className="text-[#16232E]">{activeAlerts.length}</strong> active warnings
        </div>
      </div>

      {/* Active Alerts List */}
      <div className="space-y-4">
        {activeAlerts.length === 0 ? (
          <div className="bg-white border border-[#DDE3E8] rounded p-8 text-center text-sm text-[#5C6B76]">
            <CheckCircle2 className="w-8 h-8 text-[#3F8F5F] mx-auto mb-2" />
            <p className="font-semibold text-[#16232E]">No active alerts matching your filter criteria.</p>
            <p className="text-xs text-[#5C6B76] mt-1">
              Select "Simulate scenario" or click "Judge Demo Mode" above to simulate an escalation.
            </p>
          </div>
        ) : (
          activeAlerts.map((alert) => {
            const isExpanded = expandedAlertId === alert.alert_id;
            const HazardIcon = HAZARD_ICONS[alert.hazard_type] || BellRing;
            const historyData = alert.history_5day || alert.primary_habitation?.current_trigger?.history_5day || [];

            return (
              <div
                key={alert.alert_id}
                className={`bg-[#FFFFFF] rounded border border-[#DDE3E8] shadow-sm transition-all overflow-hidden ${
                  SEVERITY_BORDER[alert.severity] || ''
                }`}
              >
                {/* Alert Card Header (Click to toggle expansion) */}
                <div
                  onClick={() => toggleExpand(alert.alert_id)}
                  className="p-4 cursor-pointer hover:bg-[#EDF0F2]/40 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded bg-[#EDF0F2] text-[#3D5A73] shrink-0 mt-0.5">
                      <HazardIcon className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-xs font-mono font-bold text-[#16232E]">{alert.alert_id}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${SEVERITY_BADGE[alert.severity]}`}>
                          {alert.severity}
                        </span>
                        <span className="text-xs text-[#5C6B76]">·</span>
                        <span className="text-xs font-semibold text-[#16232E] capitalize">
                          {alert.hazard_type?.replace(/_/g, ' ')} Risk · {alert.district}
                        </span>
                        <span className="text-xs text-[#5C6B76]">
                          ({alert.habitation_ids?.length || 1} habitations affected)
                        </span>
                      </div>

                      {/* One-line explanation */}
                      <p className="text-xs text-[#16232E] font-medium mt-1 leading-relaxed">
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  {/* Card Right Meta & Trigger Trend */}
                  <div className="flex items-center gap-4 text-xs shrink-0 self-end md:self-center">
                    <div className="text-right">
                      <div className="text-xs">{renderTrendIcon(alert.trigger_trend)}</div>
                      <span className="text-[11px] text-[#5C6B76] block mt-0.5 font-medium">
                        Tier: <strong className="text-[#16232E]">{alert.recommended_urgency_tier}</strong>
                      </span>
                    </div>

                    <button
                      className="p-1 rounded hover:bg-[#DDE3E8] text-[#5C6B76] transition-colors"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Card Detail View */}
                {isExpanded && (
                  <div className="p-5 border-t border-[#DDE3E8] bg-[#EDF0F2]/25 space-y-5 text-xs animate-fadeIn">
                    {/* Grid: 5-Day Historical Trigger Chart & Score Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      {/* 5-Day Historical Trigger Context (7 cols) */}
                      <div className="lg:col-span-7 bg-[#FFFFFF] p-4 rounded border border-[#DDE3E8] shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-bold text-[#16232E]">5-Day Trigger Trend Progression</h3>
                          <span className="text-[11px] text-[#5C6B76]">Telemetry Context (Last 5 Days)</span>
                        </div>

                        <div className="h-44 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={historyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#EDF0F2" />
                              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#5C6B76' }} />
                              <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: '#5C6B76' }} unit="" />
                              <Tooltip
                                formatter={(val) => [`${(val * 100).toFixed(0)}%`, 'Trigger Intensity']}
                                contentStyle={{ backgroundColor: '#16232E', color: '#fff', fontSize: '11px', borderRadius: '4px' }}
                              />
                              <Line
                                type="monotone"
                                dataKey="trigger_score"
                                stroke="#3D5A73"
                                strokeWidth={2.5}
                                dot={{ fill: '#3D5A73', r: 4 }}
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <p className="text-[11px] text-[#5C6B76] mt-2">
                          Anchored to operational benchmarks: Trigger values crossing 0.50 flag ELEVATED, while values &ge; 0.90 trigger ACUTE status.
                        </p>
                      </div>

                      {/* Score Breakdown & ML Agreement (5 cols) */}
                      <div className="lg:col-span-5 bg-[#FFFFFF] p-4 rounded border border-[#DDE3E8] shadow-sm flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-2">
                            <h3 className="text-xs font-bold text-[#16232E]">Decision Model Diagnostics</h3>
                            <span className="text-[10px] text-[#5C6B76]">PUNARVAAS Engine</span>
                          </div>

                          <div className="mt-2 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[#5C6B76]">Composite Risk Score:</span>
                              <strong className="text-[#16232E]">{alert.composite_risk_score.toFixed(2)} ({alert.severity} Zone)</strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#5C6B76]">ML Supporting Probability:</span>
                              <strong className="text-[#16232E]">{alert.ml_risk_probability.toFixed(2)}</strong>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-[#DDE3E8]">
                              <span className="text-[#5C6B76]">Model Agreement:</span>
                              <span className="font-semibold text-[#16232E] px-2 py-0.5 rounded bg-[#EDF0F2]">
                                {Math.abs(alert.composite_risk_score - alert.ml_risk_probability) > 0.15 ? 'Review Needed' : 'Consistent'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#5C6B76]">Urgency Tier:</span>
                              <span className="font-bold text-[#16232E]">{alert.recommended_urgency_tier}</span>
                            </div>
                          </div>
                        </div>

                        {/* Recommend Relocation Review Button (Links to Relocation Planning tab placeholder) */}
                        <div className="pt-2 border-t border-[#DDE3E8]">
                          <button
                            onClick={() => onNavigateTab('relocation')}
                            className="w-full py-2 px-3 rounded text-xs font-semibold bg-[#3D5A73] hover:bg-[#4E6F8C] active:bg-[#2D4559] text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Compass className="w-3.5 h-3.5" />
                            <span>Recommend relocation review</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Deterministic Explanation Template Display (Section 14) */}
                    <div className="bg-[#FFFFFF] p-3.5 rounded border border-[#DDE3E8]">
                      <span className="text-[10px] font-bold text-[#5C6B76] uppercase tracking-wider block mb-1">
                        Mandatory Section 14 Explanation Template
                      </span>
                      <p className="font-mono text-xs text-[#16232E] bg-[#EDF0F2]/50 p-2.5 rounded border border-[#DDE3E8] leading-relaxed">
                        {alert.message}
                      </p>
                    </div>

                    {/* Affected Habitations Location, Multi-Shelter & Logistics Intelligence */}
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#DDE3E8] pb-2">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#16232E]">
                            Operational Evacuation Logistics & Habitations ({alert.habitation_ids?.length || 1})
                          </h4>
                          <p className="text-[11px] text-[#5C6B76]">
                            Candidate safe havens comparison, humanitarian relief requisitions & highway transit schedule
                          </p>
                        </div>
                        <span className="text-[10px] text-[#3D5A73] font-semibold bg-[#3D5A73]/10 px-2 py-0.5 rounded shrink-0 self-start sm:self-center">
                          NDMA Operations Standard
                        </span>
                      </div>

                      <div className="space-y-4">
                        {(alert.habitation_ids || []).map((id) => (
                          <HabitationLogisticsCard
                            key={id}
                            habId={id}
                            alert={alert}
                            habitationsMap={habitationsMap}
                            onSelectHabitation={onSelectHabitation}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Resolved Alerts History / Audit Log Section */}
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#DDE3E8] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#3D5A73]" />
              <h2 className="text-sm font-bold text-[#16232E]">Alert Audit Trail & Resolved History</h2>
            </div>
            <p className="text-xs text-[#5C6B76] mt-0.5">
              Permanent audit log of cleared conditions and past interventions
            </p>
          </div>

          <input
            type="text"
            placeholder="Search audit trail..."
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            className="bg-[#EDF0F2] text-[#16232E] border border-[#DDE3E8] rounded px-3 py-1 text-xs w-full sm:w-60 focus:outline-none focus:border-[#3D5A73]"
          />
        </div>

        <div className="divide-y divide-[#DDE3E8]">
          {resolvedAlerts.length === 0 ? (
            <p className="text-xs text-[#5C6B76] py-4 text-center">No resolved historical alerts found.</p>
          ) : (
            resolvedAlerts.map((hist) => (
              <div key={hist.alert_id} className="py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#16232E]">{hist.alert_id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#3D5A73]/20 text-[#3D5A73]">
                      RESOLVED
                    </span>
                    <span className="text-[#5C6B76] capitalize">· {hist.district} · {hist.hazard_type?.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-xs text-[#5C6B76] mt-1">{hist.message}</p>
                </div>

                <div className="text-right shrink-0 text-[#5C6B76] text-[11px]">
                  <div>Issued: {hist.issued_at.slice(0, 10)}</div>
                  <div>Resolved: {hist.resolved_at ? hist.resolved_at.slice(0, 10) : 'De-escalated'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
