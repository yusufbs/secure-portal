<#
.SYNOPSIS
    Convenience developer startup script for SecurePortal.
    Launches both .NET 10 Web API and Angular 22 frontend concurrently.
#>

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Starting SecurePortal Full-Stack Development Environment  " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptRoot

Write-Host "Project Root: $projectRoot" -ForegroundColor DarkGray

# 1. Start .NET 10 API in a new PowerShell window
Write-Host "`n[1/2] Launching .NET 10 Web API on http://localhost:5047 / https://localhost:7051..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot/backend/src/Api'; Write-Host '--- SecurePortal .NET 10 API ---' -ForegroundColor Cyan; dotnet run"

# 2. Start Angular 22 Frontend in a new PowerShell window
Write-Host "[2/2] Launching Angular 22 SPA on http://localhost:4200..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot/frontend'; Write-Host '--- SecurePortal Angular 22 ---' -ForegroundColor Green; npm start"

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host " Both servers are launching in dedicated console windows! " -ForegroundColor Green
Write-Host " Frontend: http://localhost:4200                            " -ForegroundColor White
Write-Host " Swagger:  http://localhost:5047/swagger                    " -ForegroundColor White
Write-Host " API Root: http://localhost:5047/api                        " -ForegroundColor White
Write-Host "                                                            " -ForegroundColor White
Write-Host " Default Admin Credentials:                                 " -ForegroundColor Yellow
Write-Host "   Username: admin                                          " -ForegroundColor Yellow
Write-Host "   Password: Admin@Secure2026!P@ss                          " -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
