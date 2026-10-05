using SecurePortal.Application.Common.Models;
using SecurePortal.Application.Features.Audit.DTOs;

namespace SecurePortal.Application.Features.Audit.Services;

public interface IAuditService
{
    Task<PagedResult<AuditEntryDto>> GetAuditLogsAsync(AuditQueryParameters parameters, CancellationToken ct = default);
}
