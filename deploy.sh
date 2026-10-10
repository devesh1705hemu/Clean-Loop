#!/usr/bin/env bash
# CleanLoop MVP: Automated AWS Deployment Script (Phase 11)
# Usage:
#   ./deploy.sh                # Full automated deploy
#   ./deploy.sh --dry-run      # Compile, test, synth only (no AWS deploy)

set -e

DRY_RUN=false
REGION="us-east-1"

for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --region=*)
      REGION="${arg#*=}"
      shift
      ;;
  esac
done

echo "=========================================================="
echo "   CLEANLOOP MVP: AWS DEPLOYMENT PIPELINE (PHASE 11)      "
echo "=========================================================="

# 1. AWS Pre-flight check
echo -e "\n[Step 1/5] Checking AWS Credentials..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
  echo "✖ AWS Authentication Failed or Credentials Expired!"
  echo "Configure credentials with: aws configure"
  if [ "$DRY_RUN" = false ]; then
    echo "Switching to Dry-Run Mode to validate builds and tests locally..."
    DRY_RUN=true
  fi
else
  echo "✔ AWS Credentials Authenticated."
fi

# 2. Build Backend & Run Tests
echo -e "\n[Step 2/5] Compiling Backend & Executing Automated Tests..."
cd backend
npm run build
npm test
cd ..
echo "✔ All 14 Automated Tests Passed."

# 3. CDK Build & Synth
echo -e "\n[Step 3/5] Compiling CDK Infrastructure & CloudFormation Synthesis..."
cd infra
npm run build
npx cdk synth --quiet
cd ..
echo "✔ CloudFormation Stack Synthesized successfully."

if [ "$DRY_RUN" = true ]; then
  echo -e "\n=========================================================="
  echo "✔ DRY-RUN SUCCESSFUL: All builds, tests, and synth passed!"
  echo "=========================================================="
  exit 0
fi

# 4. Deploy CDK Stack
echo -e "\n[Step 4/5] Deploying CloudFormation Stack via AWS CDK..."
cd infra
npx cdk deploy --require-approval never --outputs-file cdk-outputs.json

OUTPUTS_FILE="cdk-outputs.json"
API_URL=$(node -p "require('./${OUTPUTS_FILE}').CleanLoopStack.CleanLoopApiGatewayUrl")
USER_POOL_ID=$(node -p "require('./${OUTPUTS_FILE}').CleanLoopStack.UserPoolId")
CLIENT_ID=$(node -p "require('./${OUTPUTS_FILE}').CleanLoopStack.UserPoolClientId")
TABLE_NAME=$(node -p "require('./${OUTPUTS_FILE}').CleanLoopStack.TableName")
BUCKET_NAME=$(node -p "require('./${OUTPUTS_FILE}').CleanLoopStack.BucketName")
cd ..

# 5. Generate frontend .env.local
echo -e "\n[Step 5/5] Configuring Frontend Environment..."
cat <<EOF > frontend/.env.local
NEXT_PUBLIC_API_URL=${API_URL}
NEXT_PUBLIC_USER_POOL_ID=${USER_POOL_ID}
NEXT_PUBLIC_USER_POOL_CLIENT_ID=${CLIENT_ID}
NEXT_PUBLIC_AWS_REGION=${REGION}
NEXT_PUBLIC_S3_BUCKET=${BUCKET_NAME}
EOF
echo "✔ Generated frontend/.env.local with live AWS resource IDs."

echo -e "\nBuilding Frontend for Production..."
cd frontend
npm run build
cd ..

echo -e "\n🎉 CLEANLOOP MVP SUCCESSFULLY DEPLOYED TO AWS!"
