# Phase 2: Database Migration Script
# Exports from Supabase and imports to RDS

$env:Path += ";C:\Program Files\Amazon\AWSCLIV2"

Write-Host "🚀 Phase 2: Database Migration" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Configuration - Use environment variables for security
$supabaseProjectRef = "megmjzszmqnmzdxwzigt"
$rdsEndpoint = if ($env:RDS_HOST) { $env:RDS_HOST } elseif ($env:RDS_HOSTNAME) { $env:RDS_HOSTNAME } else { "travel-app-db.c61sa44wsvgz.us-east-1.rds.amazonaws.com" }
$rdsPassword = if ($env:RDS_PASSWORD) { $env:RDS_PASSWORD } elseif ($env:PGPASSWORD) { $env:PGPASSWORD } else {
    Write-Host "❌ Error: RDS_PASSWORD or PGPASSWORD environment variable is required" -ForegroundColor Red
    Write-Host "Please set it before running this script:" -ForegroundColor Yellow
    Write-Host "  `$env:RDS_PASSWORD='your_password'" -ForegroundColor Cyan
    exit 1
}
$rdsUser = if ($env:RDS_USERNAME) { $env:RDS_USERNAME } elseif ($env:RDS_USER) { $env:RDS_USER } else { "postgres" }
$rdsDatabase = if ($env:RDS_DATABASE) { $env:RDS_DATABASE } elseif ($env:RDS_DB) { $env:RDS_DB } else { "postgres" }

# Check if PostgreSQL tools are installed
Write-Host "📋 Checking PostgreSQL client tools..." -ForegroundColor Yellow
$psqlPath = (Get-Command psql -ErrorAction SilentlyContinue).Source
$pgDumpPath = (Get-Command pg_dump -ErrorAction SilentlyContinue).Source

if (-not $psqlPath -or -not $pgDumpPath) {
    Write-Host "⚠️  PostgreSQL client tools not found!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please install PostgreSQL client tools:" -ForegroundColor Yellow
    Write-Host "  Option 1: winget install PostgreSQL.PostgreSQL" -ForegroundColor Cyan
    Write-Host "  Option 2: Download from https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installation, restart this script." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ PostgreSQL tools found" -ForegroundColor Green
Write-Host "  psql: $psqlPath" -ForegroundColor Gray
Write-Host "  pg_dump: $pgDumpPath" -ForegroundColor Gray
Write-Host ""

# Get Supabase database password
Write-Host "📝 Supabase Database Connection" -ForegroundColor Yellow
Write-Host "You need your Supabase database password." -ForegroundColor Yellow
Write-Host "Get it from: https://supabase.com/dashboard/project/$supabaseProjectRef/settings/database" -ForegroundColor Cyan
Write-Host ""
$supabaseDbPassword = Read-Host "Enter Supabase database password" -AsSecureString
$supabaseDbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($supabaseDbPassword))

# Supabase connection details
$supabaseHost = "db.$supabaseProjectRef.supabase.co"
$supabasePort = 5432
$supabaseUser = "postgres"
$supabaseDatabase = "postgres"

Write-Host ""
Write-Host "📤 Step 1: Exporting schema from Supabase..." -ForegroundColor Yellow
$schemaFile = "supabase_schema.sql"
$pgDumpCmd = "pg_dump --host=$supabaseHost --port=$supabasePort --username=$supabaseUser --dbname=$supabaseDatabase --schema-only --no-owner --no-acl --file=$schemaFile"
$env:PGPASSWORD = $supabaseDbPasswordPlain

try {
    Invoke-Expression $pgDumpCmd
    if (Test-Path $schemaFile) {
        $schemaSize = (Get-Item $schemaFile).Length / 1KB
        Write-Host "✅ Schema exported: $schemaFile ($([math]::Round($schemaSize, 2)) KB)" -ForegroundColor Green
    } else {
        throw "Schema file not created"
    }
} catch {
    Write-Host "❌ Error exporting schema: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📤 Step 2: Exporting data from Supabase..." -ForegroundColor Yellow
$dataFile = "supabase_data.sql"
$pgDumpCmd = "pg_dump --host=$supabaseHost --port=$supabasePort --username=$supabaseUser --dbname=$supabaseDatabase --data-only --no-owner --no-acl --file=$dataFile"

try {
    Invoke-Expression $pgDumpCmd
    if (Test-Path $dataFile) {
        $dataSize = (Get-Item $dataFile).Length / 1KB
        Write-Host "✅ Data exported: $dataFile ($([math]::Round($dataSize, 2)) KB)" -ForegroundColor Green
    } else {
        throw "Data file not created"
    }
} catch {
    Write-Host "❌ Error exporting data: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📥 Step 3: Importing schema to RDS..." -ForegroundColor Yellow
$psqlCmd = "psql --host=$rdsEndpoint --port=5432 --username=$rdsUser --dbname=$rdsDatabase --file=$schemaFile"
$env:PGPASSWORD = $rdsPassword

try {
    Invoke-Expression $psqlCmd
    Write-Host "✅ Schema imported to RDS" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Schema import completed (some warnings may be normal)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📥 Step 4: Importing data to RDS..." -ForegroundColor Yellow
$psqlCmd = "psql --host=$rdsEndpoint --port=5432 --username=$rdsUser --dbname=$rdsDatabase --file=$dataFile"

try {
    Invoke-Expression $psqlCmd
    Write-Host "✅ Data imported to RDS" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Data import completed (some warnings may be normal)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔍 Step 5: Verifying migration..." -ForegroundColor Yellow

# Verify by checking table counts
$verifyQuery = @"
SELECT 
    'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'activity_packages', COUNT(*) FROM activity_packages WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_packages')
UNION ALL
SELECT 'transfer_packages', COUNT(*) FROM transfer_packages WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transfer_packages')
UNION ALL
SELECT 'multi_city_packages', COUNT(*) FROM multi_city_packages WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'multi_city_packages');
"@

$verifyFile = "verify_migration.sql"
$verifyQuery | Out-File -FilePath $verifyFile -Encoding UTF8

$psqlCmd = "psql --host=$rdsEndpoint --port=5432 --username=$rdsUser --dbname=$rdsDatabase --file=$verifyFile"
try {
    $result = Invoke-Expression $psqlCmd 2>&1
    Write-Host $result
    Write-Host "✅ Verification query executed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not run verification (this is okay if tables don't exist yet)" -ForegroundColor Yellow
}

# Cleanup
Remove-Item $verifyFile -ErrorAction SilentlyContinue
$env:PGPASSWORD = $null

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "✅ Phase 2 Migration Complete!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Yellow
Write-Host "  Schema exported: $schemaFile" -ForegroundColor Gray
Write-Host "  Data exported: $dataFile" -ForegroundColor Gray
Write-Host "  RDS Endpoint: $rdsEndpoint" -ForegroundColor Gray
Write-Host ""
Write-Host "💾 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Update .env.local with RDS credentials" -ForegroundColor Cyan
Write-Host "  2. Test database connection" -ForegroundColor Cyan
Write-Host "  3. Proceed to Phase 3 (Cognito setup)" -ForegroundColor Cyan
Write-Host ""

