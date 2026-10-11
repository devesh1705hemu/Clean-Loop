import React from 'react';
import Link from 'next/link';
import { Recycle, Cloud, Database, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-700 overflow-hidden flex items-center justify-center p-0.5">
                <img
                  src="/favicon.ico.png"
                  alt="CleanLoop Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">CleanLoop</span>
              <span className="text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
                MVP Prototype
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              CleanLoop connects waste reports, cleanup activity, follow-up observations, and recurring hotspots to make environmental problems easier to understand.
            </p>
          </div>

          {/* Core MVP Navigation */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">
              MVP Navigation
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/dashboard" className="text-slate-400 hover:text-white transition">
                  Role Dashboard
                </Link>
              </li>
              <li>
                <Link href="/report" className="text-slate-400 hover:text-white transition">
                  Report Waste
                </Link>
              </li>
              <li>
                <Link href="/incidents" className="text-slate-400 hover:text-white transition">
                  Incident Feed
                </Link>
              </li>
              <li>
                <Link href="/cleanup" className="text-slate-400 hover:text-white transition">
                  Cleanup Management
                </Link>
              </li>
              <li>
                <Link href="/followups" className="text-slate-400 hover:text-white transition">
                  Follow-up Log
                </Link>
              </li>
              <li>
                <Link href="/hotspots" className="text-slate-400 hover:text-white transition">
                  Predefined Hotspots
                </Link>
              </li>
            </ul>
          </div>

          {/* AWS Tech Stack */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">
              AWS Serverless Core
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Amazon Cognito Auth</span>
              </li>
              <li className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-sky-400" />
                <span>API Gateway + Lambda</span>
              </li>
              <li className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Amazon DynamoDB</span>
              </li>
              <li className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-sky-400" />
                <span>Amazon S3 Presigned Media</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
              Infrastructure as Code via AWS CDK
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
          CleanLoop MVP • Strictly for Demonstration and Validation Purposes
        </div>
      </div>
    </footer>
  );
}
