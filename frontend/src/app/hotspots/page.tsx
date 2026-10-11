'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  ArrowRight,
  Info,
  RefreshCw,
  AlertTriangle,
  Eye,
  Sparkles,
  ClipboardList,
  Filter,
  Clock,
  Shield,
  Layers,
} from 'lucide-react';
import {
  PREDEFINED_HOTSPOTS,
  RecurrenceClassification,
  RecurrenceMetrics,
  Incident,
  FollowUpRecord,
} from '@/types';
import { api, getLocalIncidents, getLocalFollowUps } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';

interface HotspotCardItem {
  hotspotId: string;
  name: string;
  description: string;
  area: string;
  latitude: number;
  longitude: number;
  incidentCount: number;
  lastIncidentDate?: string;
  latestFollowUpCondition?: string;
  classification: RecurrenceClassification;
  postCleanupRecurrenceCount: number;
  cleanupsCount: number;
  followUpsCount: number;
}

export default function HotspotsPage() {
  const [hotspotsData, setHotspotsData] = useState<HotspotCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [classificationFilter, setClassificationFilter] = useState<string>('ALL');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      api.getIncidents(),
      api.getFollowUps(),
      api.getCleanups(),
    ]).then(async ([incRes, folRes, clnRes]) => {
      const incidentsList = incRes.success && incRes.data ? incRes.data : getLocalIncidents();
      const followUpsList = folRes.success && folRes.data ? folRes.data : getLocalFollowUps();

      const items: HotspotCardItem[] = await Promise.all(
        PREDEFINED_HOTSPOTS.map(async (spot) => {
          const recRes = await api.getHotspotRecurrence(spot.hotspotId);
          const spotIncidents = incidentsList
            .filter((i) => i.hotspotId === spot.hotspotId)
            .sort((a, b) => new Date(b.createdAt || b.reportedAt).getTime() - new Date(a.createdAt || a.reportedAt).getTime());

          const spotFollowUps = followUpsList
            .filter((f) => f.hotspotId === spot.hotspotId)
            .sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime());

          const classification = (recRes.data?.classification ||
            (spotIncidents.length >= 3 ? 'Recurring' : spotIncidents.length === 2 ? 'Monitor' : 'Normal')) as RecurrenceClassification;

          return {
            hotspotId: spot.hotspotId,
            name: spot.name,
            description: spot.description,
            area: spot.area,
            latitude: spot.latitude,
            longitude: spot.longitude,
            incidentCount: recRes.data?.totalIncidents ?? spotIncidents.length,
            lastIncidentDate: spotIncidents[0]?.createdAt || spotIncidents[0]?.reportedAt || recRes.data?.lastIncidentDate,
            latestFollowUpCondition: spotFollowUps[0]?.condition,
            classification,
            postCleanupRecurrenceCount: recRes.data?.postCleanupRecurrenceCount ?? 0,
            cleanupsCount: recRes.data?.totalCleanups ?? 0,
            followUpsCount: recRes.data?.totalFollowUps ?? spotFollowUps.length,
          };
        })
      );

      // Sort with Recurring first
      items.sort((a, b) => {
        const order: Record<string, number> = { Recurring: 3, Monitor: 2, Normal: 1 };
        return (order[b.classification] || 0) - (order[a.classification] || 0) || b.incidentCount - a.incidentCount;
      });

      if (isMounted) {
        setHotspotsData(items);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredHotspots = hotspotsData.filter((h) => {
    if (classificationFilter !== 'ALL' && h.classification !== classificationFilter) return false;
    return true;
  });

  const recurringCount = hotspotsData.filter((h) => h.classification === 'Recurring').length;
  const monitorCount = hotspotsData.filter((h) => h.classification === 'Monitor').length;
  const normalCount = hotspotsData.filter((h) => h.classification === 'Normal').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <MapPin className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Campus Waste Hotspots
            </h1>
            <span className="text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full uppercase">
              Signature Feature
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Predefined campus anchors for tracking waste reports, cleanup history, condition audits, and recurrence patterns.
          </p>
        </div>

        <Link
          href="/report"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
        >
          <AlertTriangle className="w-4 h-4 text-emerald-200" />
          <span>Report Waste at Hotspot</span>
        </Link>
      </div>

      {/* Signature Feature Banner & Explanation */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold uppercase tracking-wider">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Deterministic Recurrence Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            How CleanLoop Classifies Hotspots
          </h2>
          <p className="text-purple-100/90 text-xs sm:text-sm leading-relaxed">
            Unlike simple reporting apps that treat every cleanup as the end of the story, CleanLoop continuously tracks whether waste returns to the same location after cleanup.
          </p>
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
              <span className="font-bold text-emerald-300 block">Normal (1 incident)</span>
              <span className="text-purple-200 text-[11px]">Isolated event, standard maintenance routine.</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
              <span className="font-bold text-amber-300 block">Monitor (2 incidents)</span>
              <span className="text-purple-200 text-[11px]">Second observation logged, queued for surveillance.</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10">
              <span className="font-bold text-purple-300 block">Recurring (&ge; 3 incidents)</span>
              <span className="text-purple-200 text-[11px]">Chronic hotspot detected, alerts administration.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recurrence Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Operational Notice:</strong> Recurrence indicates repeated observations for the same geographic anchor. It does not establish the cause of the waste nor imply that a prior cleanup was defective.
        </div>
      </div>

      {/* Filter Tabs Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs shadow-2xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filter by Classification:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setClassificationFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              classificationFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Hotspots ({hotspotsData.length})
          </button>
          <button
            onClick={() => setClassificationFilter('Recurring')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              classificationFilter === 'Recurring'
                ? 'bg-purple-900 text-white shadow-2xs'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
            }`}
          >
            Recurring ({recurringCount})
          </button>
          <button
            onClick={() => setClassificationFilter('Monitor')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              classificationFilter === 'Monitor'
                ? 'bg-amber-800 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Monitor ({monitorCount})
          </button>
          <button
            onClick={() => setClassificationFilter('Normal')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              classificationFilter === 'Normal'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Normal ({normalCount})
          </button>
        </div>
      </div>

      {/* Hotspots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4">
              <div className="h-5 bg-slate-200 rounded w-1/4" />
              <div className="h-7 bg-slate-200 rounded w-3/4" />
              <div className="h-16 bg-slate-100 rounded" />
            </div>
          ))
        ) : filteredHotspots.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
            <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700">No hotspots in this category</p>
            <p className="text-xs text-slate-400 mt-1">Switch filter back to "All Hotspots" to inspect all predefined anchors.</p>
          </div>
        ) : (
          filteredHotspots.map((spot) => {
            const isRecurring = spot.classification === 'Recurring';
            const isMonitor = spot.classification === 'Monitor';

            return (
              <div
                key={spot.hotspotId}
                className={`bg-white rounded-2xl border transition p-6 flex flex-col justify-between shadow-xs hover:shadow-md ${
                  isRecurring
                    ? 'border-purple-300 ring-2 ring-purple-500/10'
                    : isMonitor
                    ? 'border-amber-300'
                    : 'border-slate-200'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Identifier & Classification Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded">
                      {spot.hotspotId}
                    </span>
                    <StatusBadge status={spot.classification} size="sm" />
                  </div>

                  {/* Hotspot Name & Area */}
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700">
                      {spot.name}
                    </h2>
                    <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{spot.area}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {spot.description}
                  </p>

                  {/* Metric Box */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Distinct Incidents:</span>
                      <strong className="text-slate-900 font-mono text-sm font-black">
                        {spot.incidentCount}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Latest Audit Condition:</span>
                      <div>
                        {spot.latestFollowUpCondition ? (
                          <StatusBadge status={spot.latestFollowUpCondition} size="sm" />
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Awaiting audit</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-500">Most Recent Incident:</span>
                      <span className="text-slate-700 font-mono font-medium">
                        {spot.lastIncidentDate
                          ? new Date(spot.lastIncidentDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'None logged'}
                      </span>
                    </div>
                  </div>

                  {/* Geographic Coordinates */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Lat: {spot.latitude.toFixed(4)}</span>
                    <span>Lng: {spot.longitude.toFixed(4)}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/report?hotspotId=${spot.hotspotId}`}
                    className="text-xs font-bold text-forest-700 hover:underline"
                  >
                    + Report Here
                  </Link>
                  <Link
                    href={`/hotspots/${spot.hotspotId}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-2xs"
                  >
                    <span>View Full History</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
