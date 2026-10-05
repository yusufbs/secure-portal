using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SecurePortal.Application.Features.Documents.DTOs;
using SecurePortal.Application.Features.Documents.Services;

namespace SecurePortal.Api.Controllers;

[Authorize]
public class DocumentsController : ApiControllerBase
{
    private readonly IDocumentService _documentService;

    public DocumentsController(IDocumentService documentService)
    {
        _documentService = documentService;
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(30 * 1024 * 1024)] // 30 MB
    public async Task<ActionResult<DocumentDto>> Upload(IFormFile? file, CancellationToken ct)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { detail = "No file was uploaded." });
        }

        using var stream = file.OpenReadStream();
        var document = await _documentService.UploadDocumentAsync(file.FileName, file.ContentType, stream, ct);
        return CreatedAtAction(nameof(GetDocuments), new { id = document.Id }, document);
    }

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(Guid id, CancellationToken ct)
    {
        var (fileStream, contentType, fileName) = await _documentService.DownloadDocumentAsync(id, ct);
        return File(fileStream, contentType, fileName);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DocumentDto>>> GetDocuments(CancellationToken ct)
    {
        var documents = await _documentService.GetDocumentsAsync(ct);
        return Ok(documents);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _documentService.DeleteDocumentAsync(id, ct);
        return NoContent();
    }
}
