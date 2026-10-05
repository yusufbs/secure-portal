using SecurePortal.Application.Common.Models;
using SecurePortal.Application.Features.Tasks.DTOs;

namespace SecurePortal.Application.Features.Tasks.Services;

public interface ITaskService
{
    Task<PagedResult<TaskDto>> GetTasksAsync(TaskQueryParameters parameters, CancellationToken ct = default);
    Task<TaskDto> GetTaskByIdAsync(Guid id, CancellationToken ct = default);
    Task<TaskDto> CreateTaskAsync(CreateTaskRequest request, CancellationToken ct = default);
    Task<TaskDto> UpdateTaskAsync(Guid id, UpdateTaskRequest request, CancellationToken ct = default);
    Task DeleteTaskAsync(Guid id, CancellationToken ct = default);
}
