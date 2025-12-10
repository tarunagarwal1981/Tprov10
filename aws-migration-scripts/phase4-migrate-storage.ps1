# Phase 4: Storage Migration Script
# Migrates files from Supabase Storage to AWS S3

Write-Host "=== Phase 4: Storage Migration ===" -ForegroundColor Cyan
Write-Host ""

# Load environment variables from .env.local
if (Test-Path ".env.local") {
    Write-Host "Loading environment variables from .env.local..." -ForegroundColor Yellow
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "✅ Environment variables loaded" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.local not found" -ForegroundColor Yellow
}

# Check required variables
$requiredVars = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "S3_BUCKET_NAME"
)

$missingVars = @()
foreach ($var in $requiredVars) {
    $value = [Environment]::GetEnvironmentVariable($var, "Process")
    if (-not $value) {
        $missingVars += $var
        Write-Host "❌ $var is not set" -ForegroundColor Red
    } else {
        Write-Host "✅ $var is set" -ForegroundColor Green
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ Missing required environment variables!" -ForegroundColor Red
    Write-Host "Please set the following in .env.local:" -ForegroundColor Yellow
    foreach ($var in $missingVars) {
        Write-Host "  - $var" -ForegroundColor White
    }
    exit 1
}

Write-Host ""
Write-Host "Setting environment variables for migration..." -ForegroundColor Yellow

# Map Next.js env vars to migration script vars
$supabaseUrl = [Environment]::GetEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL", "Process")
$supabaseKey = [Environment]::GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY", "Process")
$s3Bucket = [Environment]::GetEnvironmentVariable("S3_BUCKET_NAME", "Process")
$awsRegion = [Environment]::GetEnvironmentVariable("AWS_REGION", "Process")
if (-not $awsRegion) {
    $awsRegion = "us-east-1"
}

$env:SUPABASE_URL = $supabaseUrl
$env:SUPABASE_SERVICE_ROLE_KEY = $supabaseKey
$env:S3_BUCKET_NAME = $s3Bucket
$env:AWS_REGION = $awsRegion

Write-Host "✅ Environment variables configured" -ForegroundColor Green
Write-Host ""
Write-Host "Starting migration..." -ForegroundColor Cyan
Write-Host ""

# Run migration script
npx tsx aws-migration-scripts/migrate-storage.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Migration failed. Check errors above." -ForegroundColor Red
    exit 1
}

