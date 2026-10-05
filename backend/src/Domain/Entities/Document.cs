using SecurePortal.Domain.Common;

namespace SecurePortal.Domain.Entities;

public class Document : AuditableEntity
{
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public string HashSha256 { get; set; } = string.Empty;

    // Foreign Key
    public Guid UploadedByUserId { get; set; }
    public User UploadedByUser { get; set; } = null!;
}
