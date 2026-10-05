using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using SecurePortal.Application.Common.Exceptions;
using SecurePortal.Application.Common.Interfaces;
using SecurePortal.Application.Features.Documents.DTOs;
using SecurePortal.Application.Features.Documents.Services;
using SecurePortal.Domain.Entities;
using SecurePortal.Domain.Enums;

namespace SecurePortal.Infrastructure.Services;

public class DocumentService : IDocumentService
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly string _storageDirectory;

    private static readonly HashSet<string> BlockedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".exe", ".dll", ".bat", ".cmd", ".vbs", ".ps1", ".msi", ".sh", ".com", ".scr"
    };

    private const long MaxFileSizeBytes = 25 * 1024 * 1024; // 25 MB

    public DocumentService(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _storageDirectory = Path.Combine(AppContext.BaseDirectory, "App_Data", "Documents");
        if (!Directory.Exists(_storageDirectory))
        {
            Directory.CreateDirectory(_storageDirectory);
        }
    }

    public async Task<DocumentDto> UploadDocumentAsync(string fileName, string contentType, Stream contentStream, CancellationToken ct = default)
    {
        var currentUserId = _currentUserService.UserId
            ?? throw new UnauthorizedException("User identity could not be verified.");

        var safeFileName = Path.GetFileName(fileName);
        var extension = Path.GetExtension(safeFileName);

        if (BlockedExtensions.Contains(extension))
        {
            throw new ValidationException(new[]
            {
                new FluentValidation.Results.ValidationFailure("File", $"Executable and script files ({extension}) are prohibited.")
            });
        }

        var documentId = Guid.NewGuid();
        var storageFileName = $"{documentId:N}{extension}";
        var destinationPath = Path.Combine(_storageDirectory, storageFileName);

        string hashSha256;
        long totalBytes;

        using (var sha256 = SHA256.Create())
        using (var fileStream = new FileStream(destinationPath, FileMode.Create, FileAccess.Write, FileShare.None, 81920, useAsync: true))
        {
            var buffer = new byte[81920];
            int bytesRead;
            totalBytes = 0;

            while ((bytesRead = await contentStream.ReadAsync(buffer.AsMemory(0, buffer.Length), ct)) > 0)
            {
                totalBytes += bytesRead;
                if (totalBytes > MaxFileSizeBytes)
                {
                    fileStream.Close();
                    File.Delete(destinationPath);
                    throw new ValidationException(new[]
                    {
                        new FluentValidation.Results.ValidationFailure("File", "File size exceeds the 25 MB limit.")
                    });
                }

                sha256.TransformBlock(buffer, 0, bytesRead, null, 0);
                await fileStream.WriteAsync(buffer.AsMemory(0, bytesRead), ct);
            }

            sha256.TransformFinalBlock(Array.Empty<byte>(), 0, 0);
            hashSha256 = Convert.ToHexString(sha256.Hash ?? Array.Empty<byte>());
        }

        var document = new Document
        {
            Id = documentId,
            FileName = safeFileName,
            ContentType = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType,
            FileSizeBytes = totalBytes,
            StoragePath = destinationPath,
            HashSha256 = hashSha256,
            UploadedByUserId = currentUserId
        };

        _context.Documents.Add(document);
        await _context.SaveChangesAsync(ct);

        return new DocumentDto(
            document.Id,
            document.FileName,
            document.ContentType,
            document.FileSizeBytes,
            document.HashSha256,
            document.CreatedAtUtc,
            document.CreatedBy
        );
    }

    public async Task<(Stream FileStream, string ContentType, string FileName)> DownloadDocumentAsync(Guid id, CancellationToken ct = default)
    {
        var document = await _context.Documents.AsNoTracking().FirstOrDefaultAsync(d => d.Id == id, ct);
        if (document == null)
        {
            throw new NotFoundException(nameof(Document), id);
        }

        if (!File.Exists(document.StoragePath))
        {
            throw new NotFoundException("Document storage file could not be found.");
        }

        var fileStream = new FileStream(document.StoragePath, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, useAsync: true);
        return (fileStream, document.ContentType, document.FileName);
    }

    public async Task<IReadOnlyList<DocumentDto>> GetDocumentsAsync(CancellationToken ct = default)
    {
        return await _context.Documents
            .AsNoTracking()
            .OrderByDescending(d => d.CreatedAtUtc)
            .Select(d => new DocumentDto(
                d.Id,
                d.FileName,
                d.ContentType,
                d.FileSizeBytes,
                d.HashSha256,
                d.CreatedAtUtc,
                d.CreatedBy
            ))
            .ToListAsync(ct);
    }

    public async Task DeleteDocumentAsync(Guid id, CancellationToken ct = default)
    {
        var document = await _context.Documents.FirstOrDefaultAsync(d => d.Id == id, ct);
        if (document == null)
        {
            throw new NotFoundException(nameof(Document), id);
        }

        var currentUserId = _currentUserService.UserId;
        var role = _currentUserService.Role;
        var isAuthorized = role == nameof(RoleType.Admin) || document.UploadedByUserId == currentUserId;

        if (!isAuthorized)
        {
            throw new ForbiddenAccessException("You do not have permission to delete this document.");
        }

        _context.Documents.Remove(document); // Soft delete triggered by AuditableEntityInterceptor
        await _context.SaveChangesAsync(ct);
    }
}
