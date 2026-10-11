# CleanLoop MVP: Production AWS Deployment Guide

This comprehensive deployment document provides step-by-step instructions for deploying the **CleanLoop MVP** serverless architecture on Amazon Web Services (AWS).

---

## 1. Architecture Overview

CleanLoop utilizes a serverless architecture designed for scalability, zero idle compute costs, and high availability:

| Component | AWS Service | Purpose |
| :--- | :--- | :--- |
| **Frontend** | AWS Amplify Hosting / CloudFront + S3 | Next.js 16 Web Application with Role-Based Access Control (RBAC) |
| **Authentication** | Amazon Cognito User Pools | User directory with groups: `STUDENT`, `CLEANUP_TEAM`, `ADMIN` |
| **API Layer** | Amazon API Gateway (REST API) | Secured endpoints routing requests with Cognito Authorizer |
| **Compute** | AWS Lambda (Node.js 20.x/24.x) | 6 microservice functions (`incidents`, `cleanups`, `followups`, `hotspots`, `analytics`, `uploads`) |
| **Database** | Amazon DynamoDB | Single-table design (`CleanLoopTable`) with Global Secondary Indexes (`GSI1`, `GSI2`) |
| **Media Storage** | Amazon S3 | Private bucket for photographic evidence with Presigned URL uploads |
| **IaC Pipeline** | AWS CDK (v2) | Infrastructure as Code defining all cloud resources |

```
[Browser / Next.js Web App]
         │
         ├─── Authenticates ───► [Amazon Cognito User Pool]
         │                                (STUDENT, CLEANUP_TEAM, ADMIN)
         │
         ├─── Uploads Photos ──► [Amazon S3 Media Bucket]
         │                        (via Presigned PUT URLs)
         │
         └─── API Requests ────► [Amazon API Gateway]
                                          │ (Cognito Authorizer)
                                          ▼
                                   [AWS Lambda Functions]
                                   ├── Incidents Handler
                                   ├── Cleanups Handler
                                   ├── Follow-ups Handler
                                   ├── Hotspots Handler
                                   ├── Analytics Handler
                                   └── Presigned Uploads Handler
                                          │
                                          ▼
                                   [Amazon DynamoDB]
                                   (CleanLoopTable + GSI1 + GSI2)
```

---

## 2. Prerequisites & Local Environment Setup

Before starting the deployment, verify the following prerequisites on your machine:

### A. Required Software
1. **Node.js**: v20.x or v22.x LTS (`node -v`)
2. **npm**: v10+ (`npm -v`)
3. **AWS CLI v2**: (`aws --version`)
   - Windows installer: `msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi`
   - Linux: `curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && unzip awscliv2.zip && sudo ./aws/install`
   - macOS: `brew install awscli`
4. **AWS CDK CLI**:
   ```bash
   npm install -g aws-cdk
   cdk --version
   ```

### B. AWS Account & Credentials Configuration
Ensure you have an AWS account with IAM Administrator privileges or permissions covering CloudFormation, Lambda, DynamoDB, Cognito, S3, API Gateway, and IAM Role creation.

Configure your credentials locally:
```bash
aws configure
```
Enter your details:
- **AWS Access Key ID**: `AKIA...`
- **AWS Secret Access Key**: `wJalrX...`
- **Default region name**: `us-east-1` (or your preferred region, e.g., `ap-south-1`, `eu-west-1`)
- **Default output format**: `json`

Verify authentication:
```bash
aws sts get-caller-identity
```
You should see output similar to:
```json
{
    "UserId": "AIDAXAMPLE...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/deployer"
}
```

---

## 3. Pre-Flight Verification (Local Tests & Synthesis)

Before deploying to the cloud, verify that the code compiles, passes all 34 automated unit/contract tests, and synthesizes cleanly into CloudFormation:

```bash
# 1. Compile backend Lambdas and run test suite
cd backend
npm install
npm run build
npm test

# Expected:
# # tests 34
# # suites 0
# # pass 34
# # fail 0

# 2. Compile CDK infrastructure and test synth
cd ../infra
npm install
npm run build
npx cdk synth

# 3. Test frontend build
cd ../frontend
npm install
npm run build
cd ..
```

---

## 4. Method 1: Automated 1-Command Deployment (Recommended)

CleanLoop includes an automated deployment script that executes the complete pipeline: verifies AWS authentication, compiles Lambdas, runs all tests, synthesizes and deploys CloudFormation, exports outputs to `frontend/.env.local`, seeds synthetic demo data to DynamoDB, and builds the frontend.

### On Windows (PowerShell):
```powershell
# Live Deployment:
.\deploy.ps1

# Optional: Specify a custom region
.\deploy.ps1 -Region us-east-1

# Dry-Run (Verifies builds, tests, and synth locally without provisioning cloud resources):
.\deploy.ps1 -DryRun
```

### On Linux / macOS / CI:
```bash
chmod +x deploy.sh

# Live Deployment:
./deploy.sh

# Dry-Run:
./deploy.sh --dry-run
```

---

## 5. Method 2: Manual Step-by-Step Cloud Deployment

If you prefer deploying step-by-step or need granular control over each phase, follow these instructions:

### Step 5.1: Compile Backend Microservices
The AWS CDK packages Lambda handlers directly from `backend/dist`:
```bash
cd backend
npm install
npm run build
```
Verify compiled files exist in `backend/dist/handlers/`:
- `incidents.js`
- `cleanups.js`
- `followups.js`
- `hotspots.js`
- `analytics.js`
- `uploads.js`

### Step 5.2: Bootstrap AWS CDK Environment
If you have never deployed AWS CDK in this AWS Account and Region before, bootstrap the CDK toolkit:
```bash
cd ../infra
npm install
npx cdk bootstrap aws://<YOUR_ACCOUNT_ID>/<YOUR_REGION>
```
*Example:* `npx cdk bootstrap aws://123456789012/us-east-1`

### Step 5.3: Deploy the CloudFormation Stack
Deploy all backend resources with approval confirmation bypassed:
```bash
npx cdk deploy --require-approval never --outputs-file cdk-outputs.json
```

CDK will output the newly created cloud resources upon completion:
```text
Outputs:
CleanLoopStack.CleanLoopApiGatewayUrl = https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/
CleanLoopStack.CleanLoopUserPoolId = us-east-1_Xyz123Abc
CleanLoopStack.CleanLoopUserPoolClientId = 789abcdefghijklmnopqrstuvw
CleanLoopStack.CleanLoopTableName = CleanLoopTable
CleanLoopStack.CleanLoopBucketName = cleanloopstack-cleanloopmediabucket-123456789012
```

### Step 5.4: Connect Frontend to Deployed AWS Resources
Create or update `frontend/.env.local` using the outputs from the CDK deployment:

```env
NEXT_PUBLIC_API_URL=https://<API_ID>.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_S3_BUCKET=cleanloopstack-cleanloopmediabucket-xxxxxxxxx
```

### Step 5.5: Seed DynamoDB with Initial Data (Optional)
To populate predefined campus hotspots and synthetic demonstration records:
```bash
cd ../backend
export TABLE_NAME=CleanLoopTable
export AWS_REGION=us-east-1
# On Windows PowerShell:
# $env:TABLE_NAME="CleanLoopTable"; $env:AWS_REGION="us-east-1"

npm run seed
```

---

## 6. Hosting the Next.js Frontend

Choose one of the following production hosting methods for the frontend:

### Option A: AWS Amplify Hosting (Recommended for Full AWS Stack)
AWS Amplify provides zero-configuration hosting for Next.js with automatic branch deployments:

1. **Push your code to GitHub / GitLab / AWS CodeCommit**:
   ```bash
   git add .
   git commit -m "feat: complete cleanloop mvp"
   git push origin main
   ```
2. **Open AWS Amplify Console**:
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/home).
   - Click **Create new app** > **Host web app**.
   - Select your Git provider (e.g., GitHub) and select the `Cleanloop` repository.
   - Choose the branch (`main`).
3. **Configure Build Settings**:
   Amplify will automatically detect `frontend/amplify.yml`:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd frontend
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: frontend/.next
       files:
         - '**/*'
     cache:
       paths:
         - frontend/.next/cache/**/*
         - frontend/node_modules/**/*
   ```
4. **Add Environment Variables**:
   Under **App Settings** > **Environment variables**, add:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_USER_POOL_ID`
   - `NEXT_PUBLIC_USER_POOL_CLIENT_ID`
   - `NEXT_PUBLIC_AWS_REGION`
   - `NEXT_PUBLIC_S3_BUCKET`
5. Click **Save and deploy**. Amplify will assign a live URL (e.g. `https://main.d123456789.amplifyapp.com`).

---

### Option B: Deploy Frontend to Vercel
1. Install Vercel CLI: `npm install -g vercel`
2. Navigate to frontend:
   ```bash
   cd frontend
   vercel
   ```
3. Add the 5 environment variables from `frontend/.env.local` in the Vercel project dashboard.
4. Deploy to production: `vercel --prod`

---

### Option C: Run Local Frontend Against Live Cloud Backend
You can run the web app on your local machine pointing directly to live AWS resources:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000`. All incident submissions, photo uploads, cleanups, and analytics will persist in live Amazon DynamoDB and Amazon S3.

---

## 7. Creating Users & Testing RBAC Roles

Amazon Cognito User Pool is provisioned with three user groups:
1. `STUDENT`: Campus reporters (Report waste, view public hotspots, check incident statuses).
2. `CLEANUP_TEAM`: Field sanitation staff (Log cleanups, mark incidents cleaned, upload resolution evidence).
3. `ADMIN`: Facilities administrators (Full administrative access, inspect follow-ups, trigger recurrence analysis, override hotspots).

### Creating Initial Users via AWS CLI

#### 1. Create a Student User:
```bash
aws cognito-idp admin-create-user \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --username student@university.edu \
  --user-attributes Name=email,Value=student@university.edu Name=email_verified,Value=true \
  --temporary-password "CleanLoop2026!"

aws cognito-idp admin-set-user-password \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --username student@university.edu \
  --password "CleanLoop2026!" \
  --permanent

aws cognito-idp admin-add-user-to-group \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --username student@university.edu \
  --group-name STUDENT
```

#### 2. Create a Cleanup Team User:
```bash
aws cognito-idp admin-create-user \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --username cleanup@cleanloop.internal \
  --user-attributes Name=email,Value=cleanup@cleanloop.internal Name=email_verified,Value=true \
  --temporary-password "CleanLoop2026!"

aws cognito-idp admin-set-user-password \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --username cleanup@cleanloop.internal \
  --password "CleanLoop2026!" \
  --permanent

aws cognito-idp admin-add-user-to-group \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --username cleanup@cleanloop.internal \
  --group-name CLEANUP_TEAM
```

#### 3. Create an Administrator User:
```bash
aws cognito-idp admin-create-user \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --username admin@cleanloop.internal \
  --user-attributes Name=email,Value=admin@cleanloop.internal Name=email_verified,Value=true \
  --temporary-password "CleanLoop2026!"

aws cognito-idp admin-set-user-password \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --username admin@cleanloop.internal \
  --password "CleanLoop2026!" \
  --permanent

aws cognito-idp admin-add-user-to-group \
  --user-pool-id <YOUR_USER_POOL_ID> \
  --username admin@cleanloop.internal \
  --group-name ADMIN
```

---

## 8. Post-Deployment Verification Checklist

Verify your cloud deployment with this checklist:

- [ ] **CloudFormation Status**: Stack `CleanLoopStack` is in `CREATE_COMPLETE` or `UPDATE_COMPLETE` state.
- [ ] **DynamoDB**: Table `CleanLoopTable` exists with GSIs `GSI1` and `GSI2` in `ACTIVE` state.
- [ ] **Cognito**: User Pool has groups `STUDENT`, `CLEANUP_TEAM`, `ADMIN`.
- [ ] **S3**: Bucket has default AES-256 encryption and Block Public Access enabled.
- [ ] **API Gateway Health Check**:
  ```bash
  curl -s https://<API_ID>.execute-api.<REGION>.amazonaws.com/prod/hotspots
  ```
  Returns status 200 with 5 predefined campus hotspots.
- [ ] **Incident Creation**: Submit an incident via UI (`/report`) with photo upload; confirm photo is stored in S3 and record is in DynamoDB.
- [ ] **Cleanup Logging**: Log a cleanup record via `/cleanup` and confirm status advances to `CLEANED`.
- [ ] **Follow-up Inspection**: Submit inspection via `/followups` as `CLEAN` or `WASTE_PRESENT`.
- [ ] **Recurrence Engine**: Verify the hotspot timeline at `/hotspots/HOTSPOT-001` computes recurrence metrics dynamically.

---

## 9. Troubleshooting & FAQ

### Q1: `cdk bootstrap` fails with AccessDenied
**Solution**: Ensure your AWS CLI credentials belong to an IAM user or role with permissions to create S3 buckets, ECR repositories, and CloudFormation stacks.

### Q2: API Gateway returns `401 Unauthorized`
**Solution**: Requests to protected endpoints require an Authorization header containing a valid Cognito JWT ID token:
```text
Authorization: Bearer <ID_TOKEN>
```
Verify that your login session has not expired and that your user belongs to the required Cognito User Group.

### Q3: S3 image upload returns CORS error
**Solution**: The CDK template configures CORS on `CleanLoopMediaBucket` allowing `GET`, `PUT`, `HEAD` methods and headers `*`. Verify that your upload request issues an `HTTP PUT` with the exact `Content-Type` specified during the presign request.

### Q4: Lambdas fail with `Cannot find module 'handlers/...'`
**Solution**: Ensure TypeScript has compiled the backend code (`npm run build` in `backend/`) before running CDK deploy. CDK bundles code from `backend/dist`.

---

## 10. Teardown & Clean Up

To destroy all provisioned AWS cloud resources and avoid ongoing charges:

```bash
cd infra
npx cdk destroy --force
```

This will automatically delete the API Gateway, Lambda functions, IAM roles, Cognito User Pool, DynamoDB table, and empty the S3 media bucket.
