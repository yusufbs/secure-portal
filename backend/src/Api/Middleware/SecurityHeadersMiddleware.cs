namespace SecurePortal.Api.Middleware;

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // 1. Content Security Policy (CSP)
        context.Response.Headers.Append("Content-Security-Policy", 
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://localhost:7123 https://localhost:4200; frame-ancestors 'none'; object-src 'none'; base-uri 'self';");

        // 2. Prevent MIME-sniffing
        context.Response.Headers.Append("X-Content-Type-Options", "nosniff");

        // 3. Prevent Clickjacking
        context.Response.Headers.Append("X-Frame-Options", "DENY");

        // 4. Strict Referrer Policy
        context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");

        // 5. Restrict Unused Browser Features & Sensors
        context.Response.Headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");

        // 6. Cross-Origin Opener & Resource Policies
        context.Response.Headers.Append("Cross-Origin-Opener-Policy", "same-origin");
        context.Response.Headers.Append("Cross-Origin-Resource-Policy", "same-origin");

        // 7. Strip fingerprinting Server banners
        context.Response.Headers.Remove("Server");
        context.Response.Headers.Remove("X-Powered-By");

        await _next(context);
    }
}
