using System.ComponentModel.DataAnnotations;

namespace Salon.Api.Dtos;

public record CreateBookingRequest(
    [Required] int? CustomerId,
    [Required] int? ServiceId,
    [Required] DateOnly BookingDate,
    [Required] TimeOnly StartTime);