'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Sparkles,
  Eye,
  RefreshCw,
  Clock,
  AlertTriangle,
  Info,
  FileText,
} from 'lucide-react';
import {
  PREDEFINED_HOTSPOTS,
  TimelineEvent,
  RecurrenceClassification,
  RecurrenceMetrics,
} from '@/types';
import { api } from '@/lib/api';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function HotspotDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const hotspotId = resolvedParams.id;

  const hotspot = PREDEFINED_HOTSPOTS.find((h) => h.hotspotId === hotspotId) || {
    hotspotId: hotspotId,
    name: 'Campus Hotspot Location',
    description: 'Designated campus perimeter monitoring location',
    latitude: 28.545,
    longitude: 77.1926,
    area: 'Campus Zone',
    status: 'ACTIVE' as const,
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
  };

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [recurrence, setRecurrence] = useState<RecurrenceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      api.getHotspotRecurrence(hotspotId),
      api.getHotspotHistory(hotspotId),
    ]).then(([recRes, histRes]) => {
      if (isMounted) {
        if (recRes.success && recRes.data) {
          setRecurrence(recRes.data);
        }
        if (histRes.success && histRes.data) {
          setEvents(histRes.data);
        }
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [hotspotId]);

  const classification: RecurrenceClassification = recurrence?.classification || 'Normal';
  const totalIncidents = recurrence?.totalIncidents ?? events.filter((e) => e.type === 'INCIDENT').length;
  const totalCleanups = recurrence?.totalCleanups ?? events.filter((e) => e.type === 'CLEANUP').length;
  const totalFollowUps = recurrence?.totalFollowUps ?? events.filter((e) => e.type === 'FOLLOWUP').length;
  const postCleanupRecurrence = recurrence?.postCleanupRecurrenceCount ?? 0;

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'INCIDENT':
        return <FileText className="w-4 h-4 text-amber-600" />;
      case 'CLEANUP':
        return <Sparkles className="w-4 h-4 text-sky-600" />;
      case 'FOLLOWUP':
        return <Eye className="w-4 h-4 text-emerald-600" />;
      case 'RECURRENCE':
        return <RefreshCw className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <Link
        href="/hotspots"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Hotspots
      </Link>

      {/* Header Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                {hotspot.hotspotId}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {hotspot.status}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  classification === 'Recurring'
                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                    : classification === 'Monitor'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                Classification: {classification}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              {hotspot.name}
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              {hotspot.area} • Lat: {hotspot.latitude}, Lng: {hotspot.longitude}
            </p>
          </div>

          <Link
            href={`/report?hotspotId=${hotspot.hotspotId}`}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition inline-flex items-center gap-1.5 self-start sm:self-center"
          >
            <AlertTriangle className="w-4 h-4" />
            Report New Incident
          </Link>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {hotspot.description}
        </p>

        {/* Section 13 & 15 Recurrence Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Incidents
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {totalIncidents}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Cleanups Done
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {totalCleanups}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Follow-ups Logged
            </span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {totalFollowUps}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
              Post-Cleanup Recurrence
            </span>
            <div className="text-2xl font-black text-amber-900 mt-0.5">
              {postCleanupRecurrence}
            </div>
          </div>
        </div>

        {/* Mandatory Recurrence Disclaimer */}
        <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            Recurrence indicates repeated observations. It does not establish the cause of the waste.
          </span>
        </div>
      </div>

      {/* Section 16 Hotspot Chronological Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Deterministic Hotspot Timeline
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {events.length} chronological events
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading timeline from DynamoDB...
          </div>
        ) : events.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-500 text-sm">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No events recorded for this hotspot</p>
            <p className="text-xs text-slate-400 mt-1">Submit a report to begin tracking this hotspot.</p>
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-slate-200 space-y-8 my-4 ml-3">
            {events.map((ev) => (
              <div key={ev.id} className="relative group">
                {/* Event node dot */}
                <div className="absolute -left-[31px] top-1 w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center group-hover:border-emerald-600 transition shadow-2xs">
                  {getEventIcon(ev.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(ev.timestamp).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        ev.type === 'RECURRENCE'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : ev.type === 'CLEANUP'
                          ? 'bg-sky-100 text-sky-800'
                          : ev.type === 'FOLLOWUP'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ev.statusBadge || ev.type}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{ev.title}</h3>
                  <p className="text-xs text-slate-600">{ev.description}</p>

                  {ev.actor && (
                    <div className="text-[11px] text-slate-400 font-mono">
                      Action by: {ev.actor}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
