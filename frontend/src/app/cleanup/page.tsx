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
} from 'lucide-react';
import { PREDEFINED_HOTSPOTS, Incident } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api, getLocalIncidents } from '@/lib/api';

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
          `Cleanup ${res.data.cleanupId} recorded successfully! Incident ${selectedIncidentId} updated to CLEANED. Queued for follow-up audit.`
        );
        setSelectedIncidentId(null);
        setNotes('');
        setPhotoFile(null);
        setPhotoPreview(null);
      } else {
        setErrorMessage(res.error?.message || 'Failed to record cleanup.');
      }
    } catch {
      setErrorMessage('Failed to record cleanup in database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-sky-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Cleanup Team Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Accept reported incidents, record cleanup operations, upload evidence, and update status to CLEANED
          </p>
        </div>

        <Link
          href="/followups"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
        >
          <span>View Follow-up Audits</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Role authorization badge */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] text-slate-600 flex items-center justify-between">
        <span>Protected operational queue. Enforces CLEANUP_TEAM / ADMIN role authorization.</span>
        <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">ROLE: CLEANUP_TEAM</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
            Open Cleanup Backlog ({tasks.filter((t) => t.status !== 'CLEANED').length})
          </h2>

          <div className="space-y-3">
            {tasks.map((task) => {
              const hotspot = PREDEFINED_HOTSPOTS.find(
                (h) => h.hotspotId === task.hotspotId
              );
              const isSelected = selectedIncidentId === task.incidentId;

              return (
                <div
                  key={task.incidentId}
                  className={`p-5 rounded-xl border transition ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/40 ring-2 ring-sky-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {task.incidentId}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            task.status === 'CLEANED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : task.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {task.status}
                        </span>
                        <span className="text-xs text-slate-500">
                          {task.wasteCategory}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        {hotspot ? hotspot.name : task.hotspotId} ({hotspot?.area})
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {task.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                      {task.status === 'REPORTED' && (
                        <button
                          onClick={() => handleStartCleanup(task.incidentId)}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Start Cleanup
                        </button>
                      )}

                      {task.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => {
                            setSelectedIncidentId(task.incidentId);
                            setSuccessMessage('');
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Record Completion
                        </button>
                      )}

                      {task.status === 'CLEANED' && (
                        <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Cleaned & Logged
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Completion & Record Form (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4 h-fit">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Record Cleanup Details
          </h2>

          {activeTask ? (
            <form onSubmit={handleCompleteCleanup} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div>
                  Target: <strong className="font-mono text-slate-900">{activeTask.incidentId}</strong>
                </div>
                <div>Category: <strong>{activeTask.wasteCategory}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Cleanup Execution Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Details of cleaning (e.g. swept area, cleared 2 bins, sanitized ground)..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Upload Cleanup Proof (Optional)
                </label>
                <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center text-xs text-slate-500">
                  {photoPreview ? (
                    <div className="space-y-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoPreview}
                        alt="Evidence Preview"
                        className="max-h-32 mx-auto rounded object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Camera className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                      <label
                        htmlFor="cleanup-photo-upload"
                        className="cursor-pointer inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Upload className="w-3 h-3" />
                        Choose Photo
                      </label>
                      <input
                        id="cleanup-photo-upload"
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">S3 Private Evidence Storage</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition disabled:opacity-50"
              >
                {isSubmitting ? 'Recording in DynamoDB...' : 'Mark Status: CLEANED'}
              </button>
            </form>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
              <Sparkles className="w-6 h-6 mx-auto mb-2 text-slate-300" />
              <span>Select an &quot;IN_PROGRESS&quot; incident to record cleanup details.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
