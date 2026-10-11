'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  Camera,
  Play,
  ArrowRight,
  AlertCircle,
  Upload,
  Clock,
  MapPin,
  ChevronRight,
  X,
  Shield,
  Layers,
} from 'lucide-react';
import { PREDEFINED_HOTSPOTS, Incident } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api, getLocalIncidents } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';

interface CleanupTask extends Incident {
  cleanupNotes?: string;
}

export default function CleanupPage() {
  return (
    <ProtectedRoute allowedRoles={['CLEANUP_TEAM', 'ADMIN']}>
      <CleanupQueue />
    </ProtectedRoute>
  );
}

function CleanupQueue() {
  const [tasks, setTasks] = useState<CleanupTask[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'IN_PROGRESS' | 'CLEANED'>('PENDING');
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Sync latest incidents from backend / local persistence
  useEffect(() => {
    let isMounted = true;
    const local = getLocalIncidents();
    if (local.length > 0) {
      setTasks(local);
    }
    api.getIncidents().then((res) => {
      if (isMounted && res.success && res.data) {
        setTasks(res.data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const activeTask = tasks.find((t) => t.incidentId === selectedIncidentId);

  const pendingTasks = tasks.filter((t) => t.status === 'REPORTED');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const cleanedTasks = tasks.filter((t) => t.status === 'CLEANED' || t.status === 'RESOLVED');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size must be under 5MB.');
        return;
      }
      setErrorMessage('');
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
  };

  const handleStartCleanup = async (incidentId: string) => {
    setErrorMessage('');
    try {
      await api.updateIncidentStatus(incidentId, 'IN_PROGRESS');
      setTasks((prev) =>
        prev.map((t) =>
          t.incidentId === incidentId ? { ...t, status: 'IN_PROGRESS' } : t
        )
      );
      setSelectedIncidentId(incidentId);
      setActiveTab('IN_PROGRESS');
    } catch {
      setErrorMessage('Failed to start cleanup.');
    }
  };

  const handleCompleteCleanup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncidentId || !activeTask) return;

    if (!notes.trim()) {
      setErrorMessage('Please add cleanup execution notes.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      let uploadedPhotoKey: string | undefined = undefined;

      if (photoFile) {
        const presignRes = await api.requestPresignedUpload({
          fileName: photoFile.name,
          contentType: photoFile.type,
          sizeBytes: photoFile.size,
        });

        if (presignRes.success && presignRes.data) {
          uploadedPhotoKey = presignRes.data.photoKey;
          await api.uploadToPresignedUrl(presignRes.data.uploadUrl, photoFile);
        }
      }

      const res = await api.createCleanup({
        incidentId: activeTask.incidentId,
        hotspotId: activeTask.hotspotId,
        notes: notes.trim(),
        photoKey: uploadedPhotoKey,
        status: 'COMPLETED',
      });

      if (res.success && res.data) {
        setTasks((prev) =>
          prev.map((t) =>
            t.incidentId === selectedIncidentId
              ? { ...t, status: 'CLEANED', cleanupNotes: notes }
              : t
          )
        );
        setSuccessMessage(
          `Cleanup ${res.data.cleanupId} recorded! Incident ${selectedIncidentId} updated to CLEANED. Queued for follow-up verification audit.`
        );
        setSelectedIncidentId(null);
        setNotes('');
        removePhoto();
        setActiveTab('CLEANED');
      } else {
        setErrorMessage(res.error?.message || 'Failed to record cleanup.');
      }
    } catch {
      setErrorMessage('Error communicating with API.');
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
            <span className="p-1.5 rounded-lg bg-sky-100 text-sky-800">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Cleanup Crew Operations
            </h1>
            <span className="text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-0.5 rounded-full uppercase">
              Field Execution
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Dispatch queue for maintenance personnel to claim incidents, upload completion photos, and update status.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          <span>Operations Dashboard</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-700 font-bold hover:underline">
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
          <button onClick={() => setErrorMessage('')} className="text-rose-700 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Task Queue Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`pb-3 px-3 transition flex items-center gap-2 border-b-2 ${
            activeTab === 'PENDING'
              ? 'border-amber-600 text-amber-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Unassigned Queue</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[11px] font-mono">
            {pendingTasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('IN_PROGRESS')}
          className={`pb-3 px-3 transition flex items-center gap-2 border-b-2 ${
            activeTab === 'IN_PROGRESS'
              ? 'border-sky-600 text-sky-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Active Cleanups</span>
          <span className="px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800 text-[11px] font-mono">
            {inProgressTasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CLEANED')}
          className={`pb-3 px-3 transition flex items-center gap-2 border-b-2 ${
            activeTab === 'CLEANED'
              ? 'border-emerald-600 text-emerald-900 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Cleaned & Logged</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-mono">
            {cleanedTasks.length}
          </span>
        </button>
      </div>

      {/* Main Grid: Left List + Right Action Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Task Cards List */}
        <div className="lg:col-span-2 space-y-3">
          {activeTab === 'PENDING' && (
            pendingTasks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-700 text-sm">No Pending Reports</p>
                <p className="text-slate-400 mt-1">All campus waste reports have been claimed or resolved.</p>
              </div>
            ) : (
              pendingTasks.map((t) => (
                <div
                  key={t.incidentId}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {t.incidentId}
                      </span>
                      <StatusBadge status={t.status} size="sm" />
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {t.wasteCategory}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{getHotspotName(t.hotspotId)}</span>
                    </div>

                    <p className="text-xs text-slate-600 max-w-lg">
                      {t.description}
                    </p>

                    <div className="text-[11px] text-slate-400 font-mono">
                      Reported: {new Date(t.createdAt || t.reportedAt).toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartCleanup(t.incidentId)}
                    className="self-start sm:self-center px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Claim & Clean</span>
                  </button>
                </div>
              ))
            )
          )}

          {activeTab === 'IN_PROGRESS' && (
            inProgressTasks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-500 text-xs">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700 text-sm">No Cleanups Currently In Progress</p>
                <p className="text-slate-400 mt-1">Claim a report from the Unassigned Queue to begin.</p>
              </div>
            ) : (
              inProgressTasks.map((t) => (
                <div
                  key={t.incidentId}
                  className={`bg-white rounded-2xl border p-5 shadow-2xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    selectedIncidentId === t.incidentId ? 'border-sky-500 ring-2 ring-sky-500/10' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {t.incidentId}
                      </span>
                      <StatusBadge status="IN_PROGRESS" size="sm" />
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {t.wasteCategory}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{getHotspotName(t.hotspotId)}</span>
                    </div>

                    <p className="text-xs text-slate-600 max-w-lg">
                      {t.description}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedIncidentId(t.incidentId)}
                    className="self-start sm:self-center px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs shrink-0"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete Proof Form</span>
                  </button>
                </div>
              ))
            )
          )}

          {activeTab === 'CLEANED' && (
            cleanedTasks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-500 text-xs">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700 text-sm">No Cleaned Incidents Yet</p>
                <p className="text-slate-400 mt-1">Completed cleanups will appear here with proof logs.</p>
              </div>
            ) : (
              cleanedTasks.map((t) => (
                <div
                  key={t.incidentId}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {t.incidentId}
                      </span>
                      <StatusBadge status="CLEANED" size="sm" />
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {t.wasteCategory}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{getHotspotName(t.hotspotId)}</span>
                    </div>

                    <p className="text-xs text-slate-600 max-w-lg">
                      {t.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/incidents/${t.incidentId}`}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                    >
                      View Timeline
                    </Link>
                    <Link
                      href="/followups"
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition"
                    >
                      Audit
                    </Link>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* Right: Completion Form / Action Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs h-fit space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-sky-600" />
              <span>Record Cleanup Execution</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit proof and mark incident status as CLEANED
            </p>
          </div>

          {selectedIncidentId && activeTask ? (
            <form onSubmit={handleCompleteCleanup} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">
                  Target: {activeTask.incidentId}
                </div>
                <div className="text-slate-600">
                  Location: {getHotspotName(activeTask.hotspotId)}
                </div>
                <div className="text-[11px] text-slate-500 italic">
                  &ldquo;{activeTask.description}&rdquo;
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cleanup Execution Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detail tools used, waste collected, site sanitization..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  After-Cleanup Photo (Optional)
                </label>
                {photoPreview ? (
                  <div className="relative border border-slate-200 rounded-xl overflow-hidden">
                    <img src={photoPreview} alt="Proof" className="w-full h-32 object-cover" />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute top-2 right-2 p-1 bg-slate-900/80 text-white rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="border border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 block transition">
                    <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                    <span className="text-slate-600 font-semibold">Upload after-cleanup photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIncidentId(null)}
                  className="px-3 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {isSubmitting ? 'Recording...' : 'Mark CLEANED'}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs space-y-2 border border-dashed border-slate-200 rounded-xl">
              <Sparkles className="w-6 h-6 text-slate-300 mx-auto" />
              <p className="font-medium text-slate-600">No Task Selected</p>
              <p className="text-[11px] text-slate-400">
                Select an incident from the Active Cleanups queue to log notes and photographic evidence.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
