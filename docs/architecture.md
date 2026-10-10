# CleanLoop MVP: Architecture Specification

## 1. System Overview

CleanLoop is built as a cloud-native, serverless web application powered by **Next.js (App Router, TypeScript, Tailwind CSS)** on the frontend and **AWS Serverless primitives** defined with **AWS CDK (TypeScript)** on the backend.

```text
[ Next.js Frontend ] 
        │
        ├── Auth (Amazon Cognito User Pool: STUDENT, CLEANUP_TEAM, ADMIN)
        │
        ├── Direct Media Upload (Amazon S3 Presigned URLs)
        │
        └── REST API Requests (Amazon API Gateway)
                    │
                    ▼
            [ AWS Lambda Handlers ] (Node.js 20.x TypeScript)
              ├── incidentsHandler
              ├── cleanupsHandler
              ├── followupsHandler
              ├── hotspotsHandler
              ├── analyticsHandler
              └── uploadsHandler
                    │
                    ▼
         [ Amazon DynamoDB Single-Table: CleanLoopTable ]
              ├── PK: String, SK: String
              ├── GSI1: Status & Chronology (GSI1PK, GSI1SK)
              └── GSI2: Reporter Lookup (GSI2PK, GSI2SK)
                    │
                    ▼
            [ Amazon CloudWatch Logs ]
```

---

## 2. Infrastructure as Code (AWS CDK)

Located in [`infra/`](file:///c:/Users/Devesh%20arya/OneDrive/Desktop/Cleanloop/infra):
- Entrypoint: [`infra/bin/infra.ts`](file:///c:/Users/Devesh%20arya/OneDrive/Desktop/Cleanloop/infra/bin/infra.ts)
- Stack: [`infra/lib/cleanloop-stack.ts`](file:///c:/Users/Devesh%20arya/OneDrive/Desktop/Cleanloop/infra/lib/cleanloop-stack.ts)
- Synthesized CloudFormation: [`infra/cdk.out/CleanLoopStack.template.json`](file:///c:/Users/Devesh%20arya/OneDrive/Desktop/Cleanloop/infra/cdk.out/CleanLoopStack.template.json)

### Resources Defined:
1. **Amazon Cognito**:
   - `CleanLoopUserPool`: Self sign-up, email sign-in alias, strict password policy.
   - `CleanLoopUserPoolClient`: Public SPA client without client secret.
   - User Pool Groups: `STUDENT`, `CLEANUP_TEAM`, `ADMIN`.
2. **Amazon DynamoDB**:
   - `CleanLoopTable`: Single-table partition design with on-demand capacity and PITR.
   - `GSI1`: Partition Key `GSI1PK`, Sort Key `GSI1SK` (Status triage).
   - `GSI2`: Partition Key `GSI2PK`, Sort Key `GSI2SK` (User reports).
3. **Amazon S3**:
   - `CleanLoopMediaBucket`: Fully private bucket, blocked public access, SSL enforced, CORS configured.
4. **AWS Lambda Functions**:
   - Node.js 20.x runtime, bundled from [`backend/dist`](file:///c:/Users/Devesh%20arya/OneDrive/Desktop/Cleanloop/backend/dist).
   - Least-privilege IAM policies.
5. **Amazon API Gateway**:
   - `CleanLoopApi`: REST API with CORS and `CognitoUserPoolsAuthorizer` for protected routes.
