namespace SecurePortal.Application.Features.Documents.DTOs;

public record DocumentDto(
    Guid Id,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    string HashSha256,
    DateTime CreatedAtUtc,
    string? CreatedBy
);
