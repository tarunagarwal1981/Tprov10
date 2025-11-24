# PowerShell Script to Set Up Cognito User Migration Lambda
# This script helps set up the Lambda function for password migration

Write-Host "=== Cognito User Migration Lambda Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if AWS CLI is installed
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "❌ AWS CLI is not installed" -ForegroundColor Red
    Write-Host "Please install AWS CLI first: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ AWS CLI found" -ForegroundColor Green
Write-Host ""

# Get environment variables
$supabaseUrl = Read-Host "Enter Supabase URL (e.g., https://xxx.supabase.co)"
$supabaseServiceKey = Read-Host "Enter Supabase Service Role Key"
$userPoolId = Read-Host "Enter Cognito User Pool ID (e.g., us-east-1_XXXXXXXXX)"
$region = Read-Host "Enter AWS Region (default: us-east-1)" 
if ([string]::IsNullOrWhiteSpace($region)) { $region = "us-east-1" }

Write-Host ""
Write-Host "📦 Creating Lambda deployment package..." -ForegroundColor Yellow

# Create temporary directory
$tempDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }
$lambdaDir = Join-Path $tempDir "lambda"
New-Item -ItemType Directory -Path $lambdaDir -Force | Out-Null

# Copy Lambda function code
Copy-Item "aws-migration-scripts/cognito-user-migration-lambda.js" -Destination (Join-Path $lambdaDir "index.js")

# Create package.json
$packageJson = @{
    name = "cognito-user-migration"
    version = "1.0.0"
    dependencies = @{
        "@supabase/supabase-js" = "^2.39.0"
    }
} | ConvertTo-Json

$packageJson | Out-File -FilePath (Join-Path $lambdaDir "package.json") -Encoding utf8

# Install dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
Push-Location $lambdaDir
npm install --production
Pop-Location

# Create zip file
$zipFile = Join-Path $tempDir "lambda.zip"
Write-Host "📦 Creating deployment package..." -ForegroundColor Yellow
Compress-Archive -Path "$lambdaDir\*" -DestinationPath $zipFile -Force

Write-Host "✅ Deployment package created: $zipFile" -ForegroundColor Green
Write-Host ""

# Create Lambda function
Write-Host "🚀 Creating Lambda function..." -ForegroundColor Yellow
$functionName = "cognito-user-migration"

try {
    # Check if function exists
    aws lambda get-function --function-name $functionName --region $region 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "⚠️  Function already exists. Updating..." -ForegroundColor Yellow
        aws lambda update-function-code `
            --function-name $functionName `
            --zip-file "fileb://$zipFile" `
            --region $region | Out-Null
    } else {
        Write-Host "📝 Creating new function..." -ForegroundColor Yellow
        aws lambda create-function `
            --function-name $functionName `
            --runtime nodejs20.x `
            --role "arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role" `
            --handler index.handler `
            --zip-file "fileb://$zipFile" `
            --timeout 30 `
            --memory-size 256 `
            --environment "Variables={SUPABASE_URL=$supabaseUrl,SUPABASE_SERVICE_ROLE_KEY=$supabaseServiceKey}" `
            --region $region | Out-Null
    }

    Write-Host "✅ Lambda function created/updated" -ForegroundColor Green
    Write-Host ""

    # Add permission for Cognito to invoke
    Write-Host "🔐 Adding Cognito invoke permission..." -ForegroundColor Yellow
    $accountId = aws sts get-caller-identity --query Account --output text
    $sourceArn = "arn:aws:cognito-idp:$region`:$accountId`:userpool/$userPoolId"
    
    aws lambda add-permission `
        --function-name $functionName `
        --statement-id "cognito-trigger" `
        --action "lambda:InvokeFunction" `
        --principal "cognito-idp.amazonaws.com" `
        --source-arn $sourceArn `
        --region $region 2>$null | Out-Null

    Write-Host "✅ Permission added" -ForegroundColor Green
    Write-Host ""

    Write-Host "📝 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Go to Cognito Console → User Pool → Lambda triggers" -ForegroundColor White
    Write-Host "2. Set 'Migrate user' trigger to: $functionName" -ForegroundColor White
    Write-Host "3. Test login with Supabase credentials" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Manual Setup:" -ForegroundColor Yellow
    Write-Host "1. Go to AWS Lambda Console" -ForegroundColor White
    Write-Host "2. Create function: $functionName" -ForegroundColor White
    Write-Host "3. Upload zip file: $zipFile" -ForegroundColor White
    Write-Host "4. Set environment variables:" -ForegroundColor White
    Write-Host "   SUPABASE_URL=$supabaseUrl" -ForegroundColor Gray
    Write-Host "   SUPABASE_SERVICE_ROLE_KEY=$supabaseServiceKey" -ForegroundColor Gray
}

# Cleanup
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "✅ Setup complete!" -ForegroundColor Green

