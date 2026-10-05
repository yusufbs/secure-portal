using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using SecurePortal.Application.Common.Interfaces;
using SecurePortal.Domain.Common;
using SecurePortal.Domain.Entities;

namespace SecurePortal.Infrastructure.Persistence.Interceptors;

public class AuditableEntityInterceptor : SaveChangesInterceptor
{
    private readonly ICurrentUserService _currentUserService;
    private static readonly HashSet<string> SensitiveProperties = new(StringComparer.OrdinalIgnoreCase)
    {
        nameof(User.PasswordHash),
        nameof(User.SecurityStamp),
        nameof(User.RefreshToken)
    };

    public AuditableEntityInterceptor(ICurrentUserService currentUserService)
    {
        _currentUserService = currentUserService;
    }

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        UpdateEntities(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        UpdateEntities(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void UpdateEntities(DbContext? context)
    {
        if (context == null) return;

        var currentUserId = _currentUserService.UserId?.ToString() ?? "System";
        var currentUsername = _currentUserService.Username ?? "System";
        var clientIp = _currentUserService.IpAddress;
        var utcNow = DateTime.UtcNow;

        var auditEntries = new List<AuditEntry>();

        foreach (var entry in context.ChangeTracker.Entries())
        {
            if (entry.Entity is AuditableEntity auditable)
            {
                if (entry.State == EntityState.Added)
                {
                    auditable.CreatedAtUtc = utcNow;
                    auditable.CreatedBy = currentUsername;
                }
                else if (entry.State == EntityState.Modified)
                {
                    auditable.LastModifiedAtUtc = utcNow;
                    auditable.LastModifiedBy = currentUsername;
                }
                else if (entry.State == EntityState.Deleted)
                {
                    // Soft delete pattern
                    entry.State = EntityState.Modified;
                    auditable.IsDeleted = true;
                    auditable.DeletedAtUtc = utcNow;
                    auditable.DeletedBy = currentUsername;
                }
            }

            // Exclude AuditEntry from auditing itself to prevent recursive loops
            if (entry.Entity is AuditEntry || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
            {
                continue;
            }

            // Capture audit log
            var entityName = entry.Entity.GetType().Name;
            var primaryKey = entry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey())?.CurrentValue?.ToString() ?? Guid.NewGuid().ToString();

            var oldValues = new Dictionary<string, object?>();
            var newValues = new Dictionary<string, object?>();
            var changedColumns = new List<string>();

            foreach (var property in entry.Properties)
            {
                var propertyName = property.Metadata.Name;

                // Redact sensitive properties from audit trail
                if (SensitiveProperties.Contains(propertyName))
                {
                    continue;
                }

                if (entry.State == EntityState.Added)
                {
                    newValues[propertyName] = property.CurrentValue;
                }
                else if (entry.State == EntityState.Deleted)
                {
                    oldValues[propertyName] = property.OriginalValue;
                }
                else if (entry.State == EntityState.Modified && property.IsModified)
                {
                    changedColumns.Add(propertyName);
                    oldValues[propertyName] = property.OriginalValue;
                    newValues[propertyName] = property.CurrentValue;
                }
            }

            auditEntries.Add(new AuditEntry
            {
                Id = Guid.NewGuid(),
                UserId = currentUserId,
                Action = entry.State.ToString(),
                EntityName = entityName,
                EntityId = primaryKey,
                OldValuesJson = oldValues.Count > 0 ? JsonSerializer.Serialize(oldValues) : null,
                NewValuesJson = newValues.Count > 0 ? JsonSerializer.Serialize(newValues) : null,
                ChangedColumnsJson = changedColumns.Count > 0 ? JsonSerializer.Serialize(changedColumns) : null,
                TimestampUtc = utcNow,
                ClientIpAddress = clientIp
            });
        }

        if (auditEntries.Count > 0)
        {
            context.Set<AuditEntry>().AddRange(auditEntries);
        }
    }
}
