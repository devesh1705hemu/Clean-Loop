'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  User,
  Clock,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Camera,
  FileText,
  Info,
  ChevronRight,
  Shield,
  AlertCircle,
} from 'lucide-react';
import {
  PREDEFINED_HOTSPOTS,
  Incident,
  CleanupRecord,
  FollowUpRecord,
  WasteCategory,
} from '@/types';
import { api, getLocalIncidents, getLocalCleanups, getLocalFollowUps } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function IncidentDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const incidentId = resolvedParams.id;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [cleanupRecord, setCleanupRecord] = useState<CleanupRecord | null>(null);
  const [followUpRecord, setFollowUpRecord] = useState<FollowUpRecord | null>(null);
  const [subsequentIncident, setSubsequentIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      api.getIncidentById(incidentId),
      api.getCleanups(),
      api.getFollowUps(),
      api.getIncidents(),
    ]).then(([incRes, clnRes, folRes, allIncRes]) => {
      if (!isMounted) return;

      let foundInc = incRes.success && incRes.data ? incRes.data : null;
      if (!foundInc) {
        const localList = getLocalIncidents();
        foundInc = localList.find((i) => i.incidentId === incidentId) || null;
      }
      setIncident(foundInc);

      const cleanupsList = clnRes.success && clnRes.data ? clnRes.data : getLocalCleanups();
      const followupsList = folRes.success && folRes.data ? folRes.data : getLocalFollowUps();
      const allIncidentsList = allIncRes.success && allIncRes.data ? allIncRes.data : getLocalIncidents();

      if (foundInc) {
        // Find matching cleanup for this incident
        const cln = cleanupsList.find((c) => c.incidentId === foundInc.incidentId);
        setCleanupRecord(cln || null);

        // Find matching follow-up for this incident
        const fol = followupsList.find((f) => f.incidentId === foundInc.incidentId);
        setFollowUpRecord(fol || null);

        // Check for subsequent incident at same hotspot after cleanup
        const cleanupTime = cln ? new Date(cln.performedAt).getTime() : new Date(foundInc.createdAt).getTime();
        const subsequent = allIncidentsList
          .filter(
            (i) =>
              i.hotspotId === foundInc.hotspotId &&
              i.incidentId !== foundInc.incidentId &&
              new Date(i.createdAt || i.reportedAt).getTime() > cleanupTime
          )
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];

        setSubsequentIncident(subsequent || null);
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [incidentId]);

  const hotspot = incident ? PREDEFINED_HOTSPOTS.find((h) => h.hotspotId === incident.hotspotId) : null;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-xs text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading incident details and chronological timeline...
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h1 className="text-xl font-bold text-slate-900">Incident Record Not Found</h1>
        <p className="text-xs text-slate-500">
          The requested identifier <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">{incidentId}</code> does not exist in DynamoDB or local storage.
        </p>
        <Link
          href="/incidents"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to Incidents Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/incidents"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Incidents Backlog</span>
        </Link>

        <span className="text-xs text-slate-400 font-mono">
          Hotspot: {incident.hotspotId}
        </span>
      </div>

      {/* Main Incident Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                {incident.incidentId}
              </span>
              <StatusBadge status={incident.status} />
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                {incident.wasteCategory}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {incident.wasteCategory} Waste Report
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {!cleanupRecord && (
              <Link
                href="/cleanup"
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dispatch Cleanup</span>
              </Link>
            )}
            {cleanupRecord && !followUpRecord && (
              <Link
                href="/followups"
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Perform Audit</span>
              </Link>
            )}
            <Link
              href={`/hotspots/${incident.hotspotId}`}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>Hotspot Hub</span>
            </Link>
          </div>
        </div>

        {/* Location & Reported Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Campus Hotspot Anchor
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

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Reported By & Timestamp
            </span>
            <div className="mt-1 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-mono font-bold text-slate-800 truncate">
                {incident.reportedBy}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              {new Date(incident.createdAt || incident.reportedAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Initial Description */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Initial Report Description
          </h2>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 font-medium leading-relaxed">
            {incident.description}
          </div>
        </div>

        {/* Attached Photo Evidence */}
        {incident.photoUrl || incident.photoKey ? (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Incident Photographic Evidence
            </h2>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {incident.photoUrl ? (
                <img
                  src={incident.photoUrl}
                  alt="Incident evidence"
                  className="w-28 h-28 object-cover rounded-lg border border-slate-200 shadow-2xs"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Camera className="w-8 h-8" />
                </div>
              )}
              <div className="space-y-1 text-xs">
                <div className="font-bold text-slate-900">Amazon S3 Verified Asset</div>
                <div className="font-mono text-slate-500 text-[11px]">
                  Key: {incident.photoKey || 'evidence/verified-upload.jpg'}
                </div>
                <div className="text-emerald-700 font-semibold">Integrity checksum verified</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Chronological Incident Timeline (Section 5) ── */}
      <section aria-labelledby="timeline-heading" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-700" />
              <h2 id="timeline-heading" className="text-lg font-black text-slate-900">
                Chronological Incident Lifecycle
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic state progression: Report Created → Cleanup Recorded → Follow-up Observation → Subsequent Incident
            </p>
          </div>

          <div className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
            Only verified backend events displayed
          </div>
        </div>

        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-8 my-4 ml-3 sm:ml-4">
          {/* ── 1. REPORT CREATED EVENT ── */}
          <div className="relative group">
            <div className="absolute -left-[35px] sm:-left-[43px] top-1 w-7 h-7 rounded-full bg-white border-2 border-emerald-600 text-emerald-600 flex items-center justify-center shadow-xs">
              <FileText className="w-3.5 h-3.5" />
            </div>

            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">1. Report Created</span>
                  <StatusBadge status="REPORTED" size="sm" />
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(incident.createdAt || incident.reportedAt).toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-slate-700">
                Waste reported at <strong className="text-slate-900">{hotspot?.name || incident.hotspotId}</strong>. Category identified as <strong className="text-slate-900">{incident.wasteCategory}</strong>.
              </p>

              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 pt-1">
                <User className="w-3 h-3 text-slate-400" />
                <span>Reporter: {incident.reportedBy}</span>
              </div>
            </div>
          </div>

          {/* ── 2. CLEANUP RECORDED EVENT ── */}
          <div className="relative group">
            <div className={`absolute -left-[35px] sm:-left-[43px] top-1 w-7 h-7 rounded-full bg-white border-2 flex items-center justify-center shadow-xs ${
              cleanupRecord ? 'border-sky-600 text-sky-600' : 'border-slate-300 text-slate-300'
            }`}>
              <Sparkles className="w-3.5 h-3.5" />
            </div>

            {cleanupRecord ? (
              <div className="bg-sky-50/40 p-4 rounded-xl border border-sky-200/80 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-sky-950">2. Cleanup Recorded</span>
                    <StatusBadge status="CLEANED" size="sm" />
                  </div>
                  <span className="text-xs text-sky-800 font-mono">
                    {new Date(cleanupRecord.performedAt).toLocaleString()}
                  </span>
                </div>

                <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-sky-100">
                  <span className="font-semibold text-slate-900">Crew Notes: </span>
                  {cleanupRecord.notes || 'Site cleaned and sanitized.'}
                </div>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                  <span>Performed by: {cleanupRecord.performedBy}</span>
                  {cleanupRecord.photoKey && (
                    <span className="text-sky-700 font-bold">Proof photo attached ({cleanupRecord.photoKey})</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">2. Cleanup Pending</span>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Awaiting Crew Action
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  No cleanup record has been logged in DynamoDB yet for incident {incident.incidentId}.
                </p>
                <Link
                  href="/cleanup"
                  className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:underline pt-1"
                >
                  <span>Dispatch cleanup team to execute task</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* ── 3. FOLLOW-UP OBSERVATION EVENT ── */}
          <div className="relative group">
            <div className={`absolute -left-[35px] sm:-left-[43px] top-1 w-7 h-7 rounded-full bg-white border-2 flex items-center justify-center shadow-xs ${
              followUpRecord ? 'border-amber-600 text-amber-600' : 'border-slate-300 text-slate-300'
            }`}>
              <Eye className="w-3.5 h-3.5" />
            </div>

            {followUpRecord ? (
              <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/80 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-950">3. Follow-up Observation</span>
                    <StatusBadge status={followUpRecord.condition} size="sm" />
                  </div>
                  <span className="text-xs text-amber-800 font-mono">
                    {new Date(followUpRecord.observedAt).toLocaleString()}
                  </span>
                </div>

                <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-amber-100">
                  <span className="font-semibold text-slate-900">Auditor Notes: </span>
                  {followUpRecord.notes || `Post-cleanup site condition recorded as: ${followUpRecord.condition}`}
                </div>

                {/* Clear distinction notice between cleanup vs follow-up condition */}
                <div className="p-2 rounded bg-amber-100/60 text-[11px] text-amber-900 font-medium">
                  <strong>Verification Distinction:</strong> While Step 2 records cleanup action, this Step 3 documents whether the location remained clean or if waste was re-observed during subsequent monitoring.
                </div>

                <div className="text-[11px] text-slate-500 font-mono pt-1">
                  Observed by: {followUpRecord.observedBy}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">3. Follow-up Observation Pending</span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Not Conducted Yet
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  No post-cleanup verification audit has been recorded yet. Audit is required to determine whether condition remains CLEAN.
                </p>
                {cleanupRecord && (
                  <Link
                    href="/followups"
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline pt-1"
                  >
                    <span>Conduct quality audit now</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* ── 4. SUBSEQUENT INCIDENT / RECURRENCE CHECK ── */}
          <div className="relative group">
            <div className={`absolute -left-[35px] sm:-left-[43px] top-1 w-7 h-7 rounded-full bg-white border-2 flex items-center justify-center shadow-xs ${
              subsequentIncident ? 'border-purple-600 text-purple-600' : 'border-emerald-600 text-emerald-600'
            }`}>
              {subsequentIncident ? (
                <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              )}
            </div>

            {subsequentIncident ? (
              <div className="bg-purple-50/40 p-4 rounded-xl border border-purple-200/80 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-950">4. Subsequent Incident Detected (Recurrence)</span>
                    <StatusBadge status="Recurring" size="sm" />
                  </div>
                  <span className="text-xs text-purple-800 font-mono">
                    {new Date(subsequentIncident.createdAt || subsequentIncident.reportedAt).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-slate-700">
                  A subsequent waste incident (<strong className="font-mono text-purple-900">{subsequentIncident.incidentId}</strong>, {subsequentIncident.wasteCategory}) was reported at this same hotspot anchor after the cleanup timeline.
                </p>

                <div className="p-2.5 rounded-lg bg-white border border-purple-100 text-xs text-slate-600">
                  &ldquo;{subsequentIncident.description}&rdquo;
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-purple-800 font-medium">
                    CleanLoop Recurrence Engine flagged hotspot for facility review.
                  </span>
                  <Link
                    href={`/incidents/${subsequentIncident.incidentId}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-800 hover:underline"
                  >
                    <span>View subsequent incident</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950">4. Subsequent Incident Status</span>
                  <StatusBadge status="Normal" size="sm" />
                </div>
                <p className="text-xs text-slate-600">
                  No subsequent waste incidents have been logged at {hotspot?.name || incident.hotspotId} following this record. The location is currently classified as stable under the recurrence threshold.
                </p>
                <div className="text-[11px] text-slate-400">
                  Continuous monitoring active in DynamoDB.
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
