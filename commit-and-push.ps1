# Git Commit and Push Script
Write-Host "=== Git Commit and Push Script ===" -ForegroundColor Cyan
Write-Host ""

# Change to repository directory
Set-Location "C:\Users\train\.cursor\Tprov10"
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Check current branch
$branch = git branch --show-current
Write-Host "Current branch: $branch" -ForegroundColor Yellow
Write-Host ""

# Check remote
$remote = git remote get-url origin
Write-Host "Remote: $remote" -ForegroundColor Yellow
Write-Host ""

# Show uncommitted changes
Write-Host "=== Checking for uncommitted changes ===" -ForegroundColor Cyan
$status = git status --short
if ($status) {
    Write-Host "Found uncommitted changes:" -ForegroundColor Yellow
    $status | Select-Object -First 20
    Write-Host ""
    
    # Stage all changes
    Write-Host "=== Staging all changes ===" -ForegroundColor Cyan
    git add -A
    Write-Host "All changes staged" -ForegroundColor Green
    Write-Host ""
    
    # Show staged files count
    $stagedCount = (git diff --cached --name-only | Measure-Object -Line).Lines
    Write-Host "Files staged: $stagedCount" -ForegroundColor Green
    Write-Host ""
    
    # Commit
    Write-Host "=== Creating commit ===" -ForegroundColor Cyan
    $commitMessage = @"
feat: Add Twilio SMS, SendGrid Email, unified CAPTCHA support

- Add Twilio SMS service (smsServiceTwilio.ts)
- Add SendGrid Email service (emailServiceSendGrid.ts)
- Add Cloudflare Turnstile service (turnstileService.ts)
- Add unified CAPTCHA service (captchaService.ts)
- Update all phone auth routes to use unified CAPTCHA
- Update frontend components for multi-provider support
- Add comprehensive setup documentation
- Add twilio and @sendgrid/mail packages
- Fix duplicate content in captchaService.ts
"@
    
    git commit -m $commitMessage
    Write-Host "Commit created" -ForegroundColor Green
    Write-Host ""
    
    # Push
    Write-Host "=== Pushing to remote ===" -ForegroundColor Cyan
    git push origin $branch
    Write-Host "Push completed" -ForegroundColor Green
    Write-Host ""
    
    # Verify
    Write-Host "=== Verification ===" -ForegroundColor Cyan
    git status
    Write-Host ""
    Write-Host "=== Latest commit ===" -ForegroundColor Cyan
    git log --oneline -1
} else {
    Write-Host "No uncommitted changes found" -ForegroundColor Green
    Write-Host ""
    Write-Host "=== Latest commit ===" -ForegroundColor Cyan
    git log --oneline -1
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan


