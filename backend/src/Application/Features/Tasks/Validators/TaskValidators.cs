using FluentValidation;
using SecurePortal.Application.Features.Tasks.DTOs;

namespace SecurePortal.Application.Features.Tasks.Validators;

public class CreateTaskRequestValidator : AbstractValidator<CreateTaskRequest>
{
    public CreateTaskRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Task title is required.")
            .MaximumLength(200).WithMessage("Task title cannot exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Task description cannot exceed 2000 characters.");

        RuleFor(x => x.DueDateUtc)
            .Must(date => !date.HasValue || date.Value > DateTime.UtcNow)
            .WithMessage("Due date must be in the future.");
    }
}

public class UpdateTaskRequestValidator : AbstractValidator<UpdateTaskRequest>
{
    public UpdateTaskRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Task title is required.")
            .MaximumLength(200).WithMessage("Task title cannot exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Task description cannot exceed 2000 characters.");
    }
}
