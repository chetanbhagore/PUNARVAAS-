import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, MapPin, Building2 } from 'lucide-react';
import HabitationDetail from '../components/HabitationDetail';

const ZONE_BADGE = {
  RED: 'bg-[#C13F3F] text-white',
  ORANGE: 'bg-[#D97A2E] text-white',
  YELLOW: 'bg-[#E0B33C] text-black font-semibold',
  GREEN: 'bg-[#3F8F5F] text-white'
};

export default function DirectoryTab({
  habitations,
  selectedHabitation,
  onSelectHabitation,
  onCloseDetail,
  onNavigateTab
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [hazardFilter, setHazardFilter] = useState('ALL');
  const [zoneFilter, setZoneFilter] = useState('ALL');

  const [sortField, setSortField] = useState('composite_risk_score');
  const [sortAsc, setSortAsc] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const filteredHabitations = useMemo(() => {
    return (habitations || []).filter((h) => {
      if (districtFilter !== 'ALL' && h.district !== districtFilter) return false;
      if (hazardFilter !== 'ALL' && h.hazard_type !== hazardFilter) return false;
      if (zoneFilter !== 'ALL' && h.zone !== zoneFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchId = h.habitation_id.toLowerCase().includes(q);
        const matchVillage = h.village.toLowerCase().includes(q);
        const matchDistrict = h.district.toLowerCase().includes(q);
        if (!matchId && !matchVillage && !matchDistrict) return false;
      }
      return true;
    });
  }, [habitations, districtFilter, hazardFilter, zoneFilter, searchTerm]);

  const sortedHabitations = useMemo(() => {
    return [...filteredHabitations].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'population') {
        aVal = a.population?.total || 0;
        bVal = b.population?.total || 0;
      }

      if (typeof aVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
  }, [filteredHabitations, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedHabitations.length / itemsPerPage) || 1;
  const paginatedHabitations = sortedHabitations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#16232E]">Habitation Directory</h1>
          <p className="text-xs text-[#5C6B76]">
            Comprehensive registry of all monitored settlements with baseline vulnerability, weather triggers, and zone classifications.
          </p>
        </div>
        <div className="text-xs text-[#5C6B76] font-medium">
          Total in Registry: <strong className="text-[#16232E]">{sortedHabitations.length}</strong> settlements
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-3 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center flex-wrap gap-2 flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#5C6B76] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search ID, village, district..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#EDF0F2] text-[#16232E] border border-[#DDE3E8] rounded pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#3D5A73]"
            />
          </div>

          {/* District Filter */}
          <select
            value={districtFilter}
            onChange={(e) => {
              setDistrictFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#EDF0F2] text-[#16232E] border border-[#DDE3E8] rounded px-2.5 py-1.5 font-medium cursor-pointer"
          >
            <option value="ALL">All Districts</option>
            <option value="Puri">Puri</option>
            <option value="Kendrapara">Kendrapara</option>
            <option value="Ganjam">Ganjam</option>
            <option value="Kandhamal">Kandhamal</option>
            <option value="Uttarkashi (Illustrative Demo)">Uttarkashi (Illustrative)</option>
          </select>

          {/* Hazard Filter */}
          <select
            value={hazardFilter}
            onChange={(e) => {
              setHazardFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#EDF0F2] text-[#16232E] border border-[#DDE3E8] rounded px-2.5 py-1.5 font-medium cursor-pointer"
          >
            <option value="ALL">All Hazards</option>
            <option value="cyclone_coastal">Cyclone & Surge</option>
            <option value="flood">Flood</option>
            <option value="landslide">Landslide</option>
            <option value="cloudburst">Cloudburst (Illustrative)</option>
          </select>

          {/* Zone Filter */}
          <select
            value={zoneFilter}
            onChange={(e) => {
              setZoneFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#EDF0F2] text-[#16232E] border border-[#DDE3E8] rounded px-2.5 py-1.5 font-medium cursor-pointer"
          >
            <option value="ALL">All Zones</option>
            <option value="RED">RED Zone</option>
            <option value="ORANGE">ORANGE Zone</option>
            <option value="YELLOW">YELLOW Zone</option>
            <option value="GREEN">GREEN Zone</option>
          </select>
        </div>

        {/* Clear Filters */}
        {(searchTerm || districtFilter !== 'ALL' || hazardFilter !== 'ALL' || zoneFilter !== 'ALL') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setDistrictFilter('ALL');
              setHazardFilter('ALL');
              setZoneFilter('ALL');
              setCurrentPage(1);
            }}
            className="text-xs text-[#3D5A73] font-semibold hover:underline cursor-pointer"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs divide-y divide-[#DDE3E8]">
          <thead className="bg-[#EDF0F2] text-[#5C6B76] font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('habitation_id')}>
                <div className="flex items-center gap-1">
                  <span>Habitation ID</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('village')}>
                <div className="flex items-center gap-1">
                  <span>Settlement Name</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('district')}>
                <div className="flex items-center gap-1">
                  <span>District</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Primary Hazard</th>
              <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('population')}>
                <div className="flex items-center gap-1">
                  <span>Population</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Vulnerability %</th>
              <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('zone')}>
                <div className="flex items-center gap-1">
                  <span>Zone</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('composite_risk_score')}>
                <div className="flex items-center gap-1">
                  <span>Score</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Action Tier</th>
              <th className="py-3 px-4 text-right">Inspect</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#DDE3E8] text-[#16232E]">
            {paginatedHabitations.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-[#5C6B76]">
                  No habitations match the current filter criteria.
                </td>
              </tr>
            ) : (
              paginatedHabitations.map((h) => (
                <tr
                  key={h.habitation_id}
                  onClick={() => onSelectHabitation(h)}
                  className="hover:bg-[#EDF0F2]/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-bold text-[#16232E]">
                    {h.habitation_id}
                  </td>
                  <td className="py-3 px-4 font-medium text-[#16232E]">
                    {h.village}
                  </td>
                  <td className="py-3 px-4 text-[#5C6B76]">{h.district}</td>
                  <td className="py-3 px-4 text-[#5C6B76] capitalize">
                    {h.hazard_type?.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {h.population?.total?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-[#5C6B76]">
                    {Math.round((h.population?.vulnerable_pct || 0) * 100)}%
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${ZONE_BADGE[h.zone]}`}>
                      {h.zone}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold">
                    {h.composite_risk_score.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-[11px] text-[#16232E] bg-[#EDF0F2] px-2 py-0.5 rounded">
                      {h.relocation_urgency_tier}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectHabitation(h);
                      }}
                      className="px-2.5 py-1 rounded text-xs font-semibold bg-[#3D5A73] hover:bg-[#4E6F8C] text-white transition-colors cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div className="p-3 bg-[#EDF0F2]/40 border-t border-[#DDE3E8] flex items-center justify-between text-xs text-[#5C6B76]">
          <span>
            Page <strong className="text-[#16232E]">{currentPage}</strong> of <strong className="text-[#16232E]">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-[#DDE3E8] bg-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-[#DDE3E8] bg-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Side Detail Panel on Click */}
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
