import React from 'react';
import {
  ShieldAlert,
  Building2,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  TrendingUp,
  Database,
  Play,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

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

export default function OverviewTab({
  stats,
  alerts,
  onNavigateTab,
  onSelectAlert,
  onTriggerJudgeDemo,
  isJudgeDemoLoading
}) {
  const activeAlerts = (alerts || []).filter(a => a.status === 'ACTIVE').slice(0, 5);

  const totalHabs = stats?.total_habitations || 153;
  const districtsCount = stats?.districts_monitored || 4;
  const popRed = (stats?.population_red_zone || 0).toLocaleString();
  const popOrange = (stats?.population_orange_zone || 0).toLocaleString();

  return (
    <div className="space-y-6">
      {/* Top Banner / Judge Demo Callout */}
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#3D5A73]/15 text-[#3D5A73]">
              Decision-Support System
            </span>
            <span className="text-xs text-[#5C6B76]">· State Disaster Management Authority</span>
          </div>
          <h1 className="text-xl font-bold text-[#16232E] mt-1">Multi-Hazard Risk Monitoring & Alert Operations</h1>
          <p className="text-xs text-[#5C6B76] mt-1 max-w-2xl leading-relaxed">
            Continuously evaluates hazard susceptibility, near-term forecast triggers, socio-physical vulnerability, and disaster history into calibrated habitation risk scores across pilot districts.
          </p>
        </div>

        <button
          onClick={onTriggerJudgeDemo}
          disabled={isJudgeDemoLoading}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded text-sm font-semibold bg-[#3D5A73] hover:bg-[#4E6F8C] active:bg-[#2D4559] text-white transition-colors cursor-pointer shadow-sm border border-[#3D5A73]"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isJudgeDemoLoading ? 'Running Demo Sequence...' : 'Launch Judge Demo Mode'}</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Habitations */}
        <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5C6B76]">Habitations Monitored</span>
            <Building2 className="w-4 h-4 text-[#3D5A73]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#16232E]">{totalHabs}</span>
            <span className="text-xs text-[#5C6B76]">across {districtsCount} pilot districts</span>
          </div>
          <p className="text-[11px] text-[#5C6B76] mt-2">Puri, Kendrapara, Ganjam, Kandhamal</p>
        </div>

        {/* Active Alerts */}
        <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5C6B76]">Active Alerts</span>
            <ShieldAlert className="w-4 h-4 text-[#3D5A73]" />
          </div>
          <div className="mt-2 flex items-center gap-2 font-medium">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#C13F3F] text-white">
              {stats?.active_alerts_red || 0} RED
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#D97A2E] text-white">
              {stats?.active_alerts_orange || 0} ORANGE
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#E0B33C] text-black">
              {stats?.active_alerts_yellow || 0} YELLOW
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('alerts')}
            className="text-[11px] font-semibold text-[#3D5A73] hover:underline mt-2 flex items-center gap-1 cursor-pointer"
          >
            <span>View all active alerts</span>
          </button>
        </div>

        {/* Population at Risk */}
        <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5C6B76]">Population in High Zones</span>
            <Users className="w-4 h-4 text-[#3D5A73]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#16232E]">{popRed}</span>
            <span className="text-xs text-[#5C6B76]">Red zone</span>
          </div>
          <p className="text-[11px] text-[#5C6B76] mt-2">
            Plus <strong className="text-[#16232E]">{popOrange}</strong> in Orange zone habitations
          </p>
        </div>

        {/* Operational Readiness */}
        <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5C6B76]">System Readiness</span>
            <CheckCircle className="w-4 h-4 text-[#3F8F5F]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-bold text-[#16232E]">Normal Operations</span>
          </div>
          <p className="text-[11px] text-[#5C6B76] mt-2">
            Logistic Regression model synchronized
          </p>
        </div>
      </div>

      {/* Two Column Grid: Mini Map Preview & Active Alert Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): Mini Live Map Preview */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#DDE3E8] rounded p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDE3E8]">
            <div>
              <h2 className="text-sm font-bold text-[#16232E]">Geographic Risk Preview</h2>
              <p className="text-xs text-[#5C6B76]">Habitations classified by 4-layer composite risk zone</p>
            </div>
            <button
              onClick={() => onNavigateTab('live_map')}
              className="text-xs font-semibold text-[#3D5A73] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Open full map</span>
            </button>
          </div>

          {/* Interactive Preview Canvas */}
          <div
            onClick={() => onNavigateTab('live_map')}
            className="mt-3 flex-1 min-h-[260px] bg-[#E2E7EA] rounded border border-[#DDE3E8] relative overflow-hidden flex items-center justify-center cursor-pointer group"
          >
            {/* Styled Map Background Grid */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#3D5A73_1px,transparent_1px)] [background-size:16px_16px]" />
            
            {/* Representation overlay of Odisha Coastal + Hill clusters */}
            <div className="relative z-10 text-center p-6 bg-white/90 backdrop-blur rounded border border-[#DDE3E8] shadow-md max-w-sm">
              <MapPin className="w-8 h-8 text-[#3D5A73] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#16232E]">153 Habitations Active on Map</p>
              <p className="text-xs text-[#5C6B76] mt-1">
                Puri Coast (Cyclone), Kendrapara (Flood), Ganjam (Surge), Kandhamal (Landslide)
              </p>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C13F3F]" /> Red
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D97A2E]" /> Orange
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E0B33C]" /> Yellow
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3F8F5F]" /> Green
                </span>
              </div>
              <span className="inline-block mt-3 px-3 py-1 bg-[#3D5A73] text-white rounded text-xs font-semibold group-hover:bg-[#4E6F8C] transition-colors">
                Launch Interactive Live Map
              </span>
            </div>
          </div>
        </div>

        {/* Right (5 cols): Active Alert Ticker */}
        <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#DDE3E8] rounded p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#DDE3E8]">
            <div>
              <h2 className="text-sm font-bold text-[#16232E]">Active Alert Ticker</h2>
              <p className="text-xs text-[#5C6B76]">Recent automated warning escalations</p>
            </div>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-xs font-semibold text-[#3D5A73] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View all alerts</span>
            </button>
          </div>

          <div className="mt-3 flex-1 divide-y divide-[#DDE3E8] overflow-y-auto max-h-[300px]">
            {activeAlerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#5C6B76]">
                No active critical alerts at this moment.
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  onClick={() => {
                    onSelectAlert(alert);
                    onNavigateTab('alerts');
                  }}
                  className={`py-3 px-3 hover:bg-[#EDF0F2]/60 cursor-pointer transition-colors ${SEVERITY_BORDER[alert.severity] || ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-[#16232E]">
                      {alert.alert_id}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${SEVERITY_BADGE[alert.severity]}`}>
                      {alert.severity}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-[#16232E] mt-1 capitalize">
                    {alert.hazard_type?.replace(/_/g, ' ')} Risk · {alert.district}
                  </p>

                  <p className="text-xs text-[#5C6B76] mt-0.5 line-clamp-2 leading-relaxed">
                    {alert.trigger_description || alert.message}
                  </p>

                  <div className="flex items-center justify-between mt-2 text-[11px] text-[#5C6B76]">
                    <span>Trend: <strong>{alert.trigger_trend}</strong></span>
                    <span className="font-semibold text-[#3D5A73]">{alert.recommended_urgency_tier}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Data Source Sync Status Cards */}
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#16232E]">Telemetry & Source Status</h2>
          <span className="text-xs text-[#5C6B76]">Static reference timestamps for hackathon prototype</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-3 bg-[#EDF0F2]/50 rounded border border-[#DDE3E8]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#16232E]">GSI Bhukosh</span>
              <span className="w-2 h-2 rounded-full bg-[#3F8F5F]" />
            </div>
            <p className="text-[11px] text-[#5C6B76] mt-1">Landslide Susceptibility Layers</p>
            <p className="text-[10px] text-[#16232E] font-mono mt-2">Synced: 04 Sep 2026, 06:00 UTC</p>
          </div>

          <div className="p-3 bg-[#EDF0F2]/50 rounded border border-[#DDE3E8]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#16232E]">IMD Forecast</span>
              <span className="w-2 h-2 rounded-full bg-[#3F8F5F]" />
            </div>
            <p className="text-[11px] text-[#5C6B76] mt-1">24h Rainfall & Cyclone Tracks</p>
            <p className="text-[10px] text-[#16232E] font-mono mt-2">Synced: 04 Sep 2026, 09:30 UTC</p>
          </div>

          <div className="p-3 bg-[#EDF0F2]/50 rounded border border-[#DDE3E8]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#16232E]">CWC River Gauges</span>
              <span className="w-2 h-2 rounded-full bg-[#3F8F5F]" />
            </div>
            <p className="text-[11px] text-[#5C6B76] mt-1">Baitarani & Brahmani Basins</p>
            <p className="text-[10px] text-[#16232E] font-mono mt-2">Synced: 04 Sep 2026, 10:15 UTC</p>
          </div>

          <div className="p-3 bg-[#EDF0F2]/50 rounded border border-[#DDE3E8]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#16232E]">BMTPC Atlas</span>
              <span className="w-2 h-2 rounded-full bg-[#3F8F5F]" />
            </div>
            <p className="text-[11px] text-[#5C6B76] mt-1">Housing Vulnerability & Kutcha %</p>
            <p className="text-[10px] text-[#16232E] font-mono mt-2">Synced: 01 Sep 2026, 00:00 UTC</p>
          </div>
        </div>
      </div>
    </div>
  );
}
