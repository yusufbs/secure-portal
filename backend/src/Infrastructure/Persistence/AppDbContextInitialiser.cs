using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SecurePortal.Application.Common.Interfaces;
using SecurePortal.Domain.Entities;
using SecurePortal.Domain.Enums;

namespace SecurePortal.Infrastructure.Persistence;

public class AppDbContextInitialiser
{
    private readonly ILogger<AppDbContextInitialiser> _logger;
    private readonly AppDbContext _context;
    private readonly IPasswordHashService _passwordHasher;

    public AppDbContextInitialiser(
        ILogger<AppDbContextInitialiser> logger,
        AppDbContext context,
        IPasswordHashService passwordHasher)
    {
        _logger = logger;
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task InitialiseAsync()
    {
        try
        {
            if (_context.Database.IsSqlServer())
            {
                await _context.Database.MigrateAsync();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while initialising the database.");
            throw;
        }
    }

    public async Task SeedAsync()
    {
        try
        {
            await TrySeedAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while seeding the database.");
            throw;
        }
    }

    private async Task TrySeedAsync()
    {
        // 1. Seed Roles
        var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Type == RoleType.Admin);
        if (adminRole == null)
        {
            adminRole = new Role
            {
                Id = Guid.NewGuid(),
                Name = nameof(RoleType.Admin),
                Type = RoleType.Admin,
                Description = "Full administrative access across the portal"
            };
            _context.Roles.Add(adminRole);
        }

        var managerRole = await _context.Roles.FirstOrDefaultAsync(r => r.Type == RoleType.Manager);
        if (managerRole == null)
        {
            managerRole = new Role
            {
                Id = Guid.NewGuid(),
                Name = nameof(RoleType.Manager),
                Type = RoleType.Manager,
                Description = "Operational management access for tasks and documents"
            };
            _context.Roles.Add(managerRole);
        }

        var memberRole = await _context.Roles.FirstOrDefaultAsync(r => r.Type == RoleType.Member);
        if (memberRole == null)
        {
            memberRole = new Role
            {
                Id = Guid.NewGuid(),
                Name = nameof(RoleType.Member),
                Type = RoleType.Member,
                Description = "Standard portal user member"
            };
            _context.Roles.Add(memberRole);
        }

        await _context.SaveChangesAsync();

        // 2. Seed Default Administrator
        var adminEmail = "admin@secureportal.local";
        var defaultAdmin = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == adminEmail);

        if (defaultAdmin == null)
        {
            var adminUser = new User
            {
                Id = Guid.NewGuid(),
                Username = "admin",
                Email = adminEmail,
                FirstName = "Portal",
                LastName = "Administrator",
                IsActive = true,
                PasswordHash = _passwordHasher.HashPassword("Admin@Secure2026!P@ss"),
                CreatedAtUtc = DateTime.UtcNow,
                CreatedBy = "SystemInitialiser"
            };

            adminUser.UserRoles.Add(new UserRole
            {
                UserId = adminUser.Id,
                RoleId = adminRole.Id
            });

            _context.Users.Add(adminUser);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Default administrator account successfully created ({Email}).", adminEmail);
        }
    }
}
