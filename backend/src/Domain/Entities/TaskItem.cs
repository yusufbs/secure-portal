using SecurePortal.Domain.Common;
using SecurePortal.Domain.Enums;

namespace SecurePortal.Domain.Entities;

public class TaskItem : AuditableEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public TaskItemStatus Status { get; set; } = TaskItemStatus.Todo;
    public DateTime? DueDateUtc { get; set; }

    // Foreign Keys
    public Guid? AssignedToUserId { get; set; }
    public User? AssignedToUser { get; set; }

    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;
}
