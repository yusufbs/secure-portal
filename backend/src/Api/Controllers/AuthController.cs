using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SecurePortal.Application.Features.Auth.DTOs;
using SecurePortal.Application.Features.Auth.Services;

namespace SecurePortal.Api.Controllers;

public class AuthController : ApiControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    [EnableRateLimiting("AuthRateLimit")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        var response = await _authService.RegisterAsync(request, ct);
        SetAuthCookies(response.AccessToken, response.RefreshToken, response.ExpiresIn);
        return Ok(response);
    }

    [HttpPost("login")]
    [EnableRateLimiting("AuthRateLimit")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var response = await _authService.LoginAsync(request, ct);
        SetAuthCookies(response.AccessToken, response.RefreshToken, response.ExpiresIn);
        return Ok(response);
    }

    [HttpPost("refresh")]
    [EnableRateLimiting("AuthRateLimit")]
    public async Task<ActionResult<AuthResponse>> RefreshToken([FromBody] RefreshTokenRequest? request, CancellationToken ct)
    {
        var token = request?.RefreshToken ?? Request.Cookies["__Host-refresh-token"];
        var response = await _authService.RefreshTokenAsync(token, ct);
        SetAuthCookies(response.AccessToken, response.RefreshToken, response.ExpiresIn);
        return Ok(response);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest? request, CancellationToken ct)
    {
        var token = request?.RefreshToken ?? Request.Cookies["__Host-refresh-token"];
        await _authService.LogoutAsync(token, ct);
        ClearAuthCookies();
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserProfileResponse>> GetCurrentUser(CancellationToken ct)
    {
        var profile = await _authService.GetCurrentUserProfileAsync(ct);
        return Ok(profile);
    }

    private void SetAuthCookies(string accessToken, string refreshToken, int expiresInSeconds)
    {
        var cookieName = Request.IsHttps ? "__Host-access-token" : "access-token";
        var refreshCookieName = Request.IsHttps ? "__Host-refresh-token" : "refresh-token";
        var isSecure = Request.IsHttps;

        // Access token cookie
        var accessCookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = isSecure,
            SameSite = SameSiteMode.Strict,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddSeconds(expiresInSeconds)
        };
        Response.Cookies.Append(cookieName, accessToken, accessCookieOptions);

        // Refresh token cookie (7 days)
        var refreshCookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = isSecure,
            SameSite = SameSiteMode.Strict,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        };
        Response.Cookies.Append(refreshCookieName, refreshToken, refreshCookieOptions);
    }

    private void ClearAuthCookies()
    {
        var cookieName = Request.IsHttps ? "__Host-access-token" : "access-token";
        var refreshCookieName = Request.IsHttps ? "__Host-refresh-token" : "refresh-token";
        var isSecure = Request.IsHttps;

        Response.Cookies.Delete(cookieName, new CookieOptions { Path = "/", Secure = isSecure });
        Response.Cookies.Delete(refreshCookieName, new CookieOptions { Path = "/", Secure = isSecure });
    }
}
