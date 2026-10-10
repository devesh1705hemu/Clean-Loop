'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  ArrowRight,
  Info,
} from 'lucide-react';
import { PREDEFINED_HOTSPOTS } from '@/types';

export default function HotspotsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Predefined Campus Hotspots
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic geographic anchors for waste reports, cleanups, and recurrence tracking
          </p>
        </div>

        <Link
          href="/report"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
        >
          <span>Report at a Hotspot</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Recurrence Disclaimer */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Deterministic Recurrence Notice:</strong> Recurrence indicates repeated observations for the same hotspot anchor. It does not establish the cause of the waste.
        </div>
      </div>

      {/* Hotspots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PREDEFINED_HOTSPOTS.map((hotspot) => {
          return (
            <div
              key={hotspot.hotspotId}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition p-6 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                    {hotspot.hotspotId}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {hotspot.status}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {hotspot.name}
                  </h2>
                  <div className="text-xs font-medium text-emerald-700 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    <span>{hotspot.area}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {hotspot.description}
                </p>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500 font-mono">
                  <div>Lat: {hotspot.latitude.toFixed(4)}</div>
                  <div>Lng: {hotspot.longitude.toFixed(4)}</div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/report?hotspotId=${hotspot.hotspotId}`}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Report Here
                </Link>
                <Link
                  href={`/hotspots/${hotspot.hotspotId}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                >
                  <span>View Timeline & History</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
