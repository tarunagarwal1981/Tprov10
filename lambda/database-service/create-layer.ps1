# Create Lambda Layer for pg (PostgreSQL) library
# pg has native dependencies that need to be compiled for Lambda's Linux environment

$ErrorActionPreference = "Stop"

$REGION = "us-east-1"
$LAYER_NAME = "travel-app-pg-layer"
$NODE_VERSION = "20"

Write-Host "=== Creating Lambda Layer for pg Library ===" -ForegroundColor Cyan
Write-Host ""

# Create layer directory structure
$layerDir = "layer"
if (Test-Path $layerDir) {
    Remove-Item $layerDir -Recurse -Force
}

New-Item -ItemType Directory -Path "$layerDir/nodejs" -Force | Out-Null

Write-Host "Step 1: Installing pg in layer directory..." -ForegroundColor Yellow

# Install pg in the layer directory
Push-Location "$layerDir/nodejs"
try {
    # Create package.json
    @{
        name = "pg-layer"
        version = "1.0.0"
        dependencies = @{
            pg = "^8.11.3"
        }
    } | ConvertTo-Json | Out-File -FilePath "package.json" -Encoding utf8
    
    # Install (this will download pre-built binaries for Linux)
    Write-Host "   Running npm install..." -ForegroundColor Gray
    npm install --omit=dev 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
    
    Write-Host "[OK] pg installed in layer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to install pg: $_" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

Write-Host ""
Write-Host "Step 2: Creating layer zip..." -ForegroundColor Yellow

# Create zip file
$zipFile = "pg-layer.zip"
if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

Compress-Archive -Path "$layerDir/nodejs" -DestinationPath $zipFile -Force

$zipSize = (Get-Item $zipFile).Length / 1MB
Write-Host "[OK] Layer zip created: $zipFile ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Publishing Lambda layer..." -ForegroundColor Yellow

try {
    # Check if layer exists
    $existingLayer = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" lambda list-layer-versions `
        --layer-name $LAYER_NAME `
        --region $REGION `
        --query "LayerVersions[0].Version" `
        --output text 2>&1
    
    if ($existingLayer -and $existingLayer -ne "None") {
        Write-Host "   Layer exists, publishing new version..." -ForegroundColor Gray
    } else {
        Write-Host "   Creating new layer..." -ForegroundColor Gray
    }
    
    $layerResponse = & "C:\Program Files\Amazon\AWSCLIV2\aws.exe" lambda publish-layer-version `
        --layer-name $LAYER_NAME `
        --description "PostgreSQL (pg) library for Lambda" `
        --zip-file "fileb://$zipFile" `
        --compatible-runtimes "nodejs20.x" `
        --region $REGION `
        --output json
    
    $layerArn = ($layerResponse | ConvertFrom-Json).LayerVersionArn
    
    Write-Host "[OK] Layer published successfully" -ForegroundColor Green
    Write-Host "   Layer ARN: $layerArn" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Save this ARN for the Lambda deployment:" -ForegroundColor Yellow
    Write-Host "  $layerArn" -ForegroundColor Cyan
    Write-Host ""
    
    # Save to file for deployment script
    $layerArn | Out-File -FilePath "layer-arn.txt" -Encoding utf8 -NoNewline
    
} catch {
    Write-Host "[ERROR] Failed to publish layer: $_" -ForegroundColor Red
    exit 1
}

Write-Host "=== Layer Creation Complete ===" -ForegroundColor Green

