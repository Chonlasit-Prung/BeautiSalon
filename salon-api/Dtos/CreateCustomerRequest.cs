using System.ComponentModel.DataAnnotations;

namespace Salon.Api.Dtos;

public record CreateCustomerRequest(
    [Required, MaxLength(150)] string Name,
    [Required, MaxLength(20)] string PhoneNumber,
    [MaxLength(100)] string? Email);