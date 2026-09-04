import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, Polyline } from 'react-leaflet';
import { Filter, Layers, Info, MapPin, Building2, Navigation, ShieldCheck } from 'lucide-react';
import HabitationDetail from '../components/HabitationDetail';
import { fetchRelocationPlan } from '../api';

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

  // GIS Evacuation Corridor Controls
  const [showCorridors, setShowCorridors] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [corridorTier, setCorridorTier] = useState('ALL');
  const [relocationPlan, setRelocationPlan] = useState(null);
  const [selectedAllocationId, setSelectedAllocationId] = useState(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);

  // Load Relocation Telemetry on Mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingPlan(true);
    fetchRelocationPlan()
      .then((data) => {
        if (isMounted) {
          setRelocationPlan(data);
          setIsLoadingPlan(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching relocation plan in LiveMapTab:', err);
        if (isMounted) setIsLoadingPlan(false);
      });
    return () => { isMounted = false; };
  }, []);

  // Filter habitations based on selections
  const filteredHabitations = useMemo(() => {
    return (habitations || []).filter((h) => {
      if (districtFilter !== 'ALL' && h.district !== districtFilter) return false;
      if (hazardFilter !== 'ALL' && h.hazard_type !== hazardFilter) return false;
      if (zoneFilter !== 'ALL' && h.zone !== zoneFilter) return false;
      return true;
    });
  }, [habitations, districtFilter, hazardFilter, zoneFilter]);

  // Index habitations by ID for O(1) coordinate lookups
  const habMap = useMemo(() => {
    const map = {};
    (habitations || []).forEach((h) => {
      map[h.habitation_id] = h;
    });
    return map;
  }, [habitations]);

  // Index safe sites by ID for O(1) coordinate lookups
  const siteMap = useMemo(() => {
    const map = {};
    (relocationPlan?.safe_sites || []).forEach((s) => {
      map[s.site_id] = s;
    });
    return map;
  }, [relocationPlan]);

  // Filtered Evacuation Allocations
  const filteredAllocations = useMemo(() => {
    if (!showCorridors || !relocationPlan?.allocations) return [];
    return relocationPlan.allocations.filter((alloc) => {
      if (corridorTier !== 'ALL' && alloc.urgency_tier !== corridorTier) return false;
      if (districtFilter !== 'ALL' && alloc.district !== districtFilter && alloc.shelter_district !== districtFilter) return false;
      return true;
    });
  }, [showCorridors, relocationPlan, corridorTier, districtFilter]);

  // Filtered Safe Shelters
  const filteredSafeSites = useMemo(() => {
    if (!showShelters || !relocationPlan?.safe_sites) return [];
    return relocationPlan.safe_sites.filter((s) => {
      if (districtFilter !== 'ALL' && s.district !== districtFilter) return false;
      return true;
    });
  }, [showShelters, relocationPlan, districtFilter]);

  // Center of Odisha pilot districts (roughly between Puri, Kendrapara, Ganjam, Kandhamal)
  const mapCenter = [20.10, 85.30];

  return (
    <div className="relative h-[calc(100vh-95px)] flex flex-col rounded border border-[#DDE3E8] bg-white overflow-hidden shadow-sm">
      {/* Top Filter & GIS Control Bar */}
      <div className="p-3 bg-[#FFFFFF] border-b border-[#DDE3E8] z-10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center gap-1.5 font-bold text-[#16232E] mr-1">
            <Filter className="w-3.5 h-3.5 text-[#3D5A73]" />
            <span>Map Layers:</span>
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

          {/* Evacuation Corridors Layer Toggle */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-[#DDE3E8]">
            <button
              type="button"
              onClick={() => setShowCorridors(!showCorridors)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded font-semibold cursor-pointer transition-colors border ${
                showCorridors
                  ? 'bg-[#16232E] text-white border-[#16232E]'
                  : 'bg-[#EDF0F2] text-[#5C6B76] border-[#DDE3E8] hover:text-[#16232E]'
              }`}
              title="Toggle dynamic evacuation vectors linking habitations to safe shelters"
            >
              <Navigation className="w-3.5 h-3.5 text-[#E0B33C]" />
              <span>Evac Corridors</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${showCorridors ? 'bg-white/20 text-white' : 'bg-[#DDE3E8] text-[#5C6B76]'}`}>
                {filteredAllocations.length}
              </span>
            </button>

            {showCorridors && (
              <select
                value={corridorTier}
                onChange={(e) => setCorridorTier(e.target.value)}
                className="bg-[#EDF0F2] text-[#16232E] border border-[#DDE3E8] rounded px-2 py-1.5 font-medium cursor-pointer focus:outline-none focus:border-[#3D5A73]"
              >
                <option value="ALL">All Urgencies (Immediate + Short-Term)</option>
                <option value="IMMEDIATE">Immediate Evacuation Only</option>
                <option value="SHORT_TERM">Short-Term Only</option>
              </select>
            )}

            {/* Safe Shelters Toggle */}
            <button
              type="button"
              onClick={() => setShowShelters(!showShelters)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded font-semibold cursor-pointer transition-colors border ${
                showShelters
                  ? 'bg-[#3D5A73] text-white border-[#3D5A73]'
                  : 'bg-[#EDF0F2] text-[#5C6B76] border-[#DDE3E8] hover:text-[#16232E]'
              }`}
              title="Toggle certified multipurpose disaster shelters layer"
            >
              <Building2 className="w-3.5 h-3.5 text-[#3F8F5F]" />
              <span>Shelters</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${showShelters ? 'bg-white/20 text-white' : 'bg-[#DDE3E8] text-[#5C6B76]'}`}>
                {filteredSafeSites.length}
              </span>
            </button>
          </div>
        </div>

        <div className="text-[#5C6B76] font-medium flex items-center gap-3">
          <span>Habitations: <strong className="text-[#16232E]">{filteredHabitations.length}</strong></span>
          {showCorridors && (
            <span>Vectors: <strong className="text-[#16232E]">{filteredAllocations.length}</strong></span>
          )}
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

          {/* 1. Dynamic GIS Evacuation Polyline Corridors */}
          {filteredAllocations.map((alloc) => {
            const hab = habMap[alloc.habitation_id];
            const site = siteMap[alloc.safe_site_id];
            if (!hab || !site || !hab.lat || !site.lat) return null;

            const isImmediate = alloc.urgency_tier === 'IMMEDIATE';
            const isHabSelected = selectedHabitation?.habitation_id === alloc.habitation_id;
            const isAllocSelected = selectedAllocationId === alloc.allocation_id;
            const isHighlighted = isHabSelected || isAllocSelected;

            const lineColor = isImmediate ? '#C13F3F' : '#D97A2E';
            const lineWeight = isHighlighted ? 5 : isImmediate ? 3.5 : 2.5;
            const lineOpacity = isHighlighted ? 1.0 : isImmediate ? 0.85 : 0.70;
            const dashPattern = isImmediate ? undefined : '6, 6';

            return (
              <Polyline
                key={alloc.allocation_id}
                positions={[
                  [hab.lat, hab.lon],
                  [site.lat, site.lon]
                ]}
                pathOptions={{
                  color: lineColor,
                  weight: lineWeight,
                  opacity: lineOpacity,
                  dashArray: dashPattern
                }}
                eventHandlers={{
                  click: () => {
                    setSelectedAllocationId(alloc.allocation_id);
                    onSelectHabitation(hab);
                  }
                }}
              >
                <Tooltip direction="top" opacity={0.95}>
                  <div className="text-xs p-1">
                    <p className="font-bold text-[#16232E]">
                      Evacuation Vector: {alloc.village} &rarr; {alloc.safe_site_name}
                    </p>
                    <p className="text-[#5C6B76]">
                      Tier: <strong className={isImmediate ? 'text-[#C13F3F]' : 'text-[#D97A2E]'}>{alloc.urgency_tier}</strong> · {alloc.allocated_count.toLocaleString()} evacuees
                    </p>
                    <p className="text-[10px] text-[#3D5A73] mt-0.5">
                      Suitability: {alloc.suitability_score.toFixed(3)} {alloc.is_inter_district ? '(Inter-District)' : '(Intra-District)'}
                    </p>
                  </div>
                </Tooltip>

                <Popup>
                  <div className="text-xs space-y-2 p-1 min-w-[240px]">
                    <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${isImmediate ? 'bg-[#C13F3F]' : 'bg-[#D97A2E]'}`}>
                        {alloc.urgency_tier} EVACUATION
                      </span>
                      <span className="text-[10px] font-mono text-[#5C6B76]">{alloc.allocation_id}</span>
                    </div>

                    <div>
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#C13F3F] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-[#5C6B76] uppercase tracking-wider font-semibold">Origin Habitation</p>
                          <p className="font-bold text-[#16232E]">{alloc.village}</p>
                          <p className="text-[11px] text-[#5C6B76]">{alloc.district} District · Pop: {hab.population?.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="my-1.5 border-l-2 border-dashed border-[#DDE3E8] ml-2 pl-3 py-1">
                        <div className="text-[11px] font-bold text-[#16232E] flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-[#E0B33C]" />
                          <span>{alloc.allocated_count.toLocaleString()} People Dispatched</span>
                        </div>
                        <p className="text-[10px] text-[#5C6B76]">
                          Suitability Index: <strong>{alloc.suitability_score.toFixed(3)}</strong>
                          {alloc.is_inter_district && ' · Inter-District Fallback'}
                        </p>
                      </div>

                      <div className="flex items-start gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#3F8F5F] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-[#5C6B76] uppercase tracking-wider font-semibold">Destination Safe Shelter</p>
                          <p className="font-bold text-[#16232E]">{alloc.safe_site_name}</p>
                          <p className="text-[11px] text-[#5C6B76]">{alloc.shelter_district} · Capacity: {site.usable_capacity?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-[#16232E]/80 bg-[#EDF0F2] p-1.5 rounded leading-relaxed border border-[#DDE3E8]">
                      {alloc.explanation}
                    </p>

                    <div className="pt-1 flex items-center justify-between">
                      <button
                        onClick={() => onSelectHabitation(hab)}
                        className="px-2.5 py-1 rounded bg-[#16232E] text-white text-[10px] font-semibold hover:bg-[#3D5A73] transition-colors cursor-pointer"
                      >
                        Inspect Settlement Risk
                      </button>
                      <button
                        onClick={() => onNavigateTab('relocation')}
                        className="text-[#3D5A73] hover:underline text-[10px] font-medium"
                      >
                        View Relocation Roster &rarr;
                      </button>
                    </div>
                  </div>
                </Popup>
              </Polyline>
            );
          })}

          {/* 2. Certified Multipurpose Safe Shelters Layer */}
          {filteredSafeSites.map((site) => {
            const isFullyUtilized = site.utilization_pct >= 100;

            return (
              <React.Fragment key={`shelter-${site.site_id}`}>
                {/* Outer Shelter Circle Marker */}
                <CircleMarker
                  center={[site.lat, site.lon]}
                  radius={10}
                  pathOptions={{
                    fillColor: isFullyUtilized ? '#C13F3F' : '#3F8F5F',
                    fillOpacity: 0.92,
                    color: '#16232E',
                    weight: 2.5
                  }}
                >
                  <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                    <div className="text-xs p-1">
                      <p className="font-bold text-[#16232E] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#3F8F5F]" />
                        {site.name}
                      </p>
                      <p className="text-[#5C6B76]">{site.district} · Usable Capacity: {site.usable_capacity?.toLocaleString()}</p>
                      <p className="mt-0.5 font-semibold text-[#16232E]">
                        Allocated: {site.allocated_total?.toLocaleString()} ({site.utilization_pct}%) · Headroom: {site.remaining_capacity?.toLocaleString()}
                      </p>
                    </div>
                  </Tooltip>

                  <Popup>
                    <div className="text-xs space-y-2 p-1 min-w-[250px]">
                      <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-[#3F8F5F]" />
                          <span className="font-bold text-[#16232E]">{site.name}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#3D5A73] text-white">
                          SHELTER
                        </span>
                      </div>

                      <div>
                        <p className="text-[11px] text-[#5C6B76]">{site.district} Jurisdiction · {site.notes}</p>
                        
                        <div className="mt-2 space-y-1 bg-[#EDF0F2] p-2 rounded border border-[#DDE3E8]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#5C6B76]">Capacity Utilization:</span>
                            <span className="font-bold text-[#16232E]">{site.allocated_total?.toLocaleString()} / {site.usable_capacity?.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-[#DDE3E8] h-2 rounded overflow-hidden">
                            <div
                              className={`h-full rounded transition-all ${
                                site.utilization_pct >= 90 ? 'bg-[#C13F3F]' : site.utilization_pct >= 70 ? 'bg-[#D97A2E]' : 'bg-[#3F8F5F]'
                              }`}
                              style={{ width: `${Math.min(100, site.utilization_pct)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-[#5C6B76] pt-0.5">
                            <span>{site.utilization_pct}% Occupied</span>
                            <span>{site.remaining_capacity?.toLocaleString()} Headroom</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 mt-2 text-center text-[10px]">
                          <div className="bg-white p-1 rounded border border-[#DDE3E8]">
                            <p className="text-[#5C6B76]">Road Access</p>
                            <p className="font-bold text-[#16232E]">{site.access_score}/10</p>
                          </div>
                          <div className="bg-white p-1 rounded border border-[#DDE3E8]">
                            <p className="text-[#5C6B76]">Infra Ready</p>
                            <p className="font-bold text-[#16232E]">{site.infrastructure_score}/10</p>
                          </div>
                          <div className="bg-white p-1 rounded border border-[#DDE3E8]">
                            <p className="text-[#5C6B76]">Sec. Risk</p>
                            <p className="font-bold text-[#3F8F5F]">{site.secondary_risk_score} (Safe)</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-1">
                        <button
                          onClick={() => onNavigateTab('relocation')}
                          className="w-full py-1 rounded bg-[#3D5A73] hover:bg-[#16232E] text-white text-[10px] font-semibold transition-colors cursor-pointer text-center block"
                        >
                          View In Relocation Decision Tab
                        </button>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>

                {/* Inner Shelter Dot for Distinct Center Symbol */}
                <CircleMarker
                  center={[site.lat, site.lon]}
                  radius={3.5}
                  pathOptions={{
                    fillColor: '#FFFFFF',
                    fillOpacity: 1.0,
                    color: '#16232E',
                    weight: 1
                  }}
                  interactive={false}
                />
              </React.Fragment>
            );
          })}

          {/* 3. Habitations Markers */}
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

        {/* Bottom Right Map Legend */}
        <div className="absolute bottom-6 right-6 z-20 bg-white/95 backdrop-blur p-3 rounded border border-[#DDE3E8] shadow-lg text-xs space-y-2 pointer-events-auto max-w-[260px]">
          <p className="font-bold text-[#16232E] text-[11px] uppercase tracking-wider">Map GIS Legend</p>
          
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

            {/* Shelter & Vector Legends */}
            <div className="pt-1.5 border-t border-[#DDE3E8] space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#3F8F5F] border-2 border-[#16232E] shrink-0" />
                <span className="text-[#16232E] font-medium">Certified Safe Shelter</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-[#C13F3F] shrink-0" />
                <span className="text-[#16232E] font-medium">Immediate Evacuation Vector</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 border-t-2 border-dashed border-[#D97A2E] shrink-0" />
                <span className="text-[#16232E] font-medium">Short-Term Relocation Vector</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-[#5C6B76] pt-1 border-t border-[#DDE3E8]">
            Click any vector or marker to inspect decision audit trail
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
