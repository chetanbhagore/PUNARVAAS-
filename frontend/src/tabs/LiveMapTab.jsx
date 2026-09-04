import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import { Filter, Layers, Info, MapPin } from 'lucide-react';
import HabitationDetail from '../components/HabitationDetail';

const ZONE_COLORS = {
  RED: '#C13F3F',
  ORANGE: '#D97A2E',
  YELLOW: '#E0B33C',
  GREEN: '#3F8F5F'
};

export default function LiveMapTab({
  habitations,
  selectedHabitation,
  onSelectHabitation,
  onCloseDetail,
  onNavigateTab
}) {
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [hazardFilter, setHazardFilter] = useState('ALL');
  const [zoneFilter, setZoneFilter] = useState('ALL');

  // Filter habitations based on selections
  const filteredHabitations = useMemo(() => {
    return (habitations || []).filter((h) => {
      if (districtFilter !== 'ALL' && h.district !== districtFilter) return false;
      if (hazardFilter !== 'ALL' && h.hazard_type !== hazardFilter) return false;
      if (zoneFilter !== 'ALL' && h.zone !== zoneFilter) return false;
      return true;
    });
  }, [habitations, districtFilter, hazardFilter, zoneFilter]);

  // Center of Odisha pilot districts (roughly between Puri, Kendrapara, Ganjam, Kandhamal)
  const mapCenter = [20.10, 85.30];

  return (
    <div className="relative h-[calc(100vh-95px)] flex flex-col rounded border border-[#DDE3E8] bg-white overflow-hidden shadow-sm">
      {/* Top Filter Bar */}
      <div className="p-3 bg-[#FFFFFF] border-b border-[#DDE3E8] z-10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center gap-1.5 font-bold text-[#16232E] mr-2">
            <Filter className="w-3.5 h-3.5 text-[#3D5A73]" />
            <span>Map Filters:</span>
          </div>

          {/* District Filter */}
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="bg-[#EDF0F2] text-[#16232E] border border-[#DDE3E8] rounded px-2.5 py-1.5 font-medium cursor-pointer focus:outline-none focus:border-[#3D5A73]"
          >
            <option value="ALL">All Districts</option>
            <option value="Puri">Puri (Coastal/Cyclone)</option>
            <option value="Kendrapara">Kendrapara (River Delta/Flood)</option>
            <option value="Ganjam">Ganjam (Coastal Surge)</option>
            <option value="Kandhamal">Kandhamal (Western Hills/Landslide)</option>
            <option value="Uttarkashi (Illustrative Demo)">Uttarkashi (Illustrative Cloudburst)</option>
          </select>

          {/* Hazard Type Filter */}
          <select
            value={hazardFilter}
            onChange={(e) => setHazardFilter(e.target.value)}
            className="bg-[#EDF0F2] text-[#16232E] border border-[#DDE3E8] rounded px-2.5 py-1.5 font-medium cursor-pointer focus:outline-none focus:border-[#3D5A73]"
          >
            <option value="ALL">All Hazard Types</option>
            <option value="cyclone_coastal">Cyclone & Coastal Surge</option>
            <option value="flood">River Basin Flood</option>
            <option value="landslide">Hill Tract Landslide</option>
            <option value="cloudburst">Cloudburst (Illustrative)</option>
          </select>

          {/* Zone Filter */}
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="bg-[#EDF0F2] text-[#16232E] border border-[#DDE3E8] rounded px-2.5 py-1.5 font-medium cursor-pointer focus:outline-none focus:border-[#3D5A73]"
          >
            <option value="ALL">All Severity Zones</option>
            <option value="RED">RED Zone (&gt;= 0.75)</option>
            <option value="ORANGE">ORANGE Zone (0.50 - 0.74)</option>
            <option value="YELLOW">YELLOW Zone (0.30 - 0.49)</option>
            <option value="GREEN">GREEN Zone (&lt; 0.30)</option>
          </select>
        </div>

        <div className="text-[#5C6B76] font-medium">
          Displaying: <strong className="text-[#16232E]">{filteredHabitations.length}</strong> habitations
        </div>
      </div>

      {/* Main Map Container */}
      <div className="flex-1 relative z-0">
        <MapContainer
          center={mapCenter}
          zoom={8}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          {/* CartoDB Positron clean map tiles (minimalist, ideal for emergency dashboard) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {filteredHabitations.map((hab) => {
            const color = ZONE_COLORS[hab.zone] || '#3D5A73';
            const isRed = hab.zone === 'RED';
            const isSelected = selectedHabitation?.habitation_id === hab.habitation_id;

            return (
              <CircleMarker
                key={hab.habitation_id}
                center={[hab.lat, hab.lon]}
                radius={isSelected ? 10 : isRed ? 8 : 6}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.85,
                  color: isSelected ? '#16232E' : '#FFFFFF',
                  weight: isSelected ? 3 : 1.5
                }}
                eventHandlers={{
                  click: () => onSelectHabitation(hab)
                }}
              >
                <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>
                  <div className="text-xs p-1">
                    <p className="font-bold text-[#16232E]">{hab.village}</p>
                    <p className="text-[#5C6B76]">
                      {hab.district} · {hab.hazard_type?.replace(/_/g, ' ')}
                    </p>
                    <p className="mt-1 font-semibold" style={{ color }}>
                      {hab.zone} Zone ({hab.composite_risk_score.toFixed(2)})
                    </p>
                  </div>
                </Tooltip>

                <Popup>
                  <div className="text-xs space-y-1 p-1">
                    <p className="font-bold text-[#16232E]">{hab.village}</p>
                    <p className="text-[#5C6B76]">{hab.district} · {hab.habitation_id}</p>
                    <p className="mt-1 text-[11px] leading-tight text-[#16232E]">
                      {hab.trigger_description}
                    </p>
                    <div className="pt-2 flex items-center justify-between">
                      <span className="font-bold" style={{ color }}>{hab.zone} Zone</span>
                      <button
                        onClick={() => onSelectHabitation(hab)}
                        className="px-2 py-1 rounded bg-[#3D5A73] text-white text-[10px] font-semibold cursor-pointer"
                      >
                        Inspect details
                      </button>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Corner Severity Legend (Strict rule: only severity colors used here) */}
        <div className="absolute bottom-6 right-6 z-20 bg-white/95 backdrop-blur p-3 rounded border border-[#DDE3E8] shadow-lg text-xs space-y-2 pointer-events-auto">
          <p className="font-bold text-[#16232E] text-[11px] uppercase tracking-wider">Severity Legend</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#C13F3F] border border-white shrink-0" />
              <span className="text-[#16232E] font-medium">Red Zone (&ge; 0.75) · Immediate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#D97A2E] border border-white shrink-0" />
              <span className="text-[#16232E] font-medium">Orange Zone (0.50 - 0.74) · Short-Term</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#E0B33C] border border-white shrink-0" />
              <span className="text-[#16232E] font-medium">Yellow Zone (0.30 - 0.49) · Medium-Term</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#3F8F5F] border border-white shrink-0" />
              <span className="text-[#16232E] font-medium">Green Zone (&lt; 0.30) · Monitor</span>
            </div>
          </div>
          <p className="text-[10px] text-[#5C6B76] pt-1 border-t border-[#DDE3E8]">
            Click any marker to open 4-layer decision panel
          </p>
        </div>
      </div>

      {/* Side Detail Panel */}
      {selectedHabitation && (
        <HabitationDetail
          habitation={selectedHabitation}
          onClose={onCloseDetail}
          onNavigateToRelocation={() => onNavigateTab('relocation')}
        />
      )}
    </div>
  );
}
