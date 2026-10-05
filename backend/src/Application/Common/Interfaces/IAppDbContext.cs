using Microsoft.EntityFrameworkCore;
using SecurePortal.Domain.Entities;

namespace SecurePortal.Application.Common.Interfaces;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<TaskItem> Tasks { get; }
    DbSet<Document> Documents { get; }
    DbSet<AuditEntry> AuditEntries { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
