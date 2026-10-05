namespace SecurePortal.Application.Features.Audit.DTOs;

public record AuditEntryDto(
    Guid Id,
    string? UserId,
    string Action,
    string EntityName,
    string EntityId,
    string? OldValuesJson,
    string? NewValuesJson,
    string? ChangedColumnsJson,
    DateTime TimestampUtc,
    string? ClientIpAddress
);

public record AuditQueryParameters(
    string? EntityName = null,
    string? UserId = null,
    int PageNumber = 1,
    int PageSize = 20
);
