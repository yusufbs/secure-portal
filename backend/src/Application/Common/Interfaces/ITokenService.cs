using SecurePortal.Domain.Entities;

namespace SecurePortal.Application.Common.Interfaces;

public interface ITokenService
{
    (string AccessToken, int ExpiresIn) GenerateAccessToken(User user, IEnumerable<string> roles);
    string GenerateRefreshToken();
}
