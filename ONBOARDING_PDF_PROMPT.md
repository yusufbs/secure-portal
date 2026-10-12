# PROMPT: GENERATE NEW EMPLOYEE ONBOARDING & ARCHITECTURE PDF GUIDE

Copy and paste the prompt below into any AI Assistant (with Python/Code Execution or PDF generation tools) to automatically generate a comprehensive, corporate-styled **New Employee Onboarding & Technical Reference PDF** (`SecurePortal_Employee_Onboarding_Guide.pdf`).

---

```markdown
You are a Principal Technical Writer, Software Architect, and Developer Advocate.
Your task is to generate a comprehensive, professionally formatted PDF document titled:
"SecurePortal: New Employee Onboarding, Architecture & Security Reference Guide" (`SecurePortal_Employee_Onboarding_Guide.pdf`).

The PDF must be designed for new engineering hires joining the team so they can understand:
1. The exact Master Prompt and architectural specification used to build the application.
2. A detailed functional and technical explanation of what the application does across the Frontend, Backend, and Database layers.
3. How each of the 15 Mandatory Security Pillars and High-Performance patterns works in code.
4. A complete, step-by-step guide to setting up, running, testing, and troubleshooting the application on a local Windows machine.

Use Python (e.g., `reportlab`, `fpdf2`, `weasyprint`, or HTML-to-PDF via `playwright`) to generate the final PDF file with:
- A professional Cover Page (Title, Subtitle, Tech Stack: Angular 22, .NET 10, EF Core 10, SQL Server, Date, Version 1.0).
- A structured Table of Contents.
- Clean typography, styled section headers, formatted tables, callout boxes for security notes, and monospaced code/command blocks.
- Page headers and footers with page numbers.

Include ALL of the following content in full detail within the generated PDF:

================================================================================
SECTION 1: EXECUTIVE OVERVIEW — WHAT SECUREPORTAL DOES
================================================================================

### 1.1 Purpose & Business Domain
SecurePortal is an enterprise-grade, highly performant **Secure Document & Task Management Portal** built as a reference full-stack application. It demonstrates modern software engineering best practices using:
- **Frontend:** Angular 22 (Zoneless Change Detection, Signals, Standalone Components with separated `.ts`, `.html`, and `.css` files, Modern Control Flow `@if`/`@for`, Deferrable Views `@defer`).
- **Backend:** .NET 10 Web API (C# 14, Clean Architecture split across `Domain`, `Application`, `Infrastructure`, and `Api`, Entity Framework Core 10, MediatR / CQRS, FluentValidation).
- **Database:** Microsoft SQL Server (`SecurePortalDb` with Snapshot Isolation, EF Core 10 Migrations, Keyset Pagination Indexes, and Persisted Data Protection Keys).

### 1.2 Core Functional Modules
1. **Identity, Authentication & Role-Based Access Control (RBAC):**
   - Supports user registration and login using dual-mode authentication: JWT Bearer tokens + `HttpOnly`, `SameSite=Strict` secure cookies with Refresh Token Rotation (RTR).
   - Enforces three hierarchical roles: `Admin`, `Manager`, and `Member`.
   - Protects routes on the client via functional guards (`authGuard`, `adminGuard`) and on the server via ASP.NET Core authorization policies.
2. **Interactive Security Dashboard & Telemetry:**
   - Displays real-time workflow metrics: Total Tasks, Tasks In Progress, Completed Tasks, and SHA-256 Verified Documents.
   - Uses Angular 22 `@defer (on viewport)` to lazily render the Security & Runtime Telemetry panel (Session Protection status, SQL Server Data Protection key status, and Sliding Window Rate Limiter status).
3. **High-Performance Task Management:**
   - Full CRUD lifecycle for enterprise tasks with priority levels (`Low`, `Medium`, `High`, `Critical`) and statuses (`To Do`, `In Progress`, `In Review`, `Completed`, `Cancelled`).
   - Uses **Keyset (Cursor) Pagination** (`base64(CreatedAtUtc|Id)`) instead of traditional SQL `OFFSET/FETCH` for O(1) query performance at scale.
   - Accelerated by **.NET 10 HybridCache** with tag-based cache invalidation (`tasks` tag).
4. **Secure Documents Vault:**
   - Drag-and-drop file upload vault with strict extension whitelisting/blacklisting (blocks executables/scripts like `.exe`, `.dll`, `.bat`, `.ps1`, `.sh`) and a 25 MB size limit.
   - Computes a cryptographic **SHA-256 checksum** for every uploaded file to guarantee file integrity and detect tampering.
5. **Admin Compliance Audit Trail:**
   - Restricted exclusively to `Admin` users (`/api/audit`).
   - Powered by an EF Core `AuditableEntityInterceptor` that automatically captures every `Added`, `Modified`, and `Deleted` entity change across the database.
   - Includes a live JSON Diff Inspector in the UI (`Old Values` vs `New Values` and `Changed Columns`) while automatically redacting sensitive fields (`PasswordHash`, `RefreshToken`, `SecurityStamp`) to `[REDACTED]`.

================================================================================
SECTION 2: THE COMPLETE ORIGINAL MASTER PROMPT
================================================================================

Include the following verbatim Master Prompt that was used to architect and build this system:

--- BEGIN MASTER PROMPT ---
# MASTER PROMPT: PRODUCTION-GRADE FULL-STACK ARCHITECTURE & IMPLEMENTATION

You are a Principal Software Architect and Application Security (AppSec) Specialist. 
Your objective is to design and implement a production-grade, highly performant, end-to-end sample application using:
- **Frontend:** Angular 22 (Standalone Components, Signals, Zoneless, Modern Control Flow)
- **Backend:** .NET 10 Web API (C# 14, Clean/Vertical Slice Architecture, EF Core 10)
- **Database:** Microsoft SQL Server (Docker-ready, EF Core Migrations, Indexing best practices)

## 1. MANDATORY SECURITY & ARCHITECTURAL PILLARS

Every layer of this application must strictly implement the following 15 security and engineering standards:

### 1. Authentication & Authorization
- Implement token-based authentication using the **Backend-For-Frontend (BFF)** pattern or **Secure Cookie-backed JWT with Refresh Token Rotation**.
- In Angular: Functional guards (`canActivate: [authGuard]`), functional role/permission resolvers, and state stored in Signals.
- In .NET: Policy-based and Claims-based authorization (`[Authorize(Policy = "...")]`), fine-grained permission handlers (`IAuthorizationRequirement`).

### 2. Transport Layer Security (HTTPS & HSTS)
- Force HTTPS redirection with status code 308/301.
- Configure HTTP Strict Transport Security (HSTS) with `max-age=31536000; includeSubDomains; preload`.
- Modern TLS cipher suites and TLS 1.3 enforcement.

### 3. Input Validation
- **Backend:** `FluentValidation` auto-wired into the ASP.NET pipeline with automatic standard RFC 7807 `ProblemDetails` validation responses. Zero tolerance for unvalidated DTOs.
- **Frontend:** Typed Reactive Forms (`FormGroup`, `FormControl`), custom validators, and sanitation before sending payloads.

### 4. SQL Injection Prevention
- Enforce EF Core LINQ parameterized queries by default.
- Never use dynamic string concatenation or raw string interpolation in SQL queries.
- If raw SQL is needed, use `FromSqlInterpolated` or parameterized Dapper queries with explicit `DbParameter` mapping.
- Apply database principle of least privilege (app user cannot execute DDL or drop tables).

### 5. Cross-Origin Resource Sharing (CORS)
- Strict origin whitelisting loaded from environment/configuration (no wildcards `*` when credentials are permitted).
- Explicit allowed headers (`Content-Type`, `Authorization`, `X-XSRF-TOKEN`), exposed headers, and explicit methods (`GET`, `POST`, `PUT`, `DELETE`).

### 6. Cross-Site Request Forgery (CSRF / XSRF)
- Implement Double-Submit Cookie pattern or ASP.NET Core `IAntiforgery` token validation.
- Angular functional HTTP interceptor (`xsrfInterceptor`) reading the token from `XSRF-TOKEN` cookie and setting the `X-XSRF-TOKEN` request header.
- Antiforgery middleware applied to all state-changing endpoints (`POST`, `PUT`, `DELETE`, `PATCH`).

### 7. Rate Limiting & DoS Protection
- Use .NET 10 built-in `Microsoft.AspNetCore.RateLimiting`.
- Configure sliding window and token bucket policies by client IP and authenticated User ID.
- Dedicated stricter rate-limiting on sensitive endpoints (`/api/auth/login`, `/api/auth/register`, `/api/auth/refresh-token`).
- Return HTTP 429 Too Many Requests with standard `Retry-After` headers.

### 8. Secure Cookie Architecture
- Authentication and session cookies must have flags:
  - `HttpOnly = true` (inaccessible to JavaScript)
  - `Secure = true` (transmitted only over HTTPS)
  - `SameSite = SameSiteMode.Strict`
  - Cookie naming prefixed with `__Host-` or `__Secure-` (e.g., `__Host-access-token`).

### 9. Secrets Management & Configuration
- Zero secrets, connection strings, or credentials committed to source code.
- Local Development: Use .NET `dotnet user-secrets` and Angular environment substitution.
- Production: Environment variables, Azure Key Vault, or Docker Secret mounts.
- Implement options validation on startup using `.ValidateDataAnnotations().ValidateOnStart()`.

### 10. Security Response Headers
Inject hardened HTTP security headers via middleware:
- `Content-Security-Policy`: Default strict CSP prohibiting `unsafe-eval` and framing (`frame-ancestors 'none'`).
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`: Disable camera, microphone, geolocation, payment.
- Remove server banner headers (`X-Powered-By`, `Server: Kestrel`).

### 11. Error Handling & RFC 7807 Problem Details
- **Backend:** Centralized error handling using .NET 10 `IExceptionHandler`. Map domain exceptions to RFC 7807 `ProblemDetails` with unique trace IDs (`traceparent` / `Activity.Current?.Id`). No stack traces or internal DB details leaked in production.
- **Frontend:** Global `ErrorHandler` and functional `HttpInterceptor` to catch HTTP 400, 401, 403, 404, 429, 500 and display user-friendly toast notifications.

### 12. Secure Logging & Auditing
- Structured logging using `Serilog` with JSON/structured output.
- Log enrichment with `CorrelationId`, `UserId`, `ClientIP`.
- Automatic PII/Secret masking/redaction (strip passwords, tokens, credit card numbers, SSNs from logs).
- Dedicated audit log entries for authentication attempts, permission failures, and critical data modifications.

### 13. Data Protection & Cryptography
- Configure ASP.NET Core Data Protection API (`AddDataProtection()`) with persistent key storage in SQL Server.
- Passwords hashed using PBKDF2 / ASP.NET Identity Core `IPasswordHasher<User>`.

### 14. Dependency Security & Supply Chain
- `package.json` with strict versioning and `package-lock.json` checked into Git.
- `Directory.Packages.props` for Central Package Management (CPM) in .NET with vulnerability auditing enabled (`<NuGetAudit>true</NuGetAudit>`).

### 15. High Performance Engineering
- **Backend:** .NET 10 `HybridCache`, `.AsNoTracking()` on read queries, Keyset (cursor) pagination.
- **Frontend:** Angular 22 Signals (`signal`, `computed`), Zoneless mode (`provideZonelessChangeDetection()`), Deferrable views (`@defer (on viewport)`), Modern control flow (`@if`, `@for`), Route lazy loading.

## 2. IMPLEMENTATION PHASES
- **Phase 1:** Project Setup & Infrastructure (`docker-compose.yml`, `.slnx`, `Directory.Build.props`, `Directory.Packages.props`, Angular 22 setup).
- **Phase 2:** Database Layer & Data Protection (Domain entities, EF Core 10 `AppDbContext`, `AuditableEntityInterceptor`, Data Protection keys table, initial migration & seeding).
- **Phase 3:** .NET 10 Security Engine & API Pipeline (Security headers, RFC 7807 `GlobalExceptionHandler`, Rate limiting, CSRF token endpoint, Auth/Tasks/Documents/Audit controllers).
- **Phase 4:** Angular 22 Frontend Implementation (Zoneless config, Signals state, functional interceptors/guards, standalone views with separated `.html` and `.css` files).
- **Phase 5:** Verification & Security Hardening (22-point automated security test suite + dependency vulnerability audits).
--- END MASTER PROMPT ---

================================================================================
SECTION 3: ARCHITECTURAL BLUEPRINT & REPOSITORY STRUCTURE
================================================================================

Document the exact repository structure located at `C:\Projects\secure-portal`:

```text
C:\Projects\secure-portal\
├── backend/
│   ├── Directory.Build.props          # C# 14, Nullable=enable, AnalysisLevel=latest
│   ├── Directory.Packages.props       # Central Package Management (CPM) & NuGetAudit
│   ├── nuget.config                   # Isolated official NuGet feed
│   ├── SecurePortal.slnx              # .NET 10 XML Solution file
│   └── src/
│       ├── Domain/                    # Entities: User, Role, UserRole, TaskItem, Document, AuditEntry
│       ├── Application/               # DTOs, FluentValidation validators, Interfaces, Keyset PagedResult
│       ├── Infrastructure/            # EF Core 10 AppDbContext, AuditableEntityInterceptor, Serilog PII Masking, Seed
│       └── Api/                       # Controllers (Auth, Tasks, Documents, Audit, Antiforgery), Middlewares, Program.cs
├── frontend/
│   ├── angular.json                   # Build/Serve configs with development fileReplacements
│   ├── package.json                   # Angular 22 dependencies (0 vulnerabilities)
│   └── src/
│       ├── environments/
│       │   ├── environment.ts             # Production config (apiUrl: '/api')
│       │   └── environment.development.ts # Development config (apiUrl: 'http://localhost:5047/api')
│       └── app/
│           ├── core/                  # Services (Auth, Task, Document, Audit, Toast), Guards, Interceptors
│           ├── shared/components/     # Navbar & Toast (.ts, .html, .css separated)
│           └── features/              # Login, Register, Dashboard, Tasks, Documents, Audit (.ts, .html, .css separated)
├── scripts/
│   ├── setup.ps1                      # Full project initialization script
│   ├── dev-certs.ps1                  # Local HTTPS development certificate script
│   ├── sql-init.sql                   # SQL Server snapshot isolation setup script
│   ├── start-dev.ps1                  # One-click concurrent Backend + Frontend launcher
│   ├── test-api.ps1                   # Core API verification script
│   └── test-security-e2e.ps1          # 22-check automated security & performance test suite
├── docker-compose.yml                 # Containerized SQL Server 2022 definition
└── README.md                          # Project documentation
```

================================================================================
SECTION 4: STEP-BY-STEP LOCAL MACHINE SETUP & EXECUTION GUIDE
================================================================================

Provide clear, copy-pasteable instructions for a new employee setting up the project on Windows:

### Step 1: Verify Prerequisites
Open PowerShell and verify the required SDKs and tools are installed:
```powershell
dotnet --version   # Must be 10.0.100 or higher (e.g., 10.0.400)
node --version     # Must be v22.12+ or v24+
npm --version      # Must be 10+
sqlcmd -?          # SQL Server Command Line Tool (or Docker Desktop)
```

### Step 2: Clone and Navigate to the Repository
```powershell
cd C:\Projects\secure-portal
```

### Step 3: Database Location & Initialization
Explain both options to the new employee:
- **Local SQL Server Instance (Default in `appsettings.json`):**
  - **Connection String:** `Server=localhost;Database=SecurePortalDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true;`
  - **Database Name:** `SecurePortalDb`
  - **Physical Files (when using local MSSQLSERVER):**
    - Data: `C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\DATA\SecurePortalDb.mdf`
    - Log: `C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\DATA\SecurePortalDb_log.ldf`
  - **Apply Migrations & Seed Data (if setting up on a new machine):**
    ```powershell
    dotnet ef database update --project backend/src/Infrastructure --startup-project backend/src/Api
    ```
    *(Note: The API also automatically runs migrations and seeds the `Admin`, `Manager`, and `Member` roles plus the default `admin` user on startup!)*
- **Docker Alternative (if local SQL Server is not installed):**
  ```powershell
  docker-compose up -d database
  ```

### Step 4: Build & Verify Zero Warnings / Zero Vulnerabilities
1. **Build the .NET 10 Backend:**
   ```powershell
   dotnet build backend/SecurePortal.slnx
   ```
   *(Expected: `Build succeeded. 0 Warning(s), 0 Error(s)`)*
2. **Audit Backend NuGet Packages:**
   ```powershell
   dotnet list backend/SecurePortal.slnx package --vulnerable --include-transitive
   ```
   *(Expected: 0 vulnerable packages across all 4 projects)*
3. **Install & Build the Angular 22 Frontend:**
   ```powershell
   cd frontend
   npm install
   npm run build
   npm audit
   cd ..
   ```
   *(Expected: Initial bundle ~84.4 kB transfer size, `found 0 vulnerabilities`)*

### Step 5: Launch the Application (Backend + Frontend)
- **Option A — Automated One-Command Startup (Recommended):**
  From `C:\Projects\secure-portal`, run:
  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts/start-dev.ps1
  ```
  This opens two dedicated PowerShell windows:
  1. **.NET 10 Web API:** Listening on `http://localhost:5047` (and Swagger UI at `http://localhost:5047/swagger`)
  2. **Angular 22 Dev Server:** Listening on `http://localhost:4200`

- **Option B — Manual Startup in Separate Terminals:**
  - **Terminal 1 (Backend):**
    ```powershell
    cd C:\Projects\secure-portal
    dotnet run --project backend/src/Api
    ```
  - **Terminal 2 (Frontend):**
    ```powershell
    cd C:\Projects\secure-portal\frontend
    npm start
    ```

### Step 6: Log In and Explore Features
1. Open your browser to `http://localhost:4200/login`.
2. Sign in with the seeded **Administrator Credentials**:
   - **Username:** `admin` (or `admin@secureportal.local`)
   - **Password:** `Admin@Secure2026!P@ss`
3. Test the application workflows:
   - **Dashboard (`/dashboard`):** View task & document counters and scroll down to trigger the `@defer (on viewport)` telemetry widget.
   - **Tasks (`/tasks`):** Create tasks, filter by status/priority, search, and test keyset cursor pagination.
   - **Documents (`/documents`):** Upload a PDF/image/text file, inspect its generated SHA-256 hash, click the hash badge to copy it, and download the file. Try uploading a `.exe` or `.ps1` file to see client/server security rejection in action.
   - **Audit Trail (`/audit`):** Inspect chronological database changes and click **Inspect** on any row to view the JSON diff (`oldValues` vs `newValues`) and verify that `PasswordHash` and `RefreshToken` are masked as `[REDACTED]`.

### Step 7: Run the Automated 22-Point End-to-End Security Suite
Run the automated verification script at any time to validate all 15 security pillars:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/test-security-e2e.ps1
```
*(Expected Output: `SUITE RESULTS: 22 PASSED, 0 FAILED` covering CSP headers, X-Frame-Options, nosniff, Server header stripping, XSRF-TOKEN cookie, FluentValidation 400 ProblemDetails, SQL injection rejection, JWT auth, RBAC 403 vs 200, PII redaction, Keyset pagination, Rate limiting HTTP 429, and dependency audits).*

================================================================================
SECTION 5: DEVELOPER FAQ & TROUBLESHOOTING GUIDE (FROM OUR SESSION)
================================================================================

Include a dedicated troubleshooting section documenting key lessons learned during development:

1. **Issue: Running `ng serve` uses the Production environment file (`apiUrl: '/api'`) instead of Development (`http://localhost:5047/api`).**
   - **Cause:** Angular's `@angular/build:application` builder requires an explicit `fileReplacements` rule under `architect.build.configurations.development` in `frontend/angular.json`.
   - **Fix Applied:** `angular.json` is configured with:
     ```json
     "development": {
       "optimization": false,
       "extractLicenses": false,
       "sourceMap": true,
       "fileReplacements": [
         {
           "replace": "src/environments/environment.ts",
           "with": "src/environments/environment.development.ts"
         }
       ]
     }
     ```

2. **Issue: Red Toaster on Login saying `"Unable to communicate with the secure server"` (HTTP Status 0).**
   - **Cause:** HTTP status `0` occurs when either the `.NET 10 API` is not running on port `5047`, or a stale backend process is running without `http://localhost:4200` in its `Cors:AllowedOrigins` or with `UseHttpsRedirection` intercepting HTTP preflight `OPTIONS` requests before `UseCors`.
   - **Fix Applied:**
     - `appsettings.json` and `appsettings.Development.json` include both `"https://localhost:4200"` and `"http://localhost:4200"` in `Cors:AllowedOrigins`.
     - In `Program.cs`, `app.UseCors("AllowAngularClient")` is placed *before* `UseHttpsRedirection()`, and `UseHttpsRedirection()` is guarded by `if (!app.Environment.IsDevelopment())`.
     - In `SecurityHeadersMiddleware.cs`, `connect-src` permits `http://localhost:4200` and `http://localhost:5047`.

3. **Issue: Build error `MSB3027 / MSB3021: Could not copy apphost.exe to SecurePortal.Api.exe because it is being used by another process`.**
   - **Cause:** An existing instance of `SecurePortal.Api.exe` is already running and locking the binary.
   - **Solution:** Stop the running API terminal (Ctrl+C) or terminate the process in PowerShell before rebuilding:
     ```powershell
     Stop-Process -Name "SecurePortal.Api" -Force -ErrorAction SilentlyContinue
     ```
```
