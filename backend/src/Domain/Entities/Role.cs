using SecurePortal.Domain.Common;
using SecurePortal.Domain.Enums;

namespace SecurePortal.Domain.Entities;

public class Role : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public RoleType Type { get; set; }
    public string? Description { get; set; }

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
