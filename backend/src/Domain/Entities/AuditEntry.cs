using SecurePortal.Domain.Common;

namespace SecurePortal.Domain.Entities;

public class AuditEntry : BaseEntity
{
    public string? UserId { get; set; }
    public string Action { get; set; } = string.Empty; // Create, Update, Delete
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string? OldValuesJson { get; set; }
    public string? NewValuesJson { get; set; }
    public string? ChangedColumnsJson { get; set; }
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
    public string? ClientIpAddress { get; set; }
}
