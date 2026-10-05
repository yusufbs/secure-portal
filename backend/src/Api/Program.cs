using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using SecurePortal.Api.Middleware;
using SecurePortal.Application;
using SecurePortal.Domain.Enums;
using SecurePortal.Infrastructure;
using SecurePortal.Infrastructure.Logging;
using SecurePortal.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// -----------------------------------------------------------------------------
// 1. Structured Logging with Serilog & PII Redaction
// -----------------------------------------------------------------------------
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.With<SerilogPiiMaskingEnricher>()
    .WriteTo.Console(
        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}",
        formatProvider: System.Globalization.CultureInfo.InvariantCulture)
    .CreateLogger();

builder.Host.UseSerilog();

// -----------------------------------------------------------------------------
// 2. Application & Infrastructure Service Layers
// -----------------------------------------------------------------------------
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

// -----------------------------------------------------------------------------
// 3. Exception Handling & RFC 7807 Problem Details
// -----------------------------------------------------------------------------
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// -----------------------------------------------------------------------------
// 4. Rate Limiting Configuration
// -----------------------------------------------------------------------------
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.ContentType = "application/problem+json";
        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status429TooManyRequests,
            Title = "Too Many Requests",
            Detail = "Rate limit exceeded. Please wait before attempting further requests.",
            Instance = context.HttpContext.Request.Path
        };
        problem.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
        problem.Extensions["retryAfter"] = "60s";
        await context.HttpContext.Response.WriteAsJsonAsync(problem, token);
    };

    // Global sliding window limiter (100 reqs/min per client IP)
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 6,
                QueueLimit = 0
            });
    });

    // Stricter rate limiter for sensitive authentication endpoints (10 reqs/min per IP)
    options.AddPolicy("AuthRateLimit", httpContext =>
    {
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
    });
});

// -----------------------------------------------------------------------------
// 5. Antiforgery / CSRF Protection
// -----------------------------------------------------------------------------
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-XSRF-TOKEN";
    options.Cookie.Name = "XSRF-TOKEN";
    options.Cookie.HttpOnly = false; // Accessible by Angular XSRF interceptor
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment() 
        ? CookieSecurePolicy.SameAsRequest 
        : CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Strict;
});

// -----------------------------------------------------------------------------
// 6. Cross-Origin Resource Sharing (CORS)
// -----------------------------------------------------------------------------
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
    ?? new[] { "https://localhost:4200" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularClient", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowCredentials()
            .WithHeaders("Authorization", "Content-Type", "X-XSRF-TOKEN")
            .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS");
    });
});

// -----------------------------------------------------------------------------
// 7. JWT Bearer & Cookie Authentication
// -----------------------------------------------------------------------------
var jwtSecret = builder.Configuration["JwtSettings:Secret"] 
    ?? throw new InvalidOperationException("JwtSettings:Secret is not configured.");
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "https://localhost:7123";
var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? "https://localhost:4200";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = true;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };

    // Dual-mode support: Authorization Bearer header OR fallback to HttpOnly __Host-access-token cookie
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (string.IsNullOrEmpty(context.Token))
            {
                if (context.Request.Cookies.TryGetValue("__Host-access-token", out var cookieToken) ||
                    context.Request.Cookies.TryGetValue("access-token", out cookieToken))
                {
                    context.Token = cookieToken;
                }
            }
            return Task.CompletedTask;
        }
    };
});

// -----------------------------------------------------------------------------
// 8. Authorization Policies
// -----------------------------------------------------------------------------
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole(nameof(RoleType.Admin)));
    options.AddPolicy("ManagerOrAdmin", policy => policy.RequireRole(nameof(RoleType.Admin), nameof(RoleType.Manager)));
    options.AddPolicy("AuthenticatedUser", policy => policy.RequireAuthenticatedUser());
});

// -----------------------------------------------------------------------------
// 9. API Controllers & OpenAPI / Swagger
// -----------------------------------------------------------------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "SecurePortal API",
        Version = "v1",
        Description = "Enterprise REST API with JWT, Secure Cookies, Keyset Pagination, and AppSec hardening."
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT token in the format: Bearer {token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// -----------------------------------------------------------------------------
// 10. Database Initialisation & Seeding
// -----------------------------------------------------------------------------
using (var scope = app.Services.CreateScope())
{
    var initialiser = scope.ServiceProvider.GetRequiredService<AppDbContextInitialiser>();
    await initialiser.InitialiseAsync();
    await initialiser.SeedAsync();
}

// -----------------------------------------------------------------------------
// 11. Security Pipeline Configuration
// -----------------------------------------------------------------------------
// Custom Security Headers (CSP, X-Frame-Options, nosniff, etc.)
app.UseMiddleware<SecurityHeadersMiddleware>();

// Global Exception Handler (RFC 7807 ProblemDetails)
app.UseExceptionHandler();

// HTTPS Redirection & HSTS
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}
app.UseHttpsRedirection();

// Swagger Documentation
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "SecurePortal API v1");
    c.RoutePrefix = "swagger";
});

// CORS
app.UseCors("AllowAngularClient");

// Rate Limiting
app.UseRateLimiter();

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Antiforgery middleware
app.UseAntiforgery();

app.MapControllers();

app.Run();
