'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Upload,
  CheckCircle,
  AlertCircle,
  MapPin,
  Tag,
  Camera,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { PREDEFINED_HOTSPOTS, WASTE_CATEGORIES, WasteCategory } from '@/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api } from '@/lib/api';

export default function ReportWastePage() {
  return (
    <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
      <ReportWasteForm />
    </ProtectedRoute>
  );
}

function ReportWasteForm() {

  // Form State
  const [hotspotId, setHotspotId] = useState('');
  const [wasteCategory, setWasteCategory] = useState<WasteCategory>('Plastic');
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successIncidentId, setSuccessIncidentId] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file size (< 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size must be less than 5MB.');
        return;
      }

      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setErrorMessage('Only JPG, PNG, and WebP images are allowed.');
        return;
      }

      setErrorMessage('');
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Field Validations
    if (!hotspotId) {
      setErrorMessage('Please select a campus hotspot location.');
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
      });

      if (res.success && res.data) {
        setSuccessIncidentId(res.data.incidentId);
      } else {
        setErrorMessage(res.error?.message || 'Failed to submit report.');
      }
    } catch {
      setErrorMessage('Failed to submit waste report. Please try again.');
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
        Back to Dashboard
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="border-b border-slate-100 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Report Campus Waste
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Initiate the CleanLoop lifecycle for an observed waste deposit
              </p>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Submission Error</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Success State */}
        {successIncidentId ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Incident Reported Successfully!</h2>
              <p className="text-xs text-slate-600 mt-1">
                Incident ID: <strong className="font-mono text-emerald-800">{successIncidentId}</strong>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                The report is recorded with status <strong className="font-mono">REPORTED</strong> and queued for cleanup dispatch.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/incidents"
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition"
              >
                View Incident Feed
              </Link>
              <button
                onClick={() => {
                  setSuccessIncidentId(null);
                  setDescription('');
                  setPhotoFile(null);
                  setPhotoPreview(null);
                }}
                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
              >
                Report Another Incident
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Hotspot Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                1. Select Hotspot Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <select
                  required
                  value={hotspotId}
                  onChange={(e) => setHotspotId(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">-- Choose Predefined Campus Hotspot --</option>
                  {PREDEFINED_HOTSPOTS.map((spot) => (
                    <option key={spot.hotspotId} value={spot.hotspotId}>
                      {spot.name} ({spot.area}) • [{spot.hotspotId}]
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Deterministic matching uses predefined hotspots without complex clustering.
              </p>
            </div>

            {/* Waste Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                2. Waste Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {WASTE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setWasteCategory(cat)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                      wasteCategory === cat
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2" htmlFor="desc">
                3. Incident Description <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  id="desc"
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the waste situation, volume, exact landmark proximity..."
                  className="block w-full p-3 border border-slate-300 rounded-xl text-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Provide concise notes to help the cleanup team locate the litter quickly.
              </p>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                4. Photo Evidence (Optional)
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 hover:border-slate-400 transition text-center bg-slate-50/50">
                {photoPreview ? (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="max-h-48 rounded-lg mx-auto object-cover border border-slate-200"
                    />
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-xs text-slate-600 font-medium">
                        {photoFile?.name} ({(photoFile!.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                        className="text-xs text-red-600 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <label
                      htmlFor="photo-upload"
                      className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Select Photo
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <p className="text-[11px] text-slate-400 mt-2">
                      PNG, JPG, or WebP up to 5MB. Stored securely in private Amazon S3.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Creating Incident in DynamoDB...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span>Submit Waste Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
