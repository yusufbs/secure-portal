<#
.SYNOPSIS
  Generates and trusts ASP.NET Core local developer HTTPS certificates.
#>
Write-Host "Configuring Local HTTPS Developer Certificate..." -ForegroundColor Cyan

# Clean existing dev certs
dotnet dev-certs https --clean

# Generate and trust new dev cert
dotnet dev-certs https -t

Write-Host "HTTPS Developer Certificate installed and trusted successfully." -ForegroundColor Green
