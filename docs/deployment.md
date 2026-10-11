# CleanLoop MVP: AWS Serverless Deployment Guide

This guide walks through deploying the CleanLoop MVP to a live AWS environment using AWS CDK.
For the complete step-by-step production deployment manual with AWS CLI user creation scripts and AWS Amplify instructions, see [AWS_DEPLOYMENT_GUIDE.md](file:///c:/Users/Devesh%20arya/OneDrive/Desktop/Cleanloop/AWS_DEPLOYMENT_GUIDE.md).

---

## 1. Prerequisites

- **Node.js**: v20+ or v22+
- **AWS CLI**: Installed and configured (`aws configure` with Administrator or appropriate IAM privileges)
- **AWS CDK CLI**: v2.180.0+ (`npm install -g aws-cdk`)

---

## 2. Automated One-Command Deployment

CleanLoop includes automated end-to-end deployment scripts that perform pre-flight authentication verification, test validation, infrastructure synthesis, CDK deployment, and environment variable configuration in a single command:

### On Windows (PowerShell):
```powershell
# Live Cloud Deployment
.\deploy.ps1

# Dry-Run (Verifies builds, tests, and synth locally without provisioning cloud resources)
.\deploy.ps1 -DryRun
```

### On Linux / macOS / CI:
```bash
# Live Cloud Deployment
./deploy.sh

# Dry-Run
./deploy.sh --dry-run
```

The script automatically:
1. Validates AWS caller identity.
2. Compiles backend Lambdas and executes all 34 automated unit, contract, and workflow tests.
3. Synthesizes and deploys the CloudFormation stack via AWS CDK.
4. Generates `frontend/.env.local` directly from the CDK outputs.
5. Seeds synthetic demo records into DynamoDB.
6. Builds the frontend production bundle.

---

## 3. Manual Step-by-Step Deployment Workflow

### Step 2.1: Compile Backend Lambdas
The CDK stack packages Lambda code from `backend/dist`. Ensure TypeScript is compiled:

```bash
cd backend
npm install
npm run build
```

Verify that `backend/dist/handlers/` contains the compiled `.js` files:
- `incidents.js`
- `cleanups.js`
- `followups.js`
- `hotspots.js`
- `analytics.js`
- `uploads.js`

### Step 2.2: Execute Pre-Deployment Automated Tests
Run the test suite to ensure all recurrence scenarios, input/output contracts, and validation rules pass:

```bash
cd backend
npm test
```

Expected result:
```text
# tests 34
# suites 0
# pass 34
# fail 0
```

### Step 2.3: CDK Bootstrap & Deployment
Navigate to the `infra` directory:

```bash
cd infra
npm install
```

If deploying CDK to your AWS account/region for the first time:

```bash
npx cdk bootstrap
```

Synthesize and review the CloudFormation stack:

```bash
npx cdk synth
```

Deploy the stack to AWS:

```bash
npx cdk deploy --require-approval never
```

---

## 3. Post-Deployment Outputs & Configuration

Upon successful deployment, CDK outputs five critical resource attributes:

```text
Outputs:
CleanLoopStack.CleanLoopApiGatewayUrl = https://<api-id>.execute-api.us-east-1.amazonaws.com/prod/
CleanLoopStack.CleanLoopUserPoolId = us-east-1_xxxxxxxxx
CleanLoopStack.CleanLoopUserPoolClientId = xxxxxxxxxxxxxxxxxxxxxxxxxx
CleanLoopStack.CleanLoopTableName = CleanLoopTable
CleanLoopStack.CleanLoopBucketName = cleanloopstack-cleanloopmediabucket-xxxxxxxxx
```

### Configure Frontend Environment
Create `frontend/.env.local` using the CDK outputs:

```env
NEXT_PUBLIC_API_URL=https://<api-id>.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_S3_BUCKET=cleanloopstack-cleanloopmediabucket-xxxxxxxxx
```

---

## 4. Seed Synthetic Development Data (Optional)

To populate DynamoDB with clearly labeled development records demonstrating the critical test scenario:

```bash
cd backend
npm run seed
```

This populates:
- **`HOTSPOT-001`**: Incident A → Cleanup A → Follow-up A (CLEAN) → Incident B (Recurrence detected)
- **`HOTSPOT-002`**: 3 incidents (Threshold &ge; 3 → Recurring)
- **`HOTSPOT-003`**: Cleanup → Follow-up (WASTE_PRESENT)
- **`HOTSPOT-005`**: Single incident (Normal)

---

## 5. Host & Run Frontend

### Local Run:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000`.

### Production Build:
```bash
cd frontend
npm run build
npm run start
```

### AWS Amplify Hosting:
To host on AWS Amplify Hosting:
1. Connect your Git repository in the AWS Amplify Console.
2. Set build settings for Next.js SSR / Static export.
3. Configure the environment variables from Section 3 in Amplify Console under **App Settings > Environment Variables**.

---

## 6. Verification Checklist

- [ ] All 14 tests pass (`npm test` in backend)
- [ ] CDK stack deployed (`CleanLoopStack` status `CREATE_COMPLETE`)
- [ ] Cognito User Pool has groups: `STUDENT`, `CLEANUP_TEAM`, `ADMIN`
- [ ] DynamoDB table `CleanLoopTable` has GSIs `GSI1` and `GSI2`
- [ ] S3 bucket has Block Public Access enabled and encryption turned on
- [ ] Reporting waste uploads image via presigned S3 URL
- [ ] Cleaning incident updates status to `CLEANED`
- [ ] Second incident on same hotspot triggers deterministic recurrence elevation
- [ ] Admin dashboard correctly reflects recurrence and chronological timeline
