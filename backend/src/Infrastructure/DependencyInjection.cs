using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SecurePortal.Application.Common.Interfaces;
using SecurePortal.Infrastructure.Identity;
using SecurePortal.Infrastructure.Persistence;
using SecurePortal.Infrastructure.Persistence.Interceptors;

namespace SecurePortal.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("SecurePortalConnection") 
            ?? "Server=localhost;Database=SecurePortalDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true;";

        // 1. Audit & Soft-Delete SaveChanges Interceptor
        services.AddScoped<AuditableEntityInterceptor>();

        // 2. EF Core 10 DbContext with SQL Server Resilience & Retries
        services.AddDbContext<AppDbContext>((serviceProvider, options) =>
        {
            var interceptor = serviceProvider.GetRequiredService<AuditableEntityInterceptor>();

            options.UseSqlServer(connectionString, sqlOptions =>
            {
                sqlOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
                sqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorNumbersToAdd: null);
            });

            options.AddInterceptors(interceptor);
        });

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        services.AddScoped<AppDbContextInitialiser>();

        // 3. ASP.NET Core Data Protection API with Key Persistence to SQL Server
        services.AddDataProtection()
            .SetApplicationName("SecurePortal")
            .PersistKeysToDbContext<AppDbContext>();

        // 4. Security & Identity Services
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddSingleton<IPasswordHashService, PasswordHashService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<SecurePortal.Application.Features.Auth.Services.IAuthService, SecurePortal.Infrastructure.Services.AuthService>();

        // 5. Domain Business Services
        services.AddScoped<SecurePortal.Application.Features.Tasks.Services.ITaskService, SecurePortal.Infrastructure.Services.TaskService>();
        services.AddScoped<SecurePortal.Application.Features.Documents.Services.IDocumentService, SecurePortal.Infrastructure.Services.DocumentService>();
        services.AddScoped<SecurePortal.Application.Features.Audit.Services.IAuditService, SecurePortal.Infrastructure.Services.AuditService>();

        return services;
    }
}
