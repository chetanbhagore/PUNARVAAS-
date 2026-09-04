import React, { useState, useEffect } from 'react';
import { Scale, AlertCircle, Building2, MapPin, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { fetchCapacity } from '../api';

export default function CapacityTab() {
  const [capacityData, setCapacityData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCapacity()
      .then((data) => {
        setCapacityData(data);
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
        Loading carrying capacity telemetry...
      </div>
    );
  }

  const districts = capacityData?.districts_capacity || [];
  const allShelters = districts.flatMap(d => d.shelters || []);

  const chartData = districts.map(d => ({
    district: d.district,
    atRisk: d.at_risk_population,
    safeCapacity: d.available_capacity
  }));

  return (
    <div className="space-y-6">
      {/* Mandatory Transparent Formula Notice Banner */}
      <div className="bg-[#16232E] text-white p-4 rounded border border-[#3D5A73] shadow-sm flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#E0B33C] shrink-0 mt-0.5" />
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#E0B33C]">
            Methodological Notice
          </h2>
          <p className="text-sm font-semibold mt-0.5">
            Capacity methodology is PUNARVAAS's own transparent formula, not an official NDMA standard
          </p>
          <p className="text-xs text-[#EDF0F2]/80 mt-1 leading-relaxed">
            Compares total aggregated population in Red and Orange zone habitations against certified emergency shelter plinth capacity within pilot district jurisdictions.
          </p>
        </div>
      </div>

      {/* Overview Header */}
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#16232E]">District Carrying Capacity & Shelter Readiness</h1>
          <p className="text-xs text-[#5C6B76]">
            Aggregate evacuation capacity balance across primary multipurpose cyclone and flood relief centers.
          </p>
        </div>
      </div>

      {/* Bar Comparison Chart: At-Risk Population vs Available Capacity */}
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-[#16232E]">At-Risk Population vs Available Shelter Capacity</h2>
            <p className="text-xs text-[#5C6B76]">Comparison per pilot district (Persons)</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF0F2" />
              <XAxis dataKey="district" tick={{ fontSize: 11, fill: '#16232E' }} />
              <YAxis tick={{ fontSize: 10, fill: '#5C6B76' }} />
              <Tooltip
                formatter={(val, name) => [val.toLocaleString(), name === 'atRisk' ? 'At-Risk (Red+Orange)' : 'Shelter Capacity']}
                contentStyle={{ backgroundColor: '#16232E', color: '#fff', fontSize: '11px', borderRadius: '4px' }}
              />
              <Legend
                formatter={(val) => val === 'atRisk' ? 'At-Risk Population (Red + Orange)' : 'Certified Safe Shelter Capacity'}
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              />
              <Bar dataKey="atRisk" fill="#D97A2E" name="atRisk" radius={[4, 4, 0, 0]} />
              <Bar dataKey="safeCapacity" fill="#3D5A73" name="safeCapacity" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* District Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {districts.map((d) => {
          const isSurplus = d.deficit_or_surplus >= 0;
          return (
            <div key={d.district} className="bg-[#FFFFFF] border border-[#DDE3E8] rounded p-4 shadow-sm space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-2">
                <span className="font-bold text-[#16232E] text-sm">{d.district}</span>
                <span className="text-[11px] text-[#5C6B76]">{d.shelters_count} Safe Sites</span>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between">
                  <span className="text-[#5C6B76]">At-Risk Population:</span>
                  <strong className="text-[#16232E]">{d.at_risk_population.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C6B76]">Shelter Capacity:</span>
                  <strong className="text-[#16232E]">{d.available_capacity.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#DDE3E8]">
                  <span className="text-[#5C6B76]">Coverage Index:</span>
                  <strong className="text-[#16232E]">{d.coverage_pct}%</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C6B76]">Net Balance:</span>
                  <span className={`font-bold ${isSurplus ? 'text-[#3D5A73]' : 'text-[#C13F3F]'}`}>
                    {isSurplus ? `+${d.deficit_or_surplus.toLocaleString()}` : d.deficit_or_surplus.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safe Sites Registry Table */}
      <div className="bg-[#FFFFFF] border border-[#DDE3E8] rounded shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#DDE3E8]">
          <h2 className="text-sm font-bold text-[#16232E]">Certified Safe Shelter Registry</h2>
          <p className="text-xs text-[#5C6B76]">Known evacuation shelters, high-plinth halls, and relief sites</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-[#DDE3E8]">
            <thead className="bg-[#EDF0F2] text-[#5C6B76] font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Site ID</th>
                <th className="py-3 px-4">Shelter Facility Name</th>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Capacity (Persons)</th>
                <th className="py-3 px-4">Distance from Centroid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE3E8] text-[#16232E]">
              {allShelters.map((s) => (
                <tr key={s.site_id} className="hover:bg-[#EDF0F2]/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#16232E]">{s.site_id}</td>
                  <td className="py-3 px-4 font-medium text-[#16232E]">{s.name}</td>
                  <td className="py-3 px-4 text-[#5C6B76]">{s.district}</td>
                  <td className="py-3 px-4 text-[#5C6B76]">{s.shelter_type}</td>
                  <td className="py-3 px-4 font-mono font-bold">{s.capacity_persons?.toLocaleString()}</td>
                  <td className="py-3 px-4 text-[#5C6B76]">{s.distance_from_district_centroid_km} km</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
