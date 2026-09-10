namespace Salon.Api.Models;

public class Service
{
    public int Id { get; set; }
    public required string NameTh { get; set; }
    public required string NameEn { get; set; }
    public string? Description { get; set; }
    public decimal MinPrice { get; set; }
    public decimal MaxPrice { get; set; }
    public int DurationMinutes { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}