namespace SecurePortal.Application.Common.Exceptions;

public class UnauthorizedException : Exception
{
    public UnauthorizedException(string message = "Unauthorized access attempt.") : base(message)
    {
    }
}
