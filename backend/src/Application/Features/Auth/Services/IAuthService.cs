using SecurePortal.Application.Features.Auth.DTOs;

namespace SecurePortal.Application.Features.Auth.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<AuthResponse> RefreshTokenAsync(string? refreshToken, CancellationToken ct = default);
    Task LogoutAsync(string? refreshToken, CancellationToken ct = default);
    Task<UserProfileResponse> GetCurrentUserProfileAsync(CancellationToken ct = default);
}
