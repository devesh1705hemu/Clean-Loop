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
} from 'lucide-react';
import {
  FollowUpCondition,
  FollowUpRecord,
  PREDEFINED_HOTSPOTS,
} from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api, getLocalFollowUps } from '@/lib/api';

export default function FollowupsPage() {
  return (
    <ProtectedRoute allowedRoles={['CLEANUP_TEAM', 'ADMIN']}>
      <FollowupsContent />
    </ProtectedRoute>
  );
}

function FollowupsContent() {
  const [followups, setFollowups] = useState<FollowUpRecord[]>(() => getLocalFollowUps());
  const [targetIncidentId, setTargetIncidentId] = useState('INC-100001');
  const [targetHotspotId, setTargetHotspotId] = useState('HOTSPOT-001');
  const [condition, setCondition] = useState<FollowUpCondition>('CLEAN');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch from API
  useEffect(() => {
    let isMounted = true;
    api.getFollowUps().then((res) => {
      if (isMounted && res.success && res.data) {
        setFollowups(res.data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

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
          `Follow-up audit ${res.data.followUpId} recorded in DynamoDB! Condition: ${condition}`
        );
        setNotes('');
      } else {
        setErrorMessage(res.error?.message || 'Failed to save follow-up.');
      }
    } catch {
      setErrorMessage('Failed to communicate with API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConditionStyle = (cond: FollowUpCondition) => {
    switch (cond) {
      case 'CLEAN':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'WASTE_PRESENT':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'PARTIALLY_CLEAN':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'UNKNOWN':
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="w-6 h-6 text-amber-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Follow-up Verification Audits
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Determine whether cleaned hotspots remained CLEAN or if WASTE_PRESENT triggered recurrence
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
        >
          <span>View Recurrence Metrics</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Synthetic data label */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] text-slate-600 flex items-center justify-between">
        <span>Synthetic data for development/demo only. Validates deterministic recurrence loop.</span>
        <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">WORKFLOW STEP 3</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Record Follow-up Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-amber-600" />
            Record New Follow-up
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Target Incident ID *
              </label>
              <input
                type="text"
                required
                value={targetIncidentId}
                onChange={(e) => setTargetIncidentId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Hotspot Location *
              </label>
              <select
                value={targetHotspotId}
                onChange={(e) => setTargetHotspotId(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
              >
                {PREDEFINED_HOTSPOTS.map((h) => (
                  <option key={h.hotspotId} value={h.hotspotId}>
                    {h.name} [{h.hotspotId}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Audited Condition *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['CLEAN', 'WASTE_PRESENT', 'PARTIALLY_CLEAN', 'UNKNOWN'] as FollowUpCondition[]).map(
                  (c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCondition(c)}
                      className={`p-2 rounded-lg border text-xs font-bold transition ${
                        condition === c
                          ? c === 'CLEAN'
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-800'
                            : c === 'WASTE_PRESENT'
                            ? 'bg-red-100 border-red-500 text-red-800 ring-2 ring-red-400'
                            : 'bg-amber-100 border-amber-500 text-amber-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {c}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Observation Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observations on site condition, residual traces, or new accumulation..."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs placeholder-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Observation...' : 'Submit Follow-up Audit'}
            </button>
          </form>
        </div>

        {/* Follow-up Feed */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
            Observation Log ({followups.length})
          </h2>

          <div className="space-y-3">
            {followups.map((f) => {
              const hotspot = PREDEFINED_HOTSPOTS.find(
                (h) => h.hotspotId === f.hotspotId
              );

              return (
                <div
                  key={f.followUpId}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {f.followUpId}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getConditionStyle(
                          f.condition
                        )}`}
                      >
                        {f.condition}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Incident: {f.incidentId}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(f.observedAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-slate-900">
                    Location: {hotspot ? hotspot.name : f.hotspotId}
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {f.notes}
                  </p>

                  {/* Section 12 Special Action: If WASTE_PRESENT, allow creating new incident */}
                  {f.condition === 'WASTE_PRESENT' && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between bg-red-50/50 p-2.5 rounded-lg border border-red-100">
                      <div className="flex items-center gap-1.5 text-xs text-red-800 font-medium">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span>Waste returned post-cleanup! Triggers recurrence calculation.</span>
                      </div>
                      <Link
                        href={`/report?hotspotId=${f.hotspotId}`}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs transition inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        File Incident B
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
