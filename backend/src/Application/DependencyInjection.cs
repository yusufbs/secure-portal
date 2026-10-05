using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace SecurePortal.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // 1. FluentValidation automatic validator discovery
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        // 2. High-Performance Multi-tier HybridCache
        services.AddHybridCache();

        return services;
    }
}
