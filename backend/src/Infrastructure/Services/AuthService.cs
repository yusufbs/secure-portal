using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SecurePortal.Application.Common.Exceptions;
using SecurePortal.Application.Common.Interfaces;
using SecurePortal.Application.Features.Auth.DTOs;
using SecurePortal.Application.Features.Auth.Services;
using SecurePortal.Domain.Entities;
using SecurePortal.Domain.Enums;

namespace SecurePortal.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IAppDbContext _context;
    private readonly IPasswordHashService _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IValidator<RegisterRequest> _registerValidator;
    private readonly IValidator<LoginRequest> _loginValidator;
    private readonly int _refreshTokenExpirationDays;

    public AuthService(
        IAppDbContext context,
        IPasswordHashService passwordHasher,
        ITokenService tokenService,
        ICurrentUserService currentUserService,
        IValidator<RegisterRequest> registerValidator,
        IValidator<LoginRequest> loginValidator,
        IConfiguration configuration)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _currentUserService = currentUserService;
        _registerValidator = registerValidator;
        _loginValidator = loginValidator;
        _refreshTokenExpirationDays = int.TryParse(configuration["JwtSettings:RefreshTokenExpirationDays"], out var days) ? days : 7;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var validationResult = await _registerValidator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            throw new SecurePortal.Application.Common.Exceptions.ValidationException(validationResult.Errors);
        }

        var normalizedUsername = request.Username.Trim();
        var normalizedEmail = request.Email.Trim();

        if (await _context.Users.AnyAsync(u => u.Username == normalizedUsername, ct))
        {
            throw new SecurePortal.Application.Common.Exceptions.ValidationException(new[]
            {
                new FluentValidation.Results.ValidationFailure(nameof(request.Username), "Username is already registered.")
            });
        }

        if (await _context.Users.AnyAsync(u => u.Email == normalizedEmail, ct))
        {
            throw new SecurePortal.Application.Common.Exceptions.ValidationException(new[]
            {
                new FluentValidation.Results.ValidationFailure(nameof(request.Email), "Email address is already in use.")
            });
        }

        var defaultRole = await _context.Roles.FirstOrDefaultAsync(r => r.Type == RoleType.Member, ct)
            ?? throw new InvalidOperationException("Default member role has not been seeded.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = request.Username.Trim(),
            Email = request.Email.Trim(),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            IsActive = true,
            SecurityStamp = Guid.NewGuid().ToString("N")
        };

        user.UserRoles.Add(new UserRole
        {
            UserId = user.Id,
            RoleId = defaultRole.Id
        });

        var refreshToken = _tokenService.GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTimeUtc = DateTime.UtcNow.AddDays(_refreshTokenExpirationDays);

        _context.Users.Add(user);
        await _context.SaveChangesAsync(ct);

        var roles = new[] { defaultRole.Name };
        var (accessToken, expiresIn) = _tokenService.GenerateAccessToken(user, roles);

        return new AuthResponse(
            accessToken,
            refreshToken,
            expiresIn,
            new UserProfileResponse(user.Id, user.Username, user.Email, user.FirstName, user.LastName, roles)
        );
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var validationResult = await _loginValidator.ValidateAsync(request, ct);
        if (!validationResult.IsValid)
        {
            throw new SecurePortal.Application.Common.Exceptions.ValidationException(validationResult.Errors);
        }

        var input = request.UsernameOrEmail.Trim();

        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Username == input || u.Email == input, ct);

        // Constant-time check to prevent timing attacks
        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedException("Invalid username, email, or password.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedException("Your account is disabled. Please contact an administrator.");
        }

        // Rotate refresh token on each successful login
        var newRefreshToken = _tokenService.GenerateRefreshToken();
        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTimeUtc = DateTime.UtcNow.AddDays(_refreshTokenExpirationDays);

        await _context.SaveChangesAsync(ct);

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var (accessToken, expiresIn) = _tokenService.GenerateAccessToken(user, roles);

        return new AuthResponse(
            accessToken,
            newRefreshToken,
            expiresIn,
            new UserProfileResponse(user.Id, user.Username, user.Email, user.FirstName, user.LastName, roles)
        );
    }

    public async Task<AuthResponse> RefreshTokenAsync(string? refreshToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            throw new UnauthorizedException("Refresh token is required.");
        }

        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken, ct);

        if (user == null || user.RefreshTokenExpiryTimeUtc <= DateTime.UtcNow || !user.IsActive)
        {
            throw new UnauthorizedException("Invalid or expired refresh token.");
        }

        // Refresh Token Rotation (RTR): invalidate used token and issue a fresh one
        var newRefreshToken = _tokenService.GenerateRefreshToken();
        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTimeUtc = DateTime.UtcNow.AddDays(_refreshTokenExpirationDays);

        await _context.SaveChangesAsync(ct);

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var (accessToken, expiresIn) = _tokenService.GenerateAccessToken(user, roles);

        return new AuthResponse(
            accessToken,
            newRefreshToken,
            expiresIn,
            new UserProfileResponse(user.Id, user.Username, user.Email, user.FirstName, user.LastName, roles)
        );
    }

    public async Task LogoutAsync(string? refreshToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            var userId = _currentUserService.UserId;
            if (userId.HasValue)
            {
                var user = await _context.Users.FindAsync(new object[] { userId.Value }, ct);
                if (user != null)
                {
                    user.RefreshToken = null;
                    user.RefreshTokenExpiryTimeUtc = null;
                    await _context.SaveChangesAsync(ct);
                }
            }
            return;
        }

        var userWithToken = await _context.Users.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken, ct);
        if (userWithToken != null)
        {
            userWithToken.RefreshToken = null;
            userWithToken.RefreshTokenExpiryTimeUtc = null;
            await _context.SaveChangesAsync(ct);
        }
    }

    public async Task<UserProfileResponse> GetCurrentUserProfileAsync(CancellationToken ct = default)
    {
        var userId = _currentUserService.UserId 
            ?? throw new UnauthorizedException("User is not authenticated.");

        var user = await _context.Users
            .AsNoTracking()
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null)
        {
            throw new NotFoundException(nameof(User), userId);
        }

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();

        return new UserProfileResponse(
            user.Id,
            user.Username,
            user.Email,
            user.FirstName,
            user.LastName,
            roles
        );
    }
}
