'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Filter,
  Plus,
  MapPin,
  Calendar,
  Tag,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { Incident, IncidentStatus, PREDEFINED_HOTSPOTS } from '@/types';
import { api, getLocalIncidents } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function IncidentsPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterHotspot, setFilterHotspot] = useState<string>('ALL');
  const [onlyMyReports, setOnlyMyReports] = useState(false);

  // Sync latest incidents from API and local persistence
  React.useEffect(() => {
    let isMounted = true;
    const local = getLocalIncidents();
    if (local.length > 0) {
      setIncidents(local);
    }
    api.getIncidents().then((res) => {
      if (isMounted && res.success && res.data) {
        setIncidents(res.data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredIncidents = incidents.filter((inc) => {
    if (filterStatus !== 'ALL' && inc.status !== filterStatus) return false;
    if (filterHotspot !== 'ALL' && inc.hotspotId !== filterHotspot) return false;
    if (onlyMyReports && user && inc.reportedBy !== user.email) return false;
    return true;
  });

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'REPORTED':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'CLEANED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'FOLLOW_UP_REQUIRED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'RESOLVED':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Waste Incidents Feed
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time DynamoDB incident records across campus hotspots
          </p>
        </div>

        <Link
          href="/report"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Report Waste
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filters:</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-500">Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="REPORTED">REPORTED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="CLEANED">CLEANED</option>
            <option value="FOLLOW_UP_REQUIRED">FOLLOW_UP_REQUIRED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-500">Hotspot:</label>
          <select
            value={filterHotspot}
            onChange={(e) => setFilterHotspot(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
          >
            <option value="ALL">All Hotspots</option>
            {PREDEFINED_HOTSPOTS.map((spot) => (
              <option key={spot.hotspotId} value={spot.hotspotId}>
                {spot.name}
              </option>
            ))}
          </select>
        </div>

        {user && (
          <button
            type="button"
            onClick={() => setOnlyMyReports(!onlyMyReports)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
              onlyMyReports
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {onlyMyReports ? '✓ My Reports' : 'Filter: My Reports'}
          </button>
        )}

        <div className="ml-auto text-slate-500">
          Showing <strong>{filteredIncidents.length}</strong> incidents
        </div>
      </div>

      {/* Synthetic Data notice banner */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] text-slate-600 flex items-center justify-between">
        <span>Synthetic data for development/demo only. Live records sync directly with DynamoDB in Phase 2+.</span>
        <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">DEV SEED</span>
      </div>

      {/* Incidents Table / Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No matching incidents found</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting the filters or submit a new report.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredIncidents.map((incident) => {
              const hotspot = PREDEFINED_HOTSPOTS.find(
                (h) => h.hotspotId === incident.hotspotId
              );

              return (
                <div
                  key={incident.incidentId}
                  className="p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {incident.incidentId}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                          incident.status
                        )}`}
                      >
                        {incident.status}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {incident.wasteCategory}
                      </span>
                    </div>

                    <p className="text-sm text-slate-800 leading-snug font-medium">
                      {incident.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-emerald-800">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        {hotspot ? hotspot.name : incident.hotspotId}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(incident.reportedAt).toLocaleString()}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        by {incident.reportedBy}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <Link
                      href={`/incidents/${incident.incidentId}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
