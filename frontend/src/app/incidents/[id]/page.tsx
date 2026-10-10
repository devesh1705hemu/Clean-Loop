'use client';

import React, { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  User,
  Clock,
  Sparkles,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { PREDEFINED_HOTSPOTS, Incident } from '@/types';


import { api, getLocalIncidents } from '@/lib/api';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function IncidentDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const incidentId = resolvedParams.id;

  const DEFAULT_INCIDENT: Incident = {
    incidentId,
    hotspotId: 'HOTSPOT-001',
    reportedBy: 'student.dev@university.edu',
    reportedAt: '2026-10-06T09:15:00Z',
    wasteCategory: 'Plastic',
    description: 'Incident details loading...',
    status: 'REPORTED',
    createdAt: '2026-10-06T09:15:00Z',
    updatedAt: '2026-10-06T09:15:00Z',
  };

  const [incident, setIncident] = React.useState<Incident>(DEFAULT_INCIDENT);

  React.useEffect(() => {
    let isMounted = true;
    const list = getLocalIncidents();
    const found = list.find((i) => i.incidentId === incidentId);
    if (found) {
      setIncident(found);
    }
    api.getIncidentById(incidentId).then((res) => {
      if (isMounted && res.success && res.data) {
        setIncident(res.data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [incidentId]);

  const hotspot = PREDEFINED_HOTSPOTS.find((h) => h.hotspotId === incident.hotspotId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <Link
        href="/incidents"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Incidents
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded">
                {incident.incidentId}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                {incident.status}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {incident.wasteCategory} Waste Incident
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/cleanup"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Manage Cleanup
            </Link>
            <Link
              href="/followups"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              Log Follow-up
            </Link>
          </div>
        </div>

        {/* Hotspot & Meta Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Hotspot Location
            </span>
            <div className="mt-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <Link
                href={`/hotspots/${incident.hotspotId}`}
                className="text-sm font-bold text-slate-900 hover:text-emerald-700 hover:underline"
              >
                {hotspot ? hotspot.name : incident.hotspotId}
              </Link>
            </div>
            <p className="text-xs text-slate-500 mt-1">{hotspot?.area}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Reported By
            </span>
            <div className="mt-1 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-bold text-slate-900 font-mono">
                {incident.reportedBy}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {new Date(incident.reportedAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Description
          </h3>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed font-medium">
            {incident.description}
          </div>
        </div>

        {/* Photo Evidence Placeholder */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Photo Evidence
          </h3>
          <div className="p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
            No media attached for this incident record.
          </div>
        </div>

        {/* Lifecycle Phase Step Tracker */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Workflow Progress
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>1. Reported</span>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>2. Cleaned</span>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>3. Follow-up Needed</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 font-medium flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px]">4</span>
              <span>4. Recurrence Check</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
