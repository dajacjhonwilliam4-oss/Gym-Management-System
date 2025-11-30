# GitHub Push Script for Gym Management System
# This script will push only essential files to GitHub

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "GitHub Push Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Check current status
Write-Host "Step 1: Checking current status..." -ForegroundColor Yellow
git status

# Step 2: Show what will be excluded
Write-Host "`nFiles that will be EXCLUDED (via .gitignore):" -ForegroundColor Red
Write-Host "  - archive/ (legacy Node.js)" -ForegroundColor White
Write-Host "  - bin/ and obj/ (build artifacts)" -ForegroundColor White
Write-Host "  - tools/acli.exe (large executable)" -ForegroundColor White
Write-Host "  - *.dll, *.exe, *.pdb (compiled files)" -ForegroundColor White
Write-Host "  Total: ~102 MB excluded" -ForegroundColor Gray

# Step 3: Show what will be included
Write-Host "`nFiles that will be INCLUDED:" -ForegroundColor Green
Write-Host "  - frontend/ (source code)" -ForegroundColor White
Write-Host "  - GymManagementAPI/ (C# source)" -ForegroundColor White
Write-Host "  - docs/ (documentation)" -ForegroundColor White
Write-Host "  - scripts/ (database scripts)" -ForegroundColor White
Write-Host "  - Configuration and README files" -ForegroundColor White
Write-Host "  Estimated: ~5-10 MB" -ForegroundColor Gray

# Step 4: Confirm before proceeding
Write-Host "`nReady to proceed?" -ForegroundColor Yellow
Write-Host "This will:" -ForegroundColor White
Write-Host "  1. Stage all changes (git add .)" -ForegroundColor White
Write-Host "  2. Commit with a descriptive message" -ForegroundColor White
Write-Host "  3. Push to GitHub" -ForegroundColor White

$confirm = Read-Host "`nContinue? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "`nCancelled by user" -ForegroundColor Red
    exit
}

# Step 5: Add files
Write-Host "`nStep 2: Adding files..." -ForegroundColor Yellow
git add .

# Step 6: Show what's staged
Write-Host "`nStep 3: Files staged for commit:" -ForegroundColor Yellow
git status

# Step 7: Get commit message
Write-Host "`nEnter commit message (or press Enter for default):" -ForegroundColor Yellow
$commitMsg = Read-Host "Message"

if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "feat: Complete gym management system with organized structure"
}

# Step 8: Commit
Write-Host "`nStep 4: Committing changes..." -ForegroundColor Yellow
git commit -m $commitMsg

# Step 9: Ask for push
Write-Host "`nStep 5: Ready to push to GitHub?" -ForegroundColor Yellow
$pushConfirm = Read-Host "Push now? (yes/no)"

if ($pushConfirm -eq "yes") {
    Write-Host "`nPushing to GitHub..." -ForegroundColor Yellow
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nSuccessfully pushed to GitHub!" -ForegroundColor Green
        Write-Host "Check your repository to verify the files." -ForegroundColor White
    }
    else {
        Write-Host "`nPush failed. You may need to:" -ForegroundColor Red
        Write-Host "  - Set remote: git remote add origin YOUR_REPO_URL" -ForegroundColor White
        Write-Host "  - Or use: git push origin YOUR_BRANCH_NAME" -ForegroundColor White
    }
}
else {
    Write-Host "`nChanges committed locally but not pushed." -ForegroundColor Yellow
    Write-Host "To push later, run: git push origin main" -ForegroundColor White
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Script Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
