namespace Salon.Api.Dtos;

public record OwnerLoginResponse(
    string Token,
    string ExpiresAt);