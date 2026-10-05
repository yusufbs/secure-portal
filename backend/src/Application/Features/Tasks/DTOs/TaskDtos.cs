using SecurePortal.Domain.Enums;

namespace SecurePortal.Application.Features.Tasks.DTOs;

public record TaskDto(
    Guid Id,
    string Title,
    string? Description,
    TaskPriority Priority,
    TaskItemStatus Status,
    DateTime? DueDateUtc,
    Guid? AssignedToUserId,
    string? AssignedToUsername,
    DateTime CreatedAtUtc,
    string? CreatedBy
);

public record CreateTaskRequest(
    string Title,
    string? Description,
    TaskPriority Priority,
    DateTime? DueDateUtc,
    Guid? AssignedToUserId
);

public record UpdateTaskRequest(
    string Title,
    string? Description,
    TaskPriority Priority,
    TaskItemStatus Status,
    DateTime? DueDateUtc,
    Guid? AssignedToUserId
);

public record TaskQueryParameters(
    string? Cursor = null,
    int PageSize = 10,
    TaskItemStatus? Status = null,
    TaskPriority? Priority = null,
    string? Search = null
);
