using System.Diagnostics;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using SecurePortal.Application.Common.Exceptions;

namespace SecurePortal.Api.Middleware;

public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var traceId = Activity.Current?.Id ?? httpContext.TraceIdentifier;

        var (statusCode, title, detail, errors) = exception switch
        {
            ValidationException valEx => (
                StatusCodes.Status400BadRequest,
                "Validation Error",
                "One or more validation errors occurred.",
                valEx.Errors
            ),
            NotFoundException notFoundEx => (
                StatusCodes.Status404NotFound,
                "Resource Not Found",
                notFoundEx.Message,
                null
            ),
            UnauthorizedException unauthEx => (
                StatusCodes.Status401Unauthorized,
                "Unauthorized",
                unauthEx.Message,
                null
            ),
            ForbiddenAccessException forbiddenEx => (
                StatusCodes.Status403Forbidden,
                "Forbidden",
                forbiddenEx.Message,
                null
            ),
            _ => (
                StatusCodes.Status500InternalServerError,
                "Internal Server Error",
                "An unexpected error occurred. Please contact support with the trace identifier.",
                null
            )
        };

        if (statusCode >= 500)
        {
            _logger.LogError(exception, "Unhandled exception occurred. TraceId: {TraceId}", traceId);
        }
        else
        {
            _logger.LogWarning("Handled domain exception: {Title}. Detail: {Detail}. TraceId: {TraceId}", title, detail, traceId);
        }

        httpContext.Response.StatusCode = statusCode;
        httpContext.Response.ContentType = "application/problem+json";

        if (errors != null)
        {
            var validationProblem = new ValidationProblemDetails(errors)
            {
                Status = statusCode,
                Title = title,
                Detail = detail,
                Instance = httpContext.Request.Path
            };
            validationProblem.Extensions["traceId"] = traceId;
            validationProblem.Extensions["timestamp"] = DateTime.UtcNow;

            await httpContext.Response.WriteAsJsonAsync(validationProblem, cancellationToken);
        }
        else
        {
            var problem = new ProblemDetails
            {
                Status = statusCode,
                Title = title,
                Detail = detail,
                Instance = httpContext.Request.Path
            };
            problem.Extensions["traceId"] = traceId;
            problem.Extensions["timestamp"] = DateTime.UtcNow;

            await httpContext.Response.WriteAsJsonAsync(problem, cancellationToken);
        }

        return true;
    }
}
