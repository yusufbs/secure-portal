using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SecurePortal.Application.Common.Models;
using SecurePortal.Application.Features.Audit.DTOs;
using SecurePortal.Application.Features.Audit.Services;

namespace SecurePortal.Api.Controllers;

[Authorize(Roles = "Admin")]
public class AuditController : ApiControllerBase
{
    private readonly IAuditService _auditService;

    public AuditController(IAuditService auditService)
    {
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<AuditEntryDto>>> GetAuditLogs([FromQuery] AuditQueryParameters parameters, CancellationToken ct)
    {
        var result = await _auditService.GetAuditLogsAsync(parameters, ct);
        return Ok(result);
    }
}
