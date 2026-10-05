using Microsoft.AspNetCore.Identity;
using SecurePortal.Application.Common.Interfaces;

namespace SecurePortal.Infrastructure.Identity;

public class PasswordHashService : IPasswordHashService
{
    private readonly PasswordHasher<object> _hasher = new();
    private static readonly object DummyUser = new();

    public string HashPassword(string password)
    {
        return _hasher.HashPassword(DummyUser, password);
    }

    public bool VerifyPassword(string password, string passwordHash)
    {
        var result = _hasher.VerifyHashedPassword(DummyUser, passwordHash, password);
        return result == PasswordVerificationResult.Success || result == PasswordVerificationResult.SuccessRehashNeeded;
    }
}
