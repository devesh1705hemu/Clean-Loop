'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Eye,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  AlertCircle,
  Clock,
  MapPin,
  Info,
  ChevronRight,
  Shield,
  FileCheck,
} from 'lucide-react';
import {
  FollowUpCondition,
  FollowUpRecord,
  PREDEFINED_HOTSPOTS,
  Incident,
} from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api, getLocalFollowUps, getLocalIncidents } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';

export default function FollowupsPage() {
  return (
    <ProtectedRoute allowedRoles={['CLEANUP_TEAM', 'ADMIN']}>
      <FollowupsContent />
    </ProtectedRoute>
  );
}

function FollowupsContent() {
  const [followups, setFollowups] = useState<FollowUpRecord[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [targetIncidentId, setTargetIncidentId] = useState('INC-100001');
  const [targetHotspotId, setTargetHotspotId] = useState('HOTSPOT-001');
  const [condition, setCondition] = useState<FollowUpCondition>('CLEAN');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch from API and sync local
  useEffect(() => {
    let isMounted = true;

    const loadData = () => {
      const local = getLocalFollowUps();
      if (local.length > 0) {
        setFollowups(local);
      }

      Promise.all([
        api.getFollowUps(),
        api.getIncidents(),
      ]).then(([folRes, incRes]) => {
        if (isMounted) {
          if (folRes.success && folRes.data) {
            setFollowups(folRes.data);
          }
          if (incRes.success && incRes.data) {
            setIncidents(incRes.data);
            if (incRes.data.length > 0 && !targetIncidentId) {
              setTargetIncidentId(incRes.data[0].incidentId);
              setTargetHotspotId(incRes.data[0].hotspotId);
            }
          }
        }
      });
    };

    loadData();
    window.addEventListener('cleanloop-data-change', loadData);

    return () => {
      isMounted = false;
      window.removeEventListener('cleanloop-data-change', loadData);
    };
  }, []);

  const handleIncidentSelect = (id: string) => {
    setTargetIncidentId(id);
    const inc = incidents.find((i) => i.incidentId === id);
    if (inc) {
      setTargetHotspotId(inc.hotspotId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setToastMessage('');

    if (!targetIncidentId.trim()) {
      setErrorMessage('Target Incident ID is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.createFollowUp({
        incidentId: targetIncidentId.trim(),
        hotspotId: targetHotspotId,
        condition,
        notes: notes.trim() || `Follow-up verification observed: ${condition}`,
      });

      if (res.success && res.data) {
        setFollowups((prev) => [res.data!, ...prev]);
        setToastMessage(
          `Follow-up audit ${res.data.followUpId} recorded! Observed condition: ${condition}`
        );
        setNotes('');
      } else {
        setErrorMessage(res.error?.message || 'Failed to save follow-up audit.');
      }
    } catch {
      setErrorMessage('Failed to communicate with API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHotspotName = (id: string) => {
    return PREDEFINED_HOTSPOTS.find((h) => h.hotspotId === id)?.name || id;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
              <Eye className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Follow-up Verification Audits
            </h1>
            <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase">
              Quality Assurance
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Independent site observation following cleanup to confirm whether hotspots remained CLEAN or if waste was re-observed.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold transition shadow-2xs"
        >
          <span>Operations Dashboard</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Distinction Explainer Alert */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Verification Distinction:</strong> Recording a cleanup certifies that the field team cleared the site. A follow-up audit is an independent subsequent observation to verify condition longevity and feed into the Recurrence Engine.
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Form + Audit History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Conduct Audit */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 h-fit">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-600" />
              <span>Log Post-Cleanup Audit</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select incident and record observed site state
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Target Incident Selection */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Target Incident ID <span className="text-rose-500">*</span>
              </label>
              {incidents.length > 0 ? (
                <select
                  value={targetIncidentId}
                  onChange={(e) => handleIncidentSelect(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {incidents.map((inc) => (
                    <option key={inc.incidentId} value={inc.incidentId}>
                      {inc.incidentId} — {getHotspotName(inc.hotspotId)} ({inc.status})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={targetIncidentId}
                  onChange={(e) => setTargetIncidentId(e.target.value)}
                  placeholder="INC-100001"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                />
              )}
            </div>

            {/* Target Hotspot */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Campus Hotspot Anchor <span className="text-rose-500">*</span>
              </label>
              <select
                value={targetHotspotId}
                onChange={(e) => setTargetHotspotId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {PREDEFINED_HOTSPOTS.map((spot) => (
                  <option key={spot.hotspotId} value={spot.hotspotId}>
                    {spot.name} ({spot.hotspotId})
                  </option>
                ))}
              </select>
            </div>

            {/* Condition Selector */}
            <div>
              <label className="block font-bold text-slate-700 mb-2">
                Observed Site Condition <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['CLEAN', 'WASTE_PRESENT', 'PARTIALLY_CLEAN', 'UNKNOWN'] as FollowUpCondition[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCondition(c)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition flex items-center justify-between ${
                      condition === c
                        ? c === 'CLEAN'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/10'
                          : c === 'WASTE_PRESENT'
                          ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/10'
                          : 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/10'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{c === 'CLEAN' ? 'Verified Clean' : c === 'WASTE_PRESENT' ? 'Waste Present' : c === 'PARTIALLY_CLEAN' ? 'Partially Clean' : 'Unknown'}</span>
                    {condition === c && <span className="w-2 h-2 rounded-full bg-current" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Audit Observation Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observed no litter remaining, bins emptied, or waste returned..."
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-60"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Logging Audit...' : 'Submit Quality Audit'}</span>
            </button>
          </form>
        </div>

        {/* Right List: Follow-up Audit Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>Logged Verification Audits</span>
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {followups.length} audits
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological records fed into DynamoDB recurrence analytics
                </p>
              </div>
            </div>

            {followups.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                <Eye className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No follow-up audits recorded yet</p>
                <p className="text-slate-400 mt-1">Submit your first inspection above to verify site condition.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {followups.map((f) => (
                  <div key={f.followUpId} className="p-5 hover:bg-slate-50/70 transition space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {f.followUpId}
                        </span>
                        <StatusBadge status={f.condition} size="sm" />
                        <span className="text-slate-500 font-mono text-[11px]">
                          Target: {f.incidentId}
                        </span>
                      </div>

                      <span className="text-slate-400 font-mono text-[11px]">
                        {new Date(f.observedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{getHotspotName(f.hotspotId)}</span>
                    </div>

                    <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      {f.notes}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                      <span>Auditor: {f.observedBy}</span>
                      <Link
                        href={`/incidents/${f.incidentId}`}
                        className="text-emerald-800 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <span>View incident timeline</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
