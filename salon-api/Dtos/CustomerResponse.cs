namespace Salon.Api.Dtos;

public record CustomerResponse(
    int Id,
    string Name,
    string PhoneNumber,
    string? Email);