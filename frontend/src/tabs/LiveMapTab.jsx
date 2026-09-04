import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, Polyline } from 'react-leaflet';
import {
  Filter,
  Layers,
  Info,
  MapPin,
  Building2,
  Navigation,
  ShieldCheck,
  ShieldAlert,
  Truck,
  Users,
  Compass,
  ArrowRight,
  Droplets,
  Utensils,
  Clock,
  Sparkles,
  Eye,
  CheckCircle2,
  X
} from 'lucide-react';
import HabitationDetail from '../components/HabitationDetail';
import { fetchRelocationPlan, fetchSafeSites } from '../api';

const ZONE_COLORS = {
  RED: '#C13F3F',
  ORANGE: '#D97A2E',
  YELLOW: '#E0B33C',
  GREEN: '#3F8F5F'
};

const BASEMAP_PROVIDERS = {
  osm: {
    name: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  topo: {
    name: 'OpenTopoMap (Topographic)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
  },
  humanitarian: {
    name: 'Humanitarian OSM (HOT)',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by Humanitarian OpenStreetMap Team'
  }
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
  const [baseMap, setBaseMap] = useState('humanitarian');

  // GIS Evacuation Corridor Controls
  const [showCorridors, setShowCorridors] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showHabitations, setShowHabitations] = useState(true);
  const [corridorTier, setCorridorTier] = useState('ALL');
  const [relocationPlan, setRelocationPlan] = useState(null);
  const [rawSafeSites, setRawSafeSites] = useState([]);
  const [selectedAllocationId, setSelectedAllocationId] = useState(null);
  const [hoveredAllocationId, setHoveredAllocationId] = useState(null);
  const [highlightedShelterId, setHighlightedShelterId] = useState(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);

  // Load Relocation Telemetry on Mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingPlan(true);

    Promise.all([
      fetchRelocationPlan().catch((err) => {
        console.error('Error fetching relocation plan in LiveMapTab:', err);
        return null;
      }),
      fetchSafeSites().catch((err) => {
        console.error('Error fetching safe sites in LiveMapTab:', err);
        return [];
      })
    ]).then(([planData, sitesData]) => {
      if (isMounted) {
        if (planData) setRelocationPlan(planData);
        if (sitesData) setRawSafeSites(sitesData);
        setIsLoadingPlan(false);
      }
    });

    return () => {
      isMounted = false;
    };
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

  // Combined safe sites list (prefer enriched ranked_sites from relocationPlan, fallback to rawSafeSites)
  const safeSitesList = useMemo(() => {
    const planSites = relocationPlan?.safe_sites || relocationPlan?.ranked_sites || [];
    if (planSites.length > 0) {
      // Ensure coordinates are present
      return planSites.map((ps) => {
        const raw = rawSafeSites.find((r) => r.site_id === ps.site_id);
        return {
          ...ps,
          lat: ps.lat || raw?.lat,
          lon: ps.lon || raw?.lon,
          usable_capacity: ps.usable_capacity || raw?.usable_capacity || raw?.capacity_persons || 2000,
          shelter_type: ps.shelter_type || raw?.shelter_type || 'Cyclone Shelter',
          notes: ps.notes || raw?.notes || ''
        };
      });
    }
    return rawSafeSites;
  }, [relocationPlan, rawSafeSites]);

  // Index safe sites by ID for O(1) coordinate lookups
  const siteMap = useMemo(() => {
    const map = {};
    safeSitesList.forEach((s) => {
      map[s.site_id] = s;
    });
    return map;
  }, [safeSitesList]);

  // Filtered Evacuation Allocations
  const filteredAllocations = useMemo(() => {
    if (!showCorridors || !relocationPlan?.allocations) return [];
    return relocationPlan.allocations.filter((alloc) => {
      if (corridorTier !== 'ALL' && alloc.urgency_tier !== corridorTier) return false;
      if (
        districtFilter !== 'ALL' &&
        alloc.district !== districtFilter &&
        alloc.shelter_district !== districtFilter &&
        alloc.site_district !== districtFilter
      ) {
        return false;
      }
      if (highlightedShelterId && (alloc.site_id !== highlightedShelterId && alloc.safe_site_id !== highlightedShelterId)) {
        return false;
      }
      return true;
    });
  }, [showCorridors, relocationPlan, corridorTier, districtFilter, highlightedShelterId]);

  // Filtered Safe Shelters
  const filteredSafeSites = useMemo(() => {
    if (!showShelters) return [];
    return safeSitesList.filter((s) => {
      if (districtFilter !== 'ALL' && s.district !== districtFilter) return false;
      return true;
    });
  }, [showShelters, safeSitesList, districtFilter]);

  // Find active allocation for the currently selected habitation
  const activeAllocation = useMemo(() => {
    if (!selectedHabitation || !relocationPlan?.allocations) return null;
    return (
      relocationPlan.allocations.find(
        (a) => a.habitation_id === selectedHabitation.habitation_id
      ) || null
    );
  }, [selectedHabitation, relocationPlan]);

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
            <option value="Uttarkashi (Illustrative Demo)">Uttarkashi (Illustrative Demo)</option>
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
              <span>Evacuation Routes</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  showCorridors ? 'bg-white/20 text-white' : 'bg-[#DDE3E8] text-[#5C6B76]'
                }`}
              >
                {filteredAllocations.length}
              </span>
            </button>

            {showCorridors && (
              <select
                value={corridorTier}
                onChange={(e) => setCorridorTier(e.target.value)}
                className="bg-[#EDF0F2] text-[#16232E] border border-[#DDE3E8] rounded px-2 py-1.5 font-medium cursor-pointer focus:outline-none focus:border-[#3D5A73]"
              >
                <option value="ALL">All Urgencies</option>
                <option value="IMMEDIATE">Immediate Only</option>
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
              <span>Safe Shelters</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  showShelters ? 'bg-white/20 text-white' : 'bg-[#DDE3E8] text-[#5C6B76]'
                }`}
              >
                {filteredSafeSites.length}
              </span>
            </button>

            {/* Base Map Selector */}
            <select
              value={baseMap}
              onChange={(e) => setBaseMap(e.target.value)}
              className="bg-[#EDF0F2] text-[#16232E] border border-[#DDE3E8] rounded px-2 py-1.5 font-medium cursor-pointer focus:outline-none focus:border-[#3D5A73]"
              title="Select Base Map Provider"
            >
              <option value="humanitarian">Humanitarian Map</option>
              <option value="osm">Standard OSM</option>
              <option value="topo">Topographic Map</option>
            </select>
          </div>
        </div>

        {/* Live Counters */}
        <div className="text-[#5C6B76] font-medium flex items-center gap-3">
          {highlightedShelterId && (
            <button
              onClick={() => setHighlightedShelterId(null)}
              className="px-2 py-1 rounded bg-[#E0B33C]/20 text-[#16232E] text-[10px] font-bold border border-[#E0B33C] flex items-center gap-1 hover:bg-[#E0B33C]/30 cursor-pointer"
            >
              <span>Filtering by Shelter</span>
              <X className="w-3 h-3" />
            </button>
          )}
          <span>
            Habitations: <strong className="text-[#16232E]">{filteredHabitations.length}</strong>
          </span>
          {showCorridors && (
            <span>
              Evac Routes: <strong className="text-[#16232E]">{filteredAllocations.length}</strong>
            </span>
          )}
          {showShelters && (
            <span>
              Shelters: <strong className="text-[#3F8F5F] font-bold">{filteredSafeSites.length}</strong>
            </span>
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
          {/* Base Map TileLayer */}
          <TileLayer
            key={baseMap}
            attribution={BASEMAP_PROVIDERS[baseMap]?.attribution || BASEMAP_PROVIDERS.humanitarian.attribution}
            url={BASEMAP_PROVIDERS[baseMap]?.url || BASEMAP_PROVIDERS.humanitarian.url}
          />

          {/* 1. Dynamic GIS Evacuation Polyline Corridors */}
          {filteredAllocations.map((alloc) => {
            const hab = habMap[alloc.habitation_id];
            const siteId = alloc.site_id || alloc.safe_site_id;
            const site = siteMap[siteId];
            if (!hab || !site || !hab.lat || !site.lat) return null;

            const isImmediate = alloc.urgency_tier === 'IMMEDIATE';
            const isHabSelected = selectedHabitation?.habitation_id === alloc.habitation_id;
            const isAllocSelected = selectedAllocationId === alloc.allocation_id;
            const isHovered = hoveredAllocationId === alloc.allocation_id;
            const isHighlighted = isHabSelected || isAllocSelected || isHovered;

            // Visual corridor styling
            const lineColor = isHighlighted ? '#E0B33C' : isImmediate ? '#C13F3F' : '#D97A2E';
            const lineWeight = isHighlighted ? 6 : isImmediate ? 3.5 : 2.5;
            const lineOpacity = isHighlighted ? 1.0 : isImmediate ? 0.85 : 0.70;
            const dashPattern = isImmediate ? '8, 8' : '6, 6';
            const className = isHighlighted
              ? 'evac-corridor-highlighted'
              : isImmediate
              ? 'evac-corridor-immediate'
              : 'evac-corridor-shortterm';

            const busCount =
              alloc.transit_logistics?.bus_convoy_fleet ||
              Math.max(1, Math.ceil((alloc.allocated_headcount || alloc.allocated_count || 500) / 50));
            const odrafCount =
              alloc.transit_logistics?.odraf_escort_vehicles ||
              Math.max(1, Math.ceil((alloc.allocated_headcount || alloc.allocated_count || 500) / 150)) + 1;

            return (
              <React.Fragment key={alloc.allocation_id}>
                {/* Glow underlay when highlighted */}
                {isHighlighted && (
                  <Polyline
                    positions={[
                      [hab.lat, hab.lon],
                      [site.lat, site.lon]
                    ]}
                    pathOptions={{
                      color: '#E0B33C',
                      weight: 12,
                      opacity: 0.45,
                      lineCap: 'round',
                      lineJoin: 'round'
                    }}
                    interactive={false}
                  />
                )}

                <Polyline
                  positions={[
                    [hab.lat, hab.lon],
                    [site.lat, site.lon]
                  ]}
                  pathOptions={{
                    color: lineColor,
                    weight: lineWeight,
                    opacity: lineOpacity,
                    dashArray: isHighlighted ? '10, 6' : dashPattern,
                    className: className
                  }}
                  eventHandlers={{
                    mouseover: () => setHoveredAllocationId(alloc.allocation_id),
                    mouseout: () => setHoveredAllocationId(null),
                    click: () => {
                      setSelectedAllocationId(alloc.allocation_id);
                      onSelectHabitation(hab);
                    }
                  }}
                >
                  <Tooltip direction="top" opacity={0.98} sticky>
                    <div className="text-xs p-1 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-white border-b border-white/20 pb-1">
                        <Navigation className="w-3.5 h-3.5 text-[#E0B33C]" />
                        <span>
                          {alloc.village} &rarr; {alloc.safe_site_name || alloc.site_name}
                        </span>
                      </div>
                      <div className="text-[11px] text-white/90 grid grid-cols-2 gap-2">
                        <div>
                          Tier:{' '}
                          <strong className={isImmediate ? 'text-[#FF8A8A]' : 'text-[#FFD180]'}>
                            {alloc.urgency_tier}
                          </strong>
                        </div>
                        <div>
                          Evacuees:{' '}
                          <strong>{(alloc.allocated_headcount || alloc.allocated_count || 0).toLocaleString()}</strong>
                        </div>
                        <div>
                          Distance: <strong>{alloc.distance_km || 15} km</strong>
                        </div>
                        <div>
                          Fleet: <strong>{busCount} Buses + {odrafCount} Escorts</strong>
                        </div>
                      </div>
                      <div className="text-[10px] text-[#80D8FF] pt-0.5">
                        Route: {alloc.transit_logistics?.primary_evacuation_route || 'All-Weather Highway'}
                      </div>
                    </div>
                  </Tooltip>

                  <Popup>
                    <div className="text-xs space-y-2.5 p-1 min-w-[270px]">
                      <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                            isImmediate ? 'bg-[#C13F3F]' : 'bg-[#D97A2E]'
                          }`}
                        >
                          {alloc.urgency_tier} EVACUATION ROUTE
                        </span>
                        <span className="text-[10px] font-mono text-[#5C6B76]">{alloc.allocation_id}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-start gap-2 bg-[#EDF0F2]/50 p-2 rounded border border-[#DDE3E8]">
                          <MapPin className="w-4 h-4 text-[#C13F3F] shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] text-[#5C6B76] uppercase tracking-wider font-semibold">
                              Origin Settlement (Risk: {alloc.composite_risk_score?.toFixed(2)})
                            </p>
                            <p className="font-bold text-[#16232E] text-xs">{alloc.village}</p>
                            <p className="text-[11px] text-[#5C6B76]">
                              {alloc.district} District · Total Pop: {hab.population?.total?.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 bg-[#3F8F5F]/10 p-2 rounded border border-[#3F8F5F]/30">
                          <Building2 className="w-4 h-4 text-[#3F8F5F] shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] text-[#3F8F5F] uppercase tracking-wider font-semibold">
                              Designated Safe Haven
                            </p>
                            <p className="font-bold text-[#16232E] text-xs">
                              {alloc.safe_site_name || alloc.site_name}
                            </p>
                            <p className="text-[11px] text-[#5C6B76]">
                              {alloc.site_district || alloc.shelter_district} · Capacity:{' '}
                              {site.usable_capacity?.toLocaleString()} persons
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Convoy Telemetry */}
                      <div className="bg-[#EDF0F2] p-2 rounded border border-[#DDE3E8] space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[#5C6B76]">Corridor Distance:</span>
                          <strong className="text-[#16232E]">{alloc.distance_km || 18.5} km</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#5C6B76]">Evacuee Headcount:</span>
                          <strong className="text-[#16232E]">
                            {(alloc.allocated_headcount || alloc.allocated_count || 0).toLocaleString()} Persons
                          </strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#5C6B76]">Transport Fleet:</span>
                          <strong className="text-[#16232E]">
                            {busCount} State Buses + {odrafCount} ODRAF Jeeps
                          </strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#5C6B76]">Suitability Index:</span>
                          <strong className="text-[#3D5A73]">
                            {(alloc.suitability_score || alloc.site_score || 0.85).toFixed(3)} / 1.000
                          </strong>
                        </div>
                      </div>

                      <p className="text-[10px] text-[#16232E]/80 bg-[#FFFFFF] p-2 rounded leading-relaxed border border-[#DDE3E8]">
                        {alloc.explanation}
                      </p>

                      <div className="pt-1 flex items-center justify-between gap-2">
                        <button
                          onClick={() => onSelectHabitation(hab)}
                          className="flex-1 py-1.5 rounded bg-[#16232E] hover:bg-[#3D5A73] text-white text-[10px] font-semibold transition-colors cursor-pointer text-center"
                        >
                          Inspect Habitation Details
                        </button>
                        <button
                          onClick={() => onNavigateTab('relocation')}
                          className="py-1.5 px-2 rounded bg-[#EDF0F2] hover:bg-[#DDE3E8] text-[#3D5A73] text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          Relocation Roster &rarr;
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Polyline>
              </React.Fragment>
            );
          })}

          {/* 2. Certified Multipurpose Safe Shelters Layer */}
          {filteredSafeSites.map((site) => {
            if (!site.lat || !site.lon) return null;

            const isFullyUtilized = (site.utilization_pct || 0) >= 95;
            const isNearCapacity = (site.utilization_pct || 0) >= 70;
            const isHighlighted = highlightedShelterId === site.site_id;

            const shelterBorderColor = isFullyUtilized
              ? '#C13F3F'
              : isNearCapacity
              ? '#D97A2E'
              : '#3F8F5F';

            const allocatedCount = site.allocated_total || site.allocated_population || 0;
            const usableCap = site.usable_capacity || site.capacity_persons || 2000;
            const remainingCap = site.remaining_capacity !== undefined ? site.remaining_capacity : Math.max(0, usableCap - allocatedCount);
            const utilPct = site.utilization_pct !== undefined ? site.utilization_pct : Math.round((allocatedCount / usableCap) * 100);

            return (
              <React.Fragment key={`shelter-${site.site_id}`}>
                {/* Pulsing Beacon Halo Ring */}
                <CircleMarker
                  center={[site.lat, site.lon]}
                  radius={isHighlighted ? 22 : 16}
                  pathOptions={{
                    fillColor: shelterBorderColor,
                    fillOpacity: isHighlighted ? 0.35 : 0.18,
                    color: shelterBorderColor,
                    weight: 1.5,
                    dashArray: '3, 3'
                  }}
                  interactive={false}
                />

                {/* Primary Solid Shelter Circle Marker */}
                <CircleMarker
                  center={[site.lat, site.lon]}
                  radius={isHighlighted ? 12 : 10}
                  pathOptions={{
                    fillColor: isHighlighted ? '#E0B33C' : shelterBorderColor,
                    fillOpacity: 0.95,
                    color: '#FFFFFF',
                    weight: 2.5
                  }}
                  eventHandlers={{
                    click: () => {
                      setHighlightedShelterId(site.site_id);
                    }
                  }}
                >
                  <Tooltip direction="top" offset={[0, -8]} opacity={0.98}>
                    <div className="text-xs p-1 space-y-1">
                      <p className="font-bold text-white flex items-center gap-1.5 border-b border-white/20 pb-1">
                        <Building2 className="w-3.5 h-3.5 text-[#80D8FF]" />
                        <span>{site.name}</span>
                      </p>
                      <p className="text-[11px] text-white/90">
                        {site.district} · {site.shelter_type || 'Cyclone Shelter'}
                      </p>
                      <div className="pt-1 text-[11px]">
                        <span className="text-white/80">Capacity: </span>
                        <strong className="text-white">
                          {allocatedCount.toLocaleString()} / {usableCap.toLocaleString()} ({utilPct}%)
                        </strong>
                      </div>
                      <div className="text-[10px] text-[#A7FFEB]">
                        Headroom: {remainingCap.toLocaleString()} persons available
                      </div>
                    </div>
                  </Tooltip>

                  <Popup>
                    <div className="text-xs space-y-2.5 p-1 min-w-[270px]">
                      <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-[#3F8F5F]" />
                          <span className="font-bold text-[#16232E] text-xs">{site.name}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#3D5A73] text-white">
                          {site.shelter_type || 'SAFE HAVEN'}
                        </span>
                      </div>

                      <div>
                        <p className="text-[11px] text-[#5C6B76]">{site.district} District · {site.notes}</p>

                        {/* Capacity Meter */}
                        <div className="mt-2 space-y-1 bg-[#EDF0F2] p-2.5 rounded border border-[#DDE3E8]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#5C6B76]">Shelter Occupancy:</span>
                            <span className="font-bold text-[#16232E]">
                              {allocatedCount.toLocaleString()} / {usableCap.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-[#DDE3E8] h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                utilPct >= 90
                                  ? 'bg-[#C13F3F]'
                                  : utilPct >= 70
                                  ? 'bg-[#D97A2E]'
                                  : 'bg-[#3F8F5F]'
                              }`}
                              style={{ width: `${Math.min(100, utilPct)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-[#5C6B76] pt-0.5">
                            <span className="font-semibold">{utilPct}% Allocated</span>
                            <span className="font-semibold text-[#3F8F5F]">
                              {remainingCap.toLocaleString()} Headroom Free
                            </span>
                          </div>
                        </div>

                        {/* Readiness Triad */}
                        <div className="grid grid-cols-3 gap-1.5 mt-2 text-center text-[10px]">
                          <div className="bg-white p-1.5 rounded border border-[#DDE3E8]">
                            <p className="text-[#5C6B76]">Road Access</p>
                            <p className="font-bold text-[#16232E]">{site.access_score || 8.5}/10</p>
                          </div>
                          <div className="bg-white p-1.5 rounded border border-[#DDE3E8]">
                            <p className="text-[#5C6B76]">Infra Ready</p>
                            <p className="font-bold text-[#16232E]">{site.infrastructure_score || 9.0}/10</p>
                          </div>
                          <div className="bg-white p-1.5 rounded border border-[#DDE3E8]">
                            <p className="text-[#5C6B76]">Safety Index</p>
                            <p className="font-bold text-[#3F8F5F]">
                              {Math.round((1.0 - (site.secondary_risk_score || 0.08)) * 100)}% Safe
                            </p>
                          </div>
                        </div>

                        {/* Allocated inbound villages */}
                        {site.allocated_villages && site.allocated_villages.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-[#DDE3E8]">
                            <p className="text-[10px] font-semibold text-[#5C6B76] uppercase tracking-wider mb-1">
                              Assigned Evacuating Villages ({site.allocated_villages.length}):
                            </p>
                            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                              {site.allocated_villages.map((v, vi) => (
                                <span
                                  key={vi}
                                  className="px-1.5 py-0.5 rounded bg-[#FFFFFF] border border-[#DDE3E8] text-[10px] text-[#16232E] font-medium"
                                >
                                  {v}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-1 flex items-center gap-2">
                        <button
                          onClick={() => setHighlightedShelterId(isHighlighted ? null : site.site_id)}
                          className={`flex-1 py-1.5 rounded text-[10px] font-semibold transition-colors cursor-pointer text-center ${
                            isHighlighted
                              ? 'bg-[#E0B33C] text-[#16232E]'
                              : 'bg-[#16232E] hover:bg-[#3D5A73] text-white'
                          }`}
                        >
                          {isHighlighted ? 'Clear Shelter Filter' : 'Filter Assigned Routes'}
                        </button>
                        <button
                          onClick={() => onNavigateTab('relocation')}
                          className="py-1.5 px-2.5 rounded bg-[#3D5A73] hover:bg-[#16232E] text-white text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          Roster &rarr;
                        </button>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>

                {/* Inner White Dot Emblem */}
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
          {showHabitations &&
            filteredHabitations.map((hab) => {
              const color = ZONE_COLORS[hab.zone] || '#3D5A73';
              const isRed = hab.zone === 'RED';
              const isSelected = selectedHabitation?.habitation_id === hab.habitation_id;

              return (
                <React.Fragment key={hab.habitation_id}>
                  {/* Outer pulse for RED zone or selected settlements */}
                  {(isRed || isSelected) && (
                    <CircleMarker
                      center={[hab.lat, hab.lon]}
                      radius={isSelected ? 16 : 12}
                      pathOptions={{
                        fillColor: isSelected ? '#E0B33C' : color,
                        fillOpacity: 0.25,
                        color: isSelected ? '#E0B33C' : color,
                        weight: 1,
                        dashArray: '2, 2'
                      }}
                      interactive={false}
                    />
                  )}

                  <CircleMarker
                    center={[hab.lat, hab.lon]}
                    radius={isSelected ? 9 : isRed ? 7.5 : 5.5}
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: 0.90,
                      color: isSelected ? '#16232E' : '#FFFFFF',
                      weight: isSelected ? 3 : 1.5
                    }}
                    eventHandlers={{
                      click: () => onSelectHabitation(hab)
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -6]} opacity={0.98}>
                      <div className="text-xs p-1 space-y-0.5">
                        <p className="font-bold text-white">{hab.village}</p>
                        <p className="text-[11px] text-white/90">
                          {hab.district} · {hab.hazard_type?.replace(/_/g, ' ')}
                        </p>
                        <p className="text-[11px] font-semibold" style={{ color: isRed ? '#FF8A8A' : '#FFD180' }}>
                          {hab.zone} Zone ({hab.composite_risk_score.toFixed(2)}) · {hab.relocation_urgency_tier}
                        </p>
                        <p className="text-[10px] text-[#80D8FF]">
                          Nearest Shelter: {hab.nearest_safe_shelter_km} km
                        </p>
                      </div>
                    </Tooltip>

                    <Popup>
                      <div className="text-xs space-y-2 p-1 min-w-[240px]">
                        <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-1">
                          <span className="font-bold text-[#16232E]">{hab.village}</span>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                            style={{ backgroundColor: color }}
                          >
                            {hab.zone} ZONE
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5C6B76]">
                          {hab.district} · {hab.habitation_id} · Pop: {hab.population?.total?.toLocaleString()}
                        </p>
                        <p className="text-[11px] leading-tight text-[#16232E] bg-[#EDF0F2] p-2 rounded border border-[#DDE3E8]">
                          {hab.trigger_description}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-[#5C6B76] pt-1">
                          <span>Action Tier:</span>
                          <strong className="text-[#16232E] font-semibold">{hab.relocation_urgency_tier}</strong>
                        </div>
                        <div className="pt-1 flex items-center justify-between gap-2">
                          <button
                            onClick={() => onSelectHabitation(hab)}
                            className="w-full py-1.5 rounded bg-[#3D5A73] hover:bg-[#16232E] text-white text-[10px] font-semibold transition-colors cursor-pointer text-center"
                          >
                            Inspect Detailed Relocation Plan &rarr;
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                </React.Fragment>
              );
            })}
        </MapContainer>

        {/* Floating Evacuation Route Telemetry HUD (When Habitation or Corridor Selected) */}
        {activeAllocation && (
          <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur p-3.5 rounded-lg border-2 border-[#E0B33C] shadow-xl text-xs space-y-2 max-w-sm pointer-events-auto animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-2">
              <div className="flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-[#E0B33C]" />
                <span className="font-bold text-[#16232E] text-xs">Active Evacuation Corridor</span>
              </div>
              <button
                onClick={() => setSelectedAllocationId(null)}
                className="text-[#5C6B76] hover:text-[#16232E] p-0.5 rounded cursor-pointer"
                title="Dismiss corridor overlay"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[#5C6B76]">Vector:</span>
                <span className="font-bold text-[#16232E]">
                  {activeAllocation.village} &rarr; {activeAllocation.safe_site_name || activeAllocation.site_name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5C6B76]">Transit Distance:</span>
                <span className="font-mono font-bold text-[#16232E]">
                  {activeAllocation.distance_km || 16.8} km
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5C6B76]">Evacuee Headcount:</span>
                <span className="font-bold text-[#C13F3F]">
                  {(activeAllocation.allocated_headcount || activeAllocation.allocated_count || 0).toLocaleString()} Persons
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5C6B76]">Convoy Fleet:</span>
                <span className="font-semibold text-[#16232E] flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-[#3D5A73]" />
                  {activeAllocation.transit_logistics?.bus_convoy_fleet || 8} Buses +{' '}
                  {activeAllocation.transit_logistics?.odraf_escort_vehicles || 2} ODRAF Escorts
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5C6B76]">Departure Window:</span>
                <span className="font-semibold text-[#D97A2E] text-[11px]">
                  {activeAllocation.transit_logistics?.departure_window || 'Immediate T-0 to T+4 Hours'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#DDE3E8] flex items-center gap-2">
              <button
                onClick={() => onNavigateTab('relocation')}
                className="flex-1 py-1.5 rounded bg-[#16232E] hover:bg-[#3D5A73] text-white text-[10px] font-bold transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
              >
                <span>View Full Relocation Dossier</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Bottom Right Map GIS Legend */}
        <div className="absolute bottom-6 right-6 z-20 bg-white/95 backdrop-blur p-3.5 rounded-lg border border-[#DDE3E8] shadow-lg text-xs space-y-2 pointer-events-auto max-w-[270px]">
          <p className="font-bold text-[#16232E] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#3D5A73]" />
            <span>GIS Map Legend</span>
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#C13F3F] border border-white shrink-0 shadow-xs" />
              <span className="text-[#16232E] font-medium">Red Zone (&ge; 0.75) · Immediate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#D97A2E] border border-white shrink-0 shadow-xs" />
              <span className="text-[#16232E] font-medium">Orange Zone (0.50 - 0.74) · Short-Term</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#E0B33C] border border-white shrink-0 shadow-xs" />
              <span className="text-[#16232E] font-medium">Yellow Zone (0.30 - 0.49) · Alert</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#3F8F5F] border border-white shrink-0 shadow-xs" />
              <span className="text-[#16232E] font-medium">Green Zone (&lt; 0.30) · Safe/Monitor</span>
            </div>

            {/* Shelter & Vector Legends */}
            <div className="pt-2 border-t border-[#DDE3E8] space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#3F8F5F] border-2 border-white flex items-center justify-center shrink-0 shadow-xs">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
                <span className="text-[#16232E] font-medium">Certified Safe Shelter</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-1 bg-[#C13F3F] shrink-0 rounded" />
                <span className="text-[#16232E] font-medium">Immediate Evac Vector</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-1 border-t-2 border-dashed border-[#D97A2E] shrink-0" />
                <span className="text-[#16232E] font-medium">Short-Term Relocation Vector</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-1.5 bg-[#E0B33C] shrink-0 rounded shadow-xs" />
                <span className="text-[#16232E] font-bold text-[#16232E]">Selected / Active Vector</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-[#5C6B76] pt-1.5 border-t border-[#DDE3E8] leading-tight">
            Click any corridor or shelter icon to view live operational routing telemetry.
          </p>
        </div>
      </div>

      {/* Interactive Side Detail Panel (Relocation & Risk Dossier) */}
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
