import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Eye,
  RefreshCw,
  LayoutDashboard,
  ShieldCheck,
  Cloud,
  Database,
  Lock,
  Layers,
  MapPin,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full">
      {/* Top Banner Notice */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-xs sm:text-sm text-amber-900 font-medium flex items-center justify-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>CleanLoop is currently under development.</strong> This MVP proves deterministic recurrence tracking and does not claim environmental impact.
        </span>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-white to-slate-50 pt-16 pb-20 md:pt-24 md:pb-28 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              Verified Proof-of-Concept Workflow
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              The Trash That Came Back.
              <span className="block text-emerald-600 mt-2 font-black">
                Track. Clean. Prevent. Repeat.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              CleanLoop connects waste reports, cleanup activity, follow-up observations, and recurring hotspots to make environmental problems easier to understand.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/report"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base shadow-lg shadow-emerald-600/25 transition duration-200"
              >
                <AlertTriangle className="w-5 h-5" />
                Report Waste
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              <Link
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-base shadow-sm transition duration-200"
              >
                Explore CleanLoop
              </Link>
            </div>

            {/* Workflow Pills */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-slate-600">
              <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
                1. Student Report
              </span>
              <span>→</span>
              <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
                2. Cleanup Recorded
              </span>
              <span>→</span>
              <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
                3. Follow-up Check
              </span>
              <span>→</span>
              <span className="bg-emerald-50 border border-emerald-300 text-emerald-800 font-semibold px-3 py-1.5 rounded-lg shadow-2xs">
                4. Recurrence Identified
              </span>
              <span>→</span>
              <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
                5. Admin Dashboard
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: The Problem */}
      <section className="py-16 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
              Section 1
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              The Problem: Disconnected Cleanups Hide Chronic Waste
            </h3>
            <p className="mt-3 text-base text-slate-600">
              Traditional waste reporting stops the moment an area is swept. Without follow-up verification, campus teams miss the recurrence cycle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Ephemeral Cleanups</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Trash is swept once, marked &quot;completed&quot;, but returns within 48 hours because waste generation sources remain invisible.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">No Verification Loop</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Standard reporting systems lack a formal follow-up observation stage to verify whether the location remained clean or accumulated trash again.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition">
              <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Missing Recurrence Metric</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Facilities coordinators cannot distinguish an isolated incident from a chronically recurring hotspot that requires structural intervention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: How CleanLoop Works */}
      <section id="how-it-works" className="py-16 md:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
              Section 2
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              How CleanLoop Works: The Closed Loop
            </h3>
            <p className="mt-3 text-base text-slate-600">
              A 5-step deterministic lifecycle ensuring continuous accountability from initial report to hotspot identification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {/* Step 1 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">STEP 1</span>
                <h4 className="text-base font-bold text-slate-900 mt-2 mb-1">Student Report</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Student logs in, chooses a predefined hotspot, picks waste category, and uploads photo evidence.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Status: REPORTED</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">STEP 2</span>
                <h4 className="text-base font-bold text-slate-900 mt-2 mb-1">Cleanup Action</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cleanup Team takes action, logs notes, optionally adds cleanup photo, and marks incident cleaned.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span>Status: CLEANED</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">STEP 3</span>
                <h4 className="text-base font-bold text-slate-900 mt-2 mb-1">Follow-up Audit</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Observation is performed. Is the site still CLEAN or did WASTE_PRESENT return?
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                <span>Audit Condition Log</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-5 rounded-xl border border-emerald-300 shadow-sm ring-2 ring-emerald-500/20 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">STEP 4</span>
                <h4 className="text-base font-bold text-slate-900 mt-2 mb-1">Recurrence Engine</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Deterministic algorithm calculates repeat incidents post-cleanup for the exact hotspot.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                <span>Deterministic Math</span>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">STEP 5</span>
                <h4 className="text-base font-bold text-slate-900 mt-2 mb-1">Admin Dashboard</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Aggregated hotspot timeline and rankings allow facilities to target chronic locations.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600" />
                <span>Full Timeline Feed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Core Features */}
      <section className="py-16 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
              Section 3
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Core MVP Features
            </h3>
            <p className="mt-3 text-base text-slate-600">
              Laser-focused functionality built to prove end-to-end incident tracking without non-essential bloat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50">
              <MapPin className="w-8 h-8 text-emerald-600 mb-3" />
              <h4 className="text-base font-bold text-slate-900 mb-1">5 Predefined Hotspots</h4>
              <p className="text-sm text-slate-600">
                Library Gate, Main Entrance, Cafeteria, Science Block, and Parking Area with fixed geographic references.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mb-3" />
              <h4 className="text-base font-bold text-slate-900 mb-1">Cognito Role-Based Auth</h4>
              <p className="text-sm text-slate-600">
                Strict permissions enforced at backend API Gateway and Lambda for STUDENT, CLEANUP_TEAM, and ADMIN.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50">
              <Cloud className="w-8 h-8 text-sky-600 mb-3" />
              <h4 className="text-base font-bold text-slate-900 mb-1">Presigned S3 Image Uploads</h4>
              <p className="text-sm text-slate-600">
                Secure direct-to-S3 photo uploads via presigned URLs. No public bucket exposure.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50">
              <Sparkles className="w-8 h-8 text-sky-600 mb-3" />
              <h4 className="text-base font-bold text-slate-900 mb-1">Cleanup Evidence Logging</h4>
              <p className="text-sm text-slate-600">
                Cleanup crews capture execution notes and completion timestamps before moving status to CLEANED.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50">
              <Eye className="w-8 h-8 text-amber-600 mb-3" />
              <h4 className="text-base font-bold text-slate-900 mb-1">Follow-up Verification Audit</h4>
              <p className="text-sm text-slate-600">
                Observers document condition (CLEAN vs. WASTE_PRESENT) to trigger immediate recurrence analysis.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50">
              <RefreshCw className="w-8 h-8 text-emerald-600 mb-3" />
              <h4 className="text-base font-bold text-slate-900 mb-1">Deterministic Recurrence Math</h4>
              <p className="text-sm text-slate-600">
                No black-box AI. Transparent rules-based classification (Normal, Monitor, Recurring) based on incident counts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: AWS Architecture */}
      <section className="py-16 md:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-xs font-bold text-sky-600 uppercase tracking-widest mb-2">
              Section 4
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              AWS Serverless Architecture
            </h3>
            <p className="mt-3 text-base text-slate-600">
              Serverless, reproducible, and minimal infrastructure defined via AWS CDK / SAM.
            </p>
          </div>

          <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="border border-slate-800 p-4 rounded-xl bg-slate-800/50">
                <div className="flex items-center gap-2 text-sky-400 font-semibold mb-2">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Amazon Cognito</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  User Pool with custom role groups: STUDENT, CLEANUP_TEAM, and ADMIN with JWT authorization.
                </p>
              </div>

              <div className="border border-slate-800 p-4 rounded-xl bg-slate-800/50">
                <div className="flex items-center gap-2 text-sky-400 font-semibold mb-2">
                  <Cloud className="w-5 h-5" />
                  <span>API Gateway & Lambda</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  RESTful routing with Cognito Authorizer dispatching to Node.js/TypeScript serverless functions.
                </p>
              </div>

              <div className="border border-slate-800 p-4 rounded-xl bg-slate-800/50">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2">
                  <Database className="w-5 h-5" />
                  <span>Amazon DynamoDB</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Single-table design supporting incident lookups, hotspot timelines, and recurrence aggregation.
                </p>
              </div>

              <div className="border border-slate-800 p-4 rounded-xl bg-slate-800/50">
                <div className="flex items-center gap-2 text-sky-400 font-semibold mb-2">
                  <Lock className="w-5 h-5" />
                  <span>Amazon S3 & CloudWatch</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Private bucket with signed PUT/GET links; CloudWatch audit logs for structured request diagnostics.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
              <span>Security: Least-Privilege IAM Roles</span>
              <span>Storage: Fully Private S3 Objects</span>
              <span>IaC: AWS CDK TypeScript Stack</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Why CleanLoop */}
      <section className="py-16 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
              Section 5
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Why CleanLoop?
            </h3>
            <p className="mt-3 text-base text-slate-600">
              Moving beyond vanity metrics to actionable recurrence intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Deterministic Proof over Guesses
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                By comparing incident dates directly after verified cleanups, campus administration gets empirical recurrence metrics rather than guessing why bins overflow.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Transparent Single Timeline
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every report, cleaning activity, and verification audit is stitched together into a chronological log for each campus location.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Current Project Status */}
      <section className="py-16 bg-slate-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5" />
              Section 6: Current Project Status
            </div>

            <h3 className="text-2xl font-bold text-slate-900">
              CleanLoop is currently under development.
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
              This system is an engineering MVP designed strictly to demonstrate data persistence and deterministic workflow execution across Amazon Cognito, API Gateway, AWS Lambda, Amazon DynamoDB, and Amazon S3.
            </p>

            <p className="text-xs text-slate-500 italic">
              Recurrence indicates repeated observations. It does not establish the root cause of the waste. No environmental claims are made.
            </p>

            <div className="pt-4 flex justify-center gap-3">
              <Link
                href="/dashboard"
                className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/report"
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
              >
                Submit Report
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
