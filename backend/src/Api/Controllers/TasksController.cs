using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SecurePortal.Application.Common.Models;
using SecurePortal.Application.Features.Tasks.DTOs;
using SecurePortal.Application.Features.Tasks.Services;

namespace SecurePortal.Api.Controllers;

[Authorize]
public class TasksController : ApiControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<TaskDto>>> GetTasks([FromQuery] TaskQueryParameters parameters, CancellationToken ct)
    {
        var result = await _taskService.GetTasksAsync(parameters, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TaskDto>> GetTaskById(Guid id, CancellationToken ct)
    {
        var task = await _taskService.GetTaskByIdAsync(id, ct);
        return Ok(task);
    }

    [HttpPost]
    public async Task<ActionResult<TaskDto>> CreateTask([FromBody] CreateTaskRequest request, CancellationToken ct)
    {
        var task = await _taskService.CreateTaskAsync(request, ct);
        return CreatedAtAction(nameof(GetTaskById), new { id = task.Id }, task);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TaskDto>> UpdateTask(Guid id, [FromBody] UpdateTaskRequest request, CancellationToken ct)
    {
        var task = await _taskService.UpdateTaskAsync(id, request, ct);
        return Ok(task);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTask(Guid id, CancellationToken ct)
    {
        await _taskService.DeleteTaskAsync(id, ct);
        return NoContent();
    }
}
