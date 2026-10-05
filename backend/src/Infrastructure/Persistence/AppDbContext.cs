using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SecurePortal.Application.Common.Interfaces;
using SecurePortal.Domain.Entities;

namespace SecurePortal.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext, IDataProtectionKeyContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<AuditEntry> AuditEntries => Set<AuditEntry>();

    // ASP.NET Core Data Protection Key Persistence
    public DbSet<DataProtectionKey> DataProtectionKeys => Set<DataProtectionKey>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
