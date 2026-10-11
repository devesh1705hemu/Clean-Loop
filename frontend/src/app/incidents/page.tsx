'use client';

import React, { useState, useEffect } from 'react';
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
  Search,
  ChevronRight,
  Clock,
  Layers,
} from 'lucide-react';
import { Incident, IncidentStatus, PREDEFINED_HOTSPOTS } from '@/types';
import { api, getLocalIncidents } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import StatusBadge from '@/components/StatusBadge';

export default function IncidentsPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterHotspot, setFilterHotspot] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyMyReports, setOnlyMyReports] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sync latest incidents from API and local persistence
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const local = getLocalIncidents();
    if (local.length > 0) {
      setIncidents(local);
    }

    api.getIncidents().then((res) => {
      if (isMounted) {
        if (res.success && res.data) {
          setIncidents(res.data);
        }
        setIsLoading(false);
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
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const spot = PREDEFINED_HOTSPOTS.find((h) => h.hotspotId === inc.hotspotId);
      const matches =
        inc.incidentId.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        inc.wasteCategory.toLowerCase().includes(q) ||
        (spot && spot.name.toLowerCase().includes(q));
      if (!matches) return false;
    }
    return true;
  });

  const getHotspotName = (id: string) => {
    return PREDEFINED_HOTSPOTS.find((h) => h.hotspotId === id)?.name || id;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <ClipboardList className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Waste Incidents Backlog
            </h1>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredIncidents.length} total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time DynamoDB incident records and status lifecycle across campus hotspots
          </p>
        </div>

        <Link
          href="/report"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
        >
          <Plus className="w-4 h-4 text-emerald-200" />
          <span>Report Waste</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Filters:</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:ring-1 focus:ring-emerald-600"
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
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:ring-1 focus:ring-emerald-600"
            >
              <option value="ALL">All Campus Hotspots</option>
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
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                onlyMyReports
                  ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {onlyMyReports ? '✓ My Reports Only' : 'My Reports Only'}
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search descriptions, IDs..."
            className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 w-44 sm:w-56"
          />
        </div>
      </div>

      {/* Incident List Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading incidents feed...
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-sm">No incidents found</p>
            <p className="text-xs text-slate-400 mt-1">No reports match your current filter criteria.</p>
            <button
              onClick={() => {
                setFilterStatus('ALL');
                setFilterHotspot('ALL');
                setSearchQuery('');
                setOnlyMyReports(false);
              }}
              className="mt-4 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-3 px-4">Incident ID</th>
                  <th className="py-3 px-4">Hotspot Location</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Reported By</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIncidents.map((inc) => (
                  <tr key={inc.incidentId} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <Link
                        href={`/incidents/${inc.incidentId}`}
                        className="hover:text-emerald-700 hover:underline"
                      >
                        {inc.incidentId}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{getHotspotName(inc.hotspotId)}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px]">
                        {inc.wasteCategory}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {inc.description}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] max-w-[120px] truncate">
                      {inc.reportedBy}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono whitespace-nowrap">
                      {new Date(inc.createdAt || inc.reportedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={inc.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/incidents/${inc.incidentId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition text-[11px]"
                      >
                        <span>Timeline</span>
                        <ChevronRight className="w-3 h-3 text-slate-500" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
