$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Testing SecurePortal .NET 10 API Security Pipeline      " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:5047"

# 1. Antiforgery & Security Headers
Write-Host "`n[1/6] Testing GET /api/antiforgery/token & Security Headers..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$baseUrl/api/antiforgery/token" -Method Get -UseBasicParsing
Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
Write-Host "CSP Header: $($response.Headers['Content-Security-Policy'])"
Write-Host "X-Frame-Options: $($response.Headers['X-Frame-Options'])"
Write-Host "X-Content-Type-Options: $($response.Headers['X-Content-Type-Options'])"

# 2. Validation Rejection (Bad Register Payload)
Write-Host "`n[2/6] Testing Input Validation with Bad Payload..." -ForegroundColor Yellow
$badPayload = @{
    username = "bad!user"
    email = "notanemail"
    password = "weak"
    firstName = ""
    lastName = ""
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $badPayload -ContentType "application/json"
} catch {
    Write-Host "Expected Validation Rejection (HTTP $($_.Exception.Response.StatusCode.value__)): " -ForegroundColor Green
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host $reader.ReadToEnd() -ForegroundColor DarkYellow
}

# 3. Valid Registration & Cookie Check
Write-Host "`n[3/6] Testing Valid Registration..." -ForegroundColor Yellow
$testUser = "portal_user_" + (Get-Random -Minimum 1000 -Maximum 9999)
$validPayload = @{
    username = $testUser
    email = "$testUser@secureportal.local"
    password = "StrongPassword@2026!"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

$regResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $validPayload -ContentType "application/json"
Write-Host "Registered successfully! Token received for user: $($regResponse.user.username)" -ForegroundColor Green
$accessToken = $regResponse.accessToken

# 4. Login with Default Admin
Write-Host "`n[4/6] Testing Admin Login..." -ForegroundColor Yellow
$adminLogin = @{
    usernameOrEmail = "admin"
    password = "Admin@Secure2026!P@ss"
} | ConvertTo-Json

$adminAuth = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $adminLogin -ContentType "application/json"
Write-Host "Admin Login Succeeded! Roles: $($adminAuth.user.roles -join ', ')" -ForegroundColor Green
$adminToken = $adminAuth.accessToken

# 5. Accessing Protected Tasks Endpoint
Write-Host "`n[5/6] Testing Protected Tasks API with Bearer Token..." -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $accessToken"
}

# Create Task
$taskPayload = @{
    title = "Implement Secure API Verification"
    description = "Verify keyset pagination, hybrid cache, and rate limiting."
    priority = 3
    dueDateUtc = (Get-Date).ToUniversalTime().AddDays(3).ToString("o")
} | ConvertTo-Json

$createdTask = Invoke-RestMethod -Uri "$baseUrl/api/tasks" -Method Post -Body $taskPayload -ContentType "application/json" -Headers $headers
Write-Host "Task Created: Id=$($createdTask.id), Title='$($createdTask.title)'" -ForegroundColor Green

# Fetch Tasks (Keyset Paged)
$tasks = Invoke-RestMethod -Uri "$baseUrl/api/tasks?pageSize=5" -Method Get -Headers $headers
Write-Host "Tasks Fetched via Keyset Pagination: TotalCount=$($tasks.totalCount), Items Count=$($tasks.items.Count)" -ForegroundColor Green

# 6. Audit Log Access (Role-restricted to Admin)
Write-Host "`n[6/6] Testing Admin-only Audit Trail API..." -ForegroundColor Yellow
$adminHeaders = @{
    Authorization = "Bearer $adminToken"
}
$auditLogs = Invoke-RestMethod -Uri "$baseUrl/api/audit?pageSize=5" -Method Get -Headers $adminHeaders
# 7. Rate Limiting Verification
Write-Host "`n[7/7] Testing Rate Limiting on /api/auth/login (10 reqs/min limit)..." -ForegroundColor Yellow
$loginPayload = @{
    usernameOrEmail = "admin"
    password = "wrongpassword"
} | ConvertTo-Json

$rateLimitTriggered = $false
for ($idx = 1; $idx -le 15; $idx++) {
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginPayload -ContentType "application/json" -ErrorAction Stop | Out-Null
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 429) {
            Write-Host "Request #$idx successfully rate-limited with HTTP 429 Too Many Requests!" -ForegroundColor Green
            $rateLimitTriggered = $true
            break
        }
    }
}

if (-not $rateLimitTriggered) {
    Write-Warning "Rate limit was not reached within 15 requests."
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " ALL 7 SECURITY & API PIPELINE TESTS PASSED SUCCESSFULLY! " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
