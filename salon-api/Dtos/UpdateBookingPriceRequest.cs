using System.ComponentModel.DataAnnotations;

namespace Salon.Api.Dtos;

public record UpdateBookingPriceRequest(
    [Required] decimal Price);