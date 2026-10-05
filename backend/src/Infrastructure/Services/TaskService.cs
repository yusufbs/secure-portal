using System.Text;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Hybrid;
using SecurePortal.Application.Common.Exceptions;
using SecurePortal.Application.Common.Interfaces;
using SecurePortal.Application.Common.Models;
using SecurePortal.Application.Features.Tasks.DTOs;
using SecurePortal.Application.Features.Tasks.Services;
using SecurePortal.Domain.Entities;
using SecurePortal.Domain.Enums;

namespace SecurePortal.Infrastructure.Services;

public class TaskService : ITaskService
{
    private readonly IAppDbContext _context;
    private readonly HybridCache _hybridCache;
    private readonly ICurrentUserService _currentUserService;
    private readonly IValidator<CreateTaskRequest> _createValidator;
    private readonly IValidator<UpdateTaskRequest> _updateValidator;

    private const string TasksCacheTag = "tasks";

    public TaskService(
        IAppDbContext context,
        HybridCache hybridCache,
        ICurrentUserService currentUserService,
        IValidator<CreateTaskRequest> createValidator,
        IValidator<UpdateTaskRequest> updateValidator)
    {
        _context = context;
        _hybridCache = hybridCache;
        _currentUserService = currentUserService;
        _createValidator = createValidator;
        _updateValidator = updateValidator;
    }

    public async Task<PagedResult<TaskDto>> GetTasksAsync(TaskQueryParameters parameters, CancellationToken ct = default)
    {
        var pageSize = Math.Clamp(parameters.PageSize, 1, 50);
        var cacheKey = $"tasks:cursor={parameters.Cursor}:size={pageSize}:status={parameters.Status}:prio={parameters.Priority}:q={parameters.Search}";

        return await _hybridCache.GetOrCreateAsync(
            cacheKey,
            async cancelToken =>
            {
                var query = _context.Tasks
                    .AsNoTracking()
                    .Include(t => t.AssignedToUser)
                    .AsQueryable();

                // Parameterized filtering to prevent SQL injection
                if (parameters.Status.HasValue)
                {
                    query = query.Where(t => t.Status == parameters.Status.Value);
                }

                if (parameters.Priority.HasValue)
                {
                    query = query.Where(t => t.Priority == parameters.Priority.Value);
                }

                if (!string.IsNullOrWhiteSpace(parameters.Search))
                {
                    var term = parameters.Search.Trim();
                    query = query.Where(t => t.Title.Contains(term) || (t.Description != null && t.Description.Contains(term)));
                }

                var totalCount = await query.CountAsync(cancelToken);

                // Keyset (Cursor) Pagination: Decodes (CreatedAtUtc, Id)
                if (!string.IsNullOrEmpty(parameters.Cursor))
                {
                    if (TryDecodeCursor(parameters.Cursor, out var cursorDate, out var cursorId))
                    {
                        query = query.Where(t => t.CreatedAtUtc < cursorDate || (t.CreatedAtUtc == cursorDate && t.Id < cursorId));
                    }
                }

                // Stable descending keyset sort order
                query = query
                    .OrderByDescending(t => t.CreatedAtUtc)
                    .ThenByDescending(t => t.Id);

                var items = await query
                    .Take(pageSize + 1)
                    .Select(t => new TaskDto(
                        t.Id,
                        t.Title,
                        t.Description,
                        t.Priority,
                        t.Status,
                        t.DueDateUtc,
                        t.AssignedToUserId,
                        t.AssignedToUser != null ? t.AssignedToUser.Username : null,
                        t.CreatedAtUtc,
                        t.CreatedBy
                    ))
                    .ToListAsync(cancelToken);

                string? nextCursor = null;
                if (items.Count > pageSize)
                {
                    var lastItem = items[pageSize - 1];
                    nextCursor = EncodeCursor(lastItem.CreatedAtUtc, lastItem.Id);
                    items.RemoveAt(pageSize);
                }

                return PagedResult<TaskDto>.Create(items, pageSize, nextCursor, totalCount);
            },
            tags: new[] { TasksCacheTag },
            cancellationToken: ct
        );
    }

    public async Task<TaskDto> GetTaskByIdAsync(Guid id, CancellationToken ct = default)
    {
        var cacheKey = $"task:{id}";

        return await _hybridCache.GetOrCreateAsync(
            cacheKey,
            async cancelToken =>
            {
                var task = await _context.Tasks
                    .AsNoTracking()
                    .Include(t => t.AssignedToUser)
                    .FirstOrDefaultAsync(t => t.Id == id, cancelToken);

                if (task == null)
                {
                    throw new NotFoundException(nameof(TaskItem), id);
                }

                return new TaskDto(
                    task.Id,
                    task.Title,
                    task.Description,
                    task.Priority,
                    task.Status,
                    task.DueDateUtc,
                    task.AssignedToUserId,
                    task.AssignedToUser != null ? task.AssignedToUser.Username : null,
                    task.CreatedAtUtc,
                    task.CreatedBy
                );
            },
            tags: new[] { TasksCacheTag, $"task:{id}" },
            cancellationToken: ct
        );
    }

    public async Task<TaskDto> CreateTaskAsync(CreateTaskRequest request, CancellationToken ct = default)
    {
        var validation = await _createValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            throw new SecurePortal.Application.Common.Exceptions.ValidationException(validation.Errors);
        }

        var currentUserId = _currentUserService.UserId
            ?? throw new UnauthorizedException("User identity could not be verified.");

        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            Priority = request.Priority,
            Status = TaskItemStatus.Todo,
            DueDateUtc = request.DueDateUtc,
            AssignedToUserId = request.AssignedToUserId,
            CreatedByUserId = currentUserId
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync(ct);

        // Evict cached lists
        await _hybridCache.RemoveByTagAsync(TasksCacheTag, ct);

        return await GetTaskByIdAsync(task.Id, ct);
    }

    public async Task<TaskDto> UpdateTaskAsync(Guid id, UpdateTaskRequest request, CancellationToken ct = default)
    {
        var validation = await _updateValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            throw new SecurePortal.Application.Common.Exceptions.ValidationException(validation.Errors);
        }

        var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (task == null)
        {
            throw new NotFoundException(nameof(TaskItem), id);
        }

        // Validate modification permissions (Creator, Assignee, or Admin/Manager)
        var currentUserId = _currentUserService.UserId;
        var role = _currentUserService.Role;
        var isAuthorized = role == nameof(RoleType.Admin) || role == nameof(RoleType.Manager) 
            || task.CreatedByUserId == currentUserId || task.AssignedToUserId == currentUserId;

        if (!isAuthorized)
        {
            throw new ForbiddenAccessException("You do not have permission to modify this task.");
        }

        task.Title = request.Title.Trim();
        task.Description = request.Description?.Trim();
        task.Priority = request.Priority;
        task.Status = request.Status;
        task.DueDateUtc = request.DueDateUtc;
        task.AssignedToUserId = request.AssignedToUserId;

        await _context.SaveChangesAsync(ct);

        // Invalidate cache
        await _hybridCache.RemoveByTagAsync(TasksCacheTag, ct);
        await _hybridCache.RemoveAsync($"task:{id}", ct);

        return await GetTaskByIdAsync(task.Id, ct);
    }

    public async Task DeleteTaskAsync(Guid id, CancellationToken ct = default)
    {
        var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (task == null)
        {
            throw new NotFoundException(nameof(TaskItem), id);
        }

        var currentUserId = _currentUserService.UserId;
        var role = _currentUserService.Role;
        var isAuthorized = role == nameof(RoleType.Admin) || role == nameof(RoleType.Manager) || task.CreatedByUserId == currentUserId;

        if (!isAuthorized)
        {
            throw new ForbiddenAccessException("You do not have permission to delete this task.");
        }

        _context.Tasks.Remove(task); // Soft delete triggered by AuditableEntityInterceptor
        await _context.SaveChangesAsync(ct);

        // Evict cache
        await _hybridCache.RemoveByTagAsync(TasksCacheTag, ct);
        await _hybridCache.RemoveAsync($"task:{id}", ct);
    }

    private static string EncodeCursor(DateTime date, Guid id)
    {
        var str = $"{date:O}|{id}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(str));
    }

    private static bool TryDecodeCursor(string cursor, out DateTime date, out Guid id)
    {
        date = default;
        id = default;

        try
        {
            var bytes = Convert.FromBase64String(cursor);
            var str = Encoding.UTF8.GetString(bytes);
            var parts = str.Split('|');
            if (parts.Length == 2 && DateTime.TryParse(parts[0], null, System.Globalization.DateTimeStyles.RoundtripKind, out date) && Guid.TryParse(parts[1], out id))
            {
                return true;
            }
        }
        catch
        {
            // Invalid cursor fallback
        }

        return false;
    }
}
