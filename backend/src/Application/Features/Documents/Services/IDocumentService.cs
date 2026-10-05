using SecurePortal.Application.Features.Documents.DTOs;

namespace SecurePortal.Application.Features.Documents.Services;

public interface IDocumentService
{
    Task<DocumentDto> UploadDocumentAsync(string fileName, string contentType, Stream contentStream, CancellationToken ct = default);
    Task<(Stream FileStream, string ContentType, string FileName)> DownloadDocumentAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<DocumentDto>> GetDocumentsAsync(CancellationToken ct = default);
    Task DeleteDocumentAsync(Guid id, CancellationToken ct = default);
}
