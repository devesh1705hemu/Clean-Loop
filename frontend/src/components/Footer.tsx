import React from 'react';
import Link from 'next/link';
import { Cloud, Database, ShieldCheck, MapPin, RefreshCw, Sparkles, Layers } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-forest-800 text-white flex items-center justify-center p-1 shadow-xs">
                <img
                  src="/favicon.ico.png"
                  alt="CleanLoop"
                  className="w-full h-full object-contain brightness-110"
                />
              </div>
              <span className="text-lg font-black text-white tracking-tight">CleanLoop</span>
              <span className="text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full uppercase">
                Environmental Operations Platform
              </span>
            </div>
            <p className="text-slate-400 max-w-md leading-relaxed text-xs">
              CleanLoop tracks waste reports, cleanup dispatch, post-cleanup verification audits, and recurring hotspot intelligence to make environmental waste patterns transparent and actionable.
            </p>
            <div className="text-[11px] text-slate-500 pt-1">
              Recurrence indicates repeated observations for the same geographic anchor. It does not establish root cause.
            </div>
          </div>

          {/* Core Modules Navigation */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Platform Modules
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/dashboard" className="text-slate-400 hover:text-white transition">
                  Operations Dashboard
                </Link>
              </li>
              <li>
                <Link href="/report" className="text-slate-400 hover:text-white transition">
                  Report Waste
                </Link>
              </li>
              <li>
                <Link href="/incidents" className="text-slate-400 hover:text-white transition">
                  Incident Backlog Feed
                </Link>
              </li>
              <li>
                <Link href="/cleanup" className="text-slate-400 hover:text-white transition">
                  Cleanup Crew Queue
                </Link>
              </li>
              <li>
                <Link href="/followups" className="text-slate-400 hover:text-white transition">
                  Follow-up Audits
                </Link>
              </li>
              <li>
                <Link href="/hotspots" className="text-slate-400 hover:text-white transition">
                  Campus Hotspots & Recurrence
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="text-slate-400 hover:text-white transition">
                  Analytics & Trends
                </Link>
              </li>
            </ul>
          </div>

          {/* AWS Serverless Architecture */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              AWS Serverless Architecture
            </h3>
            <ul className="space-y-2 text-[11px] text-slate-400">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Amazon Cognito (RBAC)</span>
              </li>
              <li className="flex items-center gap-2">
                <Cloud className="w-3.5 h-3.5 text-sky-400" />
                <span>API Gateway + Lambda</span>
              </li>
              <li className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Amazon DynamoDB</span>
              </li>
              <li className="flex items-center gap-2">
                <Cloud className="w-3.5 h-3.5 text-sky-400" />
                <span>Amazon S3 Presigned Media</span>
              </li>
            </ul>
            <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
              Infrastructure as Code via AWS CDK v2
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 text-center text-[11px] text-slate-500">
          CleanLoop • Campus Environmental Waste Operations & Recurrence Engine
        </div>
      </div>
    </footer>
  );
}
