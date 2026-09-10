namespace Salon.Api.Dtos;

public record ServiceResponse(
    int Id,
    string NameTh,
    string NameEn,
    string? Description,
    decimal MinPrice,
    decimal MaxPrice,
    int DurationMinutes,
    string? ImageUrl);