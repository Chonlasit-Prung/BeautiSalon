using System.Collections.Concurrent;

namespace Salon.Api.Services;

public class OwnerAuthService(IConfiguration configuration)
{
    private readonly string _pin = configuration["OwnerAuth:Pin"] ?? string.Empty;
    private readonly int _tokenTtlHours = configuration.GetValue("OwnerAuth:TokenTtlHours", 12);
    private readonly ConcurrentDictionary<string, DateTime> _tokens = new();

    public TimeSpan TokenTtl => TimeSpan.FromHours(_tokenTtlHours);

    public bool VerifyPin(string pin)
    {
        if (pin is null || pin.Length != _pin.Length)
        {
            return false;
        }

        int diff = 0;
        for (int i = 0; i < _pin.Length; i++)
        {
            diff |= pin[i] ^ _pin[i];
        }

        return diff == 0;
    }

    public string IssueToken()
    {
        var token = Guid.NewGuid().ToString("N");
        _tokens[token] = DateTime.UtcNow.AddHours(_tokenTtlHours);
        return token;
    }

    public bool IsValid(string token)
    {
        if (string.IsNullOrEmpty(token) || !_tokens.TryGetValue(token, out var expiresAt))
        {
            return false;
        }

        if (expiresAt <= DateTime.UtcNow)
        {
            _tokens.TryRemove(token, out _);
            return false;
        }

        return true;
    }
}