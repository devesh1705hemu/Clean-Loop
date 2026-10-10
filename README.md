# CleanLoop MVP

> **The Trash That Came Back. Track. Clean. Prevent. Repeat.**

CleanLoop connects waste reports, cleanup activity, follow-up observations, and recurring hotspots to make environmental problems easier to understand.

> ⚠️ **Notice**: CleanLoop is currently under development. This MVP proves deterministic recurrence tracking and does not claim environmental impact.

---

## 1. MVP Core Workflow

```text
Student → Login → Report Waste → Incident Created
  ↓
Cleanup Team → Cleanup Recorded (CLEANED)
  ↓
Follow-up Observation → Waste Clean OR Waste Returns (WASTE_PRESENT)
  ↓
New Incident for Same Hotspot → Recurrence Calculated Deterministically
  ↓
Admin Dashboard → Recurring Hotspot Identified + Chronological Timeline
```

---

## 2. 5 Predefined Hotspots

- `HOTSPOT-001`: Library Gate
- `HOTSPOT-002`: Main Entrance
- `HOTSPOT-003`: Cafeteria Area
- `HOTSPOT-004`: Science Block
- `HOTSPOT-005`: Parking Area

---

## 3. Technology Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Lucide icons
- **AWS Serverless**:
  - Amazon Cognito (Groups: `STUDENT`, `CLEANUP_TEAM`, `ADMIN`)
  - Amazon API Gateway (REST API with Cognito Authorizer)
  - AWS Lambda (Node.js 20.x runtime)
  - Amazon DynamoDB (Single-Table Design with `GSI1` & `GSI2`)
  - Amazon S3 (Private evidence bucket with presigned URLs)
  - Amazon CloudWatch (Structured application logging)
- **Infrastructure as Code**: AWS CDK v2 (TypeScript)

---

## 4. Repository Structure

```text
Cleanloop/
├── docs/
│   ├── architecture.md       # AWS Serverless architecture specification
│   ├── database.md           # DynamoDB single-table design & access patterns
│   ├── deployment.md         # Phase 11 AWS deployment guide
│   └── future-roadmap.md     # Out-of-scope features & roadmap
├── frontend/                 # Next.js 16 + React 19 + Tailwind CSS + TypeScript
│   ├── src/
│   │   ├── app/              # App Router pages (/login, /register, /dashboard, /report, etc.)
│   │   ├── components/       # UI components (Navbar, Footer, ProtectedRoute)
│   │   ├── context/          # Cognito AuthContext
│   │   ├── lib/              # Universal API client & Cognito helper
│   │   └── types/            # Domain interfaces & predefined hotspots
│   └── .env.example          # Environment variables template
├── infra/                    # AWS CDK TypeScript infrastructure stack
│   ├── bin/infra.ts          # CDK entrypoint
│   └── lib/cleanloop-stack.ts# CloudFormation stack resources
└── backend/                  # AWS Lambda handlers & services
    ├── src/
    │   ├── handlers/         # Lambda endpoints (incidents, cleanups, followups, hotspots, analytics, uploads)
    │   ├── services/         # Deterministic recurrence engine & DynamoDB client
    │   ├── scripts/          # Synthetic data seed script (Section 22)
    │   └── utils/            # Structured logging & standard API response
    └── tests/                # 34 automated unit, contract & scenario tests (Section 18 & 23)
```

---

## 5. Development & Testing Commands

### Run Automated Tests (Section 23)
```bash
cd backend
npm test
```
All 34 unit, contract, and scenario tests pass with 0 failures.

### Build All Packages
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build

# CDK Infrastructure
cd infra && npm run build && npx cdk synth
```

### Local Dev Server
```bash
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### Deploy to AWS (Phase 11)
See [docs/deployment.md](docs/deployment.md) for step-by-step instructions.
