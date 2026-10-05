namespace SecurePortal.Application.Features.Auth.DTOs;

public record RegisterRequest(
    string Username,
    string Email,
    string Password,
    string FirstName,
    string LastName
);

public record LoginRequest(
    string UsernameOrEmail,
    string Password
);

public record RefreshTokenRequest(
    string? RefreshToken
);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    UserProfileResponse User
);

public record UserProfileResponse(
    Guid Id,
    string Username,
    string Email,
    string FirstName,
    string LastName,
    IReadOnlyList<string> Roles
);
