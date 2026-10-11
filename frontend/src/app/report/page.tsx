'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Upload,
  CheckCircle,
  AlertCircle,
  MapPin,
  Tag,
  Camera,
  ArrowLeft,
  X,
  FileText,
  Sparkles,
  Info,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { PREDEFINED_HOTSPOTS, WASTE_CATEGORIES, WasteCategory } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';

export default function ReportWastePage() {
  return <ReportWasteForm />;
}

function ReportWasteForm() {
  const { user, isAuthenticated, login } = useAuth();
  const [hotspotId, setHotspotId] = useState('HOTSPOT-001');
  const [wasteCategory, setWasteCategory] = useState<WasteCategory>('Plastic');
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successIncidentId, setSuccessIncidentId] = useState<string | null>(null);

  // Auto-detect hotspotId from URL search param if provided (e.g. /report?hotspotId=HOTSPOT-001)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlHotspot = params.get('hotspotId');
      if (urlHotspot && PREDEFINED_HOTSPOTS.some((h) => h.hotspotId === urlHotspot)) {
        setHotspotId(urlHotspot);
      }
    }
  }, []);

  const selectedHotspot = PREDEFINED_HOTSPOTS.find((h) => h.hotspotId === hotspotId);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size must be less than 5MB.');
        return;
      }

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setErrorMessage('Only JPG, PNG, and WebP images are supported.');
        return;
      }

      setErrorMessage('');
      setPhotoFile(file);

      // Convert to base64 Data URL for persistent offline/local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleFillDemoData = () => {
    const demoHotspot = PREDEFINED_HOTSPOTS[Math.floor(Math.random() * PREDEFINED_HOTSPOTS.length)];
    setHotspotId(demoHotspot.hotspotId);

    const categories: WasteCategory[] = ['Plastic', 'Food Waste', 'Mixed Waste', 'Paper'];
    const chosenCat = categories[Math.floor(Math.random() * categories.length)];
    setWasteCategory(chosenCat);

    const sampleDescriptions = [
      `Overflowing waste observed near the benches at ${demoHotspot.name}. Plastic containers and packaging discarded along the walkway perimeter.`,
      `Accumulation of food packaging and beverage cups left behind on the seating area of ${demoHotspot.name}.`,
      `Disposed takeout containers, food wrappers, and plastic water bottles scattered near the bike racks at ${demoHotspot.name}.`,
      `Substantial litter accumulation at ${demoHotspot.name} following evening student rush. Immediate cleanup recommended.`,
    ];
    setDescription(sampleDescriptions[Math.floor(Math.random() * sampleDescriptions.length)]);

    // Generate an authentic sample evidence visual as an SVG Data URL
    const svgData = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23f1f5f9"/><rect x="20" y="20" width="560" height="360" rx="16" fill="%23e2e8f0" stroke="%23cbd5e1" stroke-width="2"/><circle cx="300" cy="170" r="70" fill="%2310b981" opacity="0.15"/><path d="M260 200 L340 200 L330 250 L270 250 Z" fill="%23059669"/><rect x="250" y="190" width="100" height="10" rx="5" fill="%23047857"/><path d="M275 170 L325 170" stroke="%23059669" stroke-width="4" stroke-linecap="round"/><text x="300" y="300" font-family="sans-serif" font-size="16" font-weight="bold" fill="%230f172a" text-anchor="middle">Field Photo Evidence • CleanLoop</text><text x="300" y="325" font-family="sans-serif" font-size="12" fill="%2364748b" text-anchor="middle">${demoHotspot.name} • ${chosenCat}</text></svg>`;
    setPhotoPreview(svgData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!hotspotId) {
      setErrorMessage('Please select a campus hotspot anchor.');
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setErrorMessage('Description must be at least 5 characters long.');
      return;
    }

    setIsLoading(true);

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

      const res = await api.createIncident({
        hotspotId,
        wasteCategory,
        description: description.trim(),
        photoKey: uploadedPhotoKey,
        photoUrl: photoPreview || undefined,
      });

      if (res.success && res.data) {
        setSuccessIncidentId(res.data.incidentId);
      } else {
        setErrorMessage(res.error?.message || 'Failed to submit report.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred while submitting the report.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Operations Dashboard</span>
      </Link>

      {successIncidentId ? (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-8 text-center space-y-5 animate-in fade-in">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
            <CheckCircle className="w-8 h-8 text-emerald-700" />
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
              Report Successfully Recorded
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              Incident {successIncidentId} Generated
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Your waste observation has been recorded in DynamoDB and dispatched to field cleanup teams for action.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 max-w-sm mx-auto text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Hotspot Anchor:</span>
              <strong className="text-slate-900">{selectedHotspot?.name || hotspotId}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Waste Category:</span>
              <strong className="text-slate-900">{wasteCategory}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <StatusBadge status="REPORTED" size="sm" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={`/incidents/${successIncidentId}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold shadow-xs transition"
            >
              <span>View Incident Timeline</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => {
                setSuccessIncidentId(null);
                setDescription('');
                removePhoto();
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-2xs">
                <AlertTriangle className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Report Campus Waste
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Initiate the CleanLoop lifecycle for an observed waste deposit
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFillDemoData}
              id="fill-demo-data-btn"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition shadow-2xs cursor-pointer shrink-0 self-start sm:self-auto"
              title="Populate realistic dummy data and sample evidence for quick testing"
            >
              <Sparkles className="w-4 h-4 text-emerald-600 animate-spin-slow" />
              <span>Fill Demo Report Data</span>
            </button>
          </div>

          {/* Reporter Session Indicator */}
          {isAuthenticated && user ? (
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-900">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>
                  Reporting as: <strong className="font-semibold">{user.email}</strong> ({user.role})
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 bg-white border border-emerald-200 px-2 py-0.5 rounded-md">
                Verified Cognito Session
              </span>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-slate-600">
                Reporting as <strong className="text-slate-900">Campus Guest</strong>. Or sign in with 1 click:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => login('student.dev@university.edu', 'CleanLoop2026!', 'STUDENT')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] transition"
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => login('cleanup.team@university.edu', 'CleanLoop2026!', 'CLEANUP_TEAM')}
                  className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-bold text-[11px] transition"
                >
                  Cleanup Team
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Hotspot Location Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                1. Select Campus Hotspot Location <span className="text-rose-500">*</span>
              </label>
              <select
                value={hotspotId}
                onChange={(e) => setHotspotId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {PREDEFINED_HOTSPOTS.map((spot) => (
                  <option key={spot.hotspotId} value={spot.hotspotId}>
                    {spot.name} ({spot.area} • {spot.hotspotId})
                  </option>
                ))}
              </select>

              {selectedHotspot && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">{selectedHotspot.name}</span> — {selectedHotspot.description}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Waste Category Selection Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                2. Waste Category <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {WASTE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setWasteCategory(cat)}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition flex items-center justify-between ${
                      wasteCategory === cat
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/10'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat}</span>
                    {wasteCategory === cat && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Description */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                3. Situation Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what waste you observed, volume, exact spot near the anchor..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Minimum 5 characters. Be descriptive to aid cleanup routing.
              </span>
            </div>

            {/* 4. Photographic Evidence (Amazon S3 upload) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                4. Photographic Proof (Optional, max 5MB)
              </label>

              {photoPreview ? (
                <div className="relative inline-block border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <img
                    src={photoPreview}
                    alt="Uploaded preview"
                    className="w-48 h-36 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 p-1 bg-slate-900/80 text-white rounded-full hover:bg-slate-900 transition"
                    title="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="p-2 bg-white text-[11px] font-mono text-slate-500 truncate max-w-[192px]">
                    {photoFile?.name}
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center bg-slate-50/50 hover:bg-emerald-50/20 block">
                  <Camera className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-bold text-slate-700">Click to upload photo evidence</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, or WebP up to 5MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Submission Action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Data persists deterministically in Amazon DynamoDB.
              </span>
              <button
                type="submit"
                id="submit-waste-report-btn"
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition disabled:opacity-60 flex items-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Report...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Submit Waste Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
