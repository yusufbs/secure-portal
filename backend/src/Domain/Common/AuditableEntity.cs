namespace SecurePortal.Domain.Common;

/// <summary>
/// Auditable entity tracking audit timestamps, user attributions, and soft delete state.
/// </summary>
public abstract class AuditableEntity : BaseEntity
{
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }

    public DateTime? LastModifiedAtUtc { get; set; }
    public string? LastModifiedBy { get; set; }

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public string? DeletedBy { get; set; }
}
