namespace SecurePortal.Domain.Common;

/// <summary>
/// Base entity containing the primary key identifier.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
}
