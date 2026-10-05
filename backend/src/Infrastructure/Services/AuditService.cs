using Microsoft.EntityFrameworkCore;
using SecurePortal.Application.Common.Interfaces;
using SecurePortal.Application.Common.Models;
using SecurePortal.Application.Features.Audit.DTOs;
using SecurePortal.Application.Features.Audit.Services;

namespace SecurePortal.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly IAppDbContext _context;

    public AuditService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AuditEntryDto>> GetAuditLogsAsync(AuditQueryParameters parameters, CancellationToken ct = default)
    {
        var pageNumber = Math.Max(parameters.PageNumber, 1);
        var pageSize = Math.Clamp(parameters.PageSize, 1, 100);

        var query = _context.AuditEntries
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(parameters.EntityName))
        {
            query = query.Where(a => a.EntityName == parameters.EntityName.Trim());
        }

        if (!string.IsNullOrWhiteSpace(parameters.UserId))
        {
            query = query.Where(a => a.UserId == parameters.UserId.Trim());
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(a => a.TimestampUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditEntryDto(
                a.Id,
                a.UserId,
                a.Action,
                a.EntityName,
                a.EntityId,
                a.OldValuesJson,
                a.NewValuesJson,
                a.ChangedColumnsJson,
                a.TimestampUtc,
                a.ClientIpAddress
            ))
            .ToListAsync(ct);

        return PagedResult<AuditEntryDto>.Create(items, pageSize, null, totalCount);
    }
}
