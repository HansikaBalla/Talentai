$loginBody = '{"email":"admin@talentai.com","password":"Admin@12345"}'
try {
    $loginResp = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/login' -Method POST -Body $loginBody -ContentType 'application/json' -UseBasicParsing
    $token = ($loginResp.Content | ConvertFrom-Json).data.accessToken
    Write-Host "LOGIN SUCCESS. Token obtained." -ForegroundColor Green

    $headers = @{ Authorization = "Bearer $token" }
    $statsResp = Invoke-WebRequest -Uri 'http://localhost:5000/api/analytics/overview' -Headers $headers -UseBasicParsing
    $stats = ($statsResp.Content | ConvertFrom-Json).data.overview
    Write-Host ""
    Write-Host "ATLAS DB STATS:" -ForegroundColor Cyan
    Write-Host "  Active Jobs:      $($stats.activeJobs)" -ForegroundColor White
    Write-Host "  Total Candidates: $($stats.totalCandidates)" -ForegroundColor White
    Write-Host "  Top Matches:      $($stats.topMatches)" -ForegroundColor White
    Write-Host "  Avg Match Score:  $($stats.avgMatchScore)%" -ForegroundColor White
    Write-Host ""
    Write-Host "ALL SYSTEMS GO. Visit http://localhost:5173" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}
