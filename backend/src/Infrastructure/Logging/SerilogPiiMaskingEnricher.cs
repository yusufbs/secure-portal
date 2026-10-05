using Serilog.Core;
using Serilog.Events;

namespace SecurePortal.Infrastructure.Logging;

public class SerilogPiiMaskingEnricher : ILogEventEnricher
{
    private static readonly HashSet<string> SensitiveKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "Password", "PasswordHash", "Secret", "Token", "RefreshToken", "AccessToken",
        "Authorization", "CreditCard", "Cvv", "SecurityStamp"
    };

    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        foreach (var property in logEvent.Properties.ToList())
        {
            if (SensitiveKeys.Contains(property.Key))
            {
                logEvent.AddOrUpdateProperty(propertyFactory.CreateProperty(property.Key, "***REDACTED***"));
            }
        }
    }
}
