<#
.SYNOPSIS
  Scaffolds the complete project structure, creates projects, sets references, and configures CPM.
#>
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting Secure Portal Phase 1 Scaffolding               " -ForegroundColor Cyan
Write-Host " Stack: Angular 22 | .NET 10 | SQL Server 2022            " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $PSScriptRoot
Set-Location $rootDir

# -----------------------------------------------------------------------------
# 1. Scaffolding .NET 10 Solution and Projects
# -----------------------------------------------------------------------------
Write-Host "`n[1/4] Scaffolding .NET 10 Clean Architecture Projects..." -ForegroundColor Yellow

$backendDir = Join-Path $rootDir "backend"
if (-not (Test-Path $backendDir)) {
    New-Item -ItemType Directory -Path $backendDir | Out-Null
}

Push-Location $backendDir

if (-not (Test-Path "SecurePortal.sln")) {
    dotnet new sln -n SecurePortal --force
}

# Domain Project
if (-not (Test-Path "src/Domain/SecurePortal.Domain.csproj")) {
    dotnet new classlib -o "src/Domain" -n "SecurePortal.Domain" --force
    Remove-Item -Path "src/Domain/Class1.cs" -ErrorAction SilentlyContinue
    dotnet sln add "src/Domain/SecurePortal.Domain.csproj"
}

# Application Project
if (-not (Test-Path "src/Application/SecurePortal.Application.csproj")) {
    dotnet new classlib -o "src/Application" -n "SecurePortal.Application" --force
    Remove-Item -Path "src/Application/Class1.cs" -ErrorAction SilentlyContinue
    dotnet sln add "src/Application/SecurePortal.Application.csproj"
}

# Infrastructure Project
if (-not (Test-Path "src/Infrastructure/SecurePortal.Infrastructure.csproj")) {
    dotnet new classlib -o "src/Infrastructure" -n "SecurePortal.Infrastructure" --force
    Remove-Item -Path "src/Infrastructure/Class1.cs" -ErrorAction SilentlyContinue
    dotnet sln add "src/Infrastructure/SecurePortal.Infrastructure.csproj"
}

# Api Project (.NET 10 Web API)
if (-not (Test-Path "src/Api/SecurePortal.Api.csproj")) {
    dotnet new webapi -o "src/Api" -n "SecurePortal.Api" --use-controllers --no-openapi --force
    dotnet sln add "src/Api/SecurePortal.Api.csproj"
}

# Add Inter-Project References
Write-Host "Wiring inter-project references..." -ForegroundColor Yellow
dotnet add "src/Application/SecurePortal.Application.csproj" reference "src/Domain/SecurePortal.Domain.csproj"
dotnet add "src/Infrastructure/SecurePortal.Infrastructure.csproj" reference "src/Domain/SecurePortal.Domain.csproj"
dotnet add "src/Infrastructure/SecurePortal.Infrastructure.csproj" reference "src/Application/SecurePortal.Application.csproj"
dotnet add "src/Api/SecurePortal.Api.csproj" reference "src/Application/SecurePortal.Application.csproj"
dotnet add "src/Api/SecurePortal.Api.csproj" reference "src/Infrastructure/SecurePortal.Infrastructure.csproj"

# Add NuGet Package References (Versions managed via Directory.Packages.props)
Write-Host "Adding Central Package references to projects..." -ForegroundColor Yellow
dotnet add "src/Application/SecurePortal.Application.csproj" package FluentValidation
dotnet add "src/Application/SecurePortal.Application.csproj" package FluentValidation.DependencyInjectionExtensions
dotnet add "src/Application/SecurePortal.Application.csproj" package Microsoft.Extensions.Caching.Hybrid

dotnet add "src/Infrastructure/SecurePortal.Infrastructure.csproj" package Microsoft.EntityFrameworkCore.SqlServer
dotnet add "src/Infrastructure/SecurePortal.Infrastructure.csproj" package Microsoft.EntityFrameworkCore.Tools
dotnet add "src/Infrastructure/SecurePortal.Infrastructure.csproj" package Microsoft.AspNetCore.DataProtection.Extensions
dotnet add "src/Infrastructure/SecurePortal.Infrastructure.csproj" package Serilog.AspNetCore

dotnet add "src/Api/SecurePortal.Api.csproj" package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add "src/Api/SecurePortal.Api.csproj" package Microsoft.EntityFrameworkCore.Design
dotnet add "src/Api/SecurePortal.Api.csproj" package Swashbuckle.AspNetCore
dotnet add "src/Api/SecurePortal.Api.csproj" package Serilog.AspNetCore
dotnet add "src/Api/SecurePortal.Api.csproj" package Serilog.Expressions

Pop-Location

# -----------------------------------------------------------------------------
# 2. Compiling and Verifying .NET Backend
# -----------------------------------------------------------------------------
$slnFile = if (Test-Path "$backendDir/SecurePortal.slnx") { "$backendDir/SecurePortal.slnx" } else { "$backendDir/SecurePortal.sln" }
dotnet build $slnFile

# -----------------------------------------------------------------------------
# 3. Scaffolding Angular 22 Frontend
# -----------------------------------------------------------------------------
Write-Host "`n[3/4] Scaffolding Angular 22 Frontend..." -ForegroundColor Yellow
$frontendDir = Join-Path $rootDir "frontend"
if (-not (Test-Path "$frontendDir/package.json")) {
    npx -y @angular/cli@22.0.5 new frontend --directory frontend --routing --style=css --ssr=false --skip-git --package-manager=npm --skip-install
    Push-Location $frontendDir
    npm install
    Pop-Location
} else {
    Write-Host "Frontend directory already initialized." -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# 4. Folder Structure Preparation
# -----------------------------------------------------------------------------
Write-Host "`n[4/4] Establishing Architecture Folders..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path `
    "$backendDir/src/Domain/Common", `
    "$backendDir/src/Domain/Entities", `
    "$backendDir/src/Domain/Enums", `
    "$backendDir/src/Application/Common", `
    "$backendDir/src/Application/Features", `
    "$backendDir/src/Application/Behaviors", `
    "$backendDir/src/Infrastructure/Persistence", `
    "$backendDir/src/Infrastructure/Identity", `
    "$backendDir/src/Infrastructure/Logging", `
    "$backendDir/src/Api/Middleware", `
    "$frontendDir/src/app/core", `
    "$frontendDir/src/app/core/guards", `
    "$frontendDir/src/app/core/interceptors", `
    "$frontendDir/src/app/core/services", `
    "$frontendDir/src/app/features", `
    "$frontendDir/src/app/shared" | Out-Null

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " Phase 1 Infrastructure Successfully Scaffolding Done!    " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
