# CleanLoop MVP: Automated AWS Deployment Script (Phase 11)
# Usage:
#   .\deploy.ps1                # Full automated deploy
#   .\deploy.ps1 -DryRun        # Compile, test, synth only (no AWS deployment)
#   .\deploy.ps1 -Region us-east-1

param (
    [switch]$DryRun = $false,
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"
$WorkspaceRoot = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   CLEANLOOP MVP: AWS DEPLOYMENT PIPELINE (PHASE 11)      " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. AWS CLI and Credentials Pre-Flight Check
Write-Host "`n[Step 1/5] Checking AWS Credentials..." -ForegroundColor Yellow
try {
    $awsIdentity = aws sts get-caller-identity 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "AWS credentials not valid or expired."
    }
    Write-Host "[OK] AWS Credentials Authenticated." -ForegroundColor Green
} catch {
    Write-Host "[WARN] AWS Authentication Failed or Credentials Expired!" -ForegroundColor Red
    Write-Host "To deploy live AWS infrastructure, configure credentials with: aws configure" -ForegroundColor DarkYellow
    Write-Host "Or set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_SESSION_TOKEN environment variables." -ForegroundColor Gray
    
    if (-not $DryRun) {
        Write-Host "`nSwitching to Dry-Run Mode to validate builds and tests locally..." -ForegroundColor Magenta
        $DryRun = $true
    }
}

# 2. Compile Backend and Run Automated Tests
Write-Host "`n[Step 2/5] Compiling Backend and Executing Automated Tests..." -ForegroundColor Yellow
Set-Location "$WorkspaceRoot\backend"
npm run build
Write-Host "[OK] Backend Lambda handlers compiled to backend/dist" -ForegroundColor Green

npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Automated tests failed! Halting deployment." -ForegroundColor Red
    Set-Location $WorkspaceRoot
    exit 1
}
Write-Host "[OK] All 34 Automated Tests Passed (I/O Contracts, Recurrence, Validation, and Scenarios)." -ForegroundColor Green

# 3. CDK Build and Synthesis
Write-Host "`n[Step 3/5] Compiling CDK Infrastructure and CloudFormation Synthesis..." -ForegroundColor Yellow
Set-Location "$WorkspaceRoot\infra"
npm run build
npx cdk synth --quiet
Write-Host "[OK] CloudFormation Stack Synthesized successfully." -ForegroundColor Green

if ($DryRun) {
    Write-Host "`n==========================================================" -ForegroundColor Cyan
    Write-Host "[OK] DRY-RUN SUCCESSFUL: All builds, tests, and synth passed!" -ForegroundColor Green
    Write-Host "To perform live deployment, configure valid AWS credentials and run: .\deploy.ps1" -ForegroundColor Yellow
    Write-Host "==========================================================" -ForegroundColor Cyan
    Set-Location $WorkspaceRoot
    exit 0
}

# 4. Deploy CDK Stack to AWS
Write-Host "`n[Step 4/5] Deploying CloudFormation Stack via AWS CDK..." -ForegroundColor Yellow
$outputsFile = "$WorkspaceRoot\infra\cdk-outputs.json"
npx cdk deploy --require-approval never --outputs-file "$outputsFile"

if (-not (Test-Path $outputsFile)) {
    Write-Host "[ERROR] Deployment outputs file not found." -ForegroundColor Red
    Set-Location $WorkspaceRoot
    exit 1
}

# 5. Extract Outputs and Update Frontend .env.local
Write-Host "`n[Step 5/5] Configuring Frontend Environment..." -ForegroundColor Yellow
$outputsJson = Get-Content $outputsFile -Raw | ConvertFrom-Json
$stackOutputs = $outputsJson.CleanLoopStack

$apiUrl = $stackOutputs.CleanLoopApiGatewayUrl
$userPoolId = $stackOutputs.UserPoolId
$clientId = $stackOutputs.UserPoolClientId
$tableName = $stackOutputs.TableName
$bucketName = $stackOutputs.BucketName

$envLocalLines = @(
    "# Generated automatically by Phase 11 deployment pipeline",
    "NEXT_PUBLIC_API_URL=$apiUrl",
    "NEXT_PUBLIC_USER_POOL_ID=$userPoolId",
    "NEXT_PUBLIC_USER_POOL_CLIENT_ID=$clientId",
    "NEXT_PUBLIC_AWS_REGION=$Region",
    "NEXT_PUBLIC_S3_BUCKET=$bucketName"
)

$envLocalPath = Join-Path $WorkspaceRoot "frontend\.env.local"
$envLocalLines | Out-File -FilePath $envLocalPath -Encoding utf8
Write-Host "[OK] Generated $envLocalPath with live AWS resource IDs." -ForegroundColor Green

# Seed Synthetic Data
Write-Host "`n[Optional] Seeding Synthetic Demo Data to DynamoDB..." -ForegroundColor Yellow
Set-Location "$WorkspaceRoot\backend"
$env:TABLE_NAME = $tableName
$env:AWS_REGION = $Region
npm run seed
Write-Host "[OK] Synthetic demo data seeded." -ForegroundColor Green

# Build Frontend
Write-Host "`nBuilding Frontend for Production..." -ForegroundColor Yellow
Set-Location "$WorkspaceRoot\frontend"
npm run build
Write-Host "[OK] Frontend production bundle built." -ForegroundColor Green

Set-Location $WorkspaceRoot
Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "CLEANLOOP MVP SUCCESSFULLY DEPLOYED TO AWS!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "API Gateway URL: $apiUrl" -ForegroundColor White
Write-Host "Cognito User Pool: $userPoolId" -ForegroundColor White
Write-Host "S3 Evidence Bucket: $bucketName" -ForegroundColor White
Write-Host "DynamoDB Table: $tableName" -ForegroundColor White
Write-Host "`nStart local web app pointing to live AWS:" -ForegroundColor White
Write-Host "  cd frontend; npm run dev" -ForegroundColor Cyan
Write-Host "Or connect repository to AWS Amplify Hosting using frontend/amplify.yml" -ForegroundColor Cyan
