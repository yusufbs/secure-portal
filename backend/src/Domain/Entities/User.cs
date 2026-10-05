using SecurePortal.Domain.Common;

namespace SecurePortal.Domain.Entities;

public class User : AuditableEntity
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string SecurityStamp { get; set; } = Guid.NewGuid().ToString("N");

    // Secure Refresh Token handling
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTimeUtc { get; set; }

    // Navigation properties
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<TaskItem> AssignedTasks { get; set; } = new List<TaskItem>();
    public ICollection<Document> UploadedDocuments { get; set; } = new List<Document>();
}
