using System.ComponentModel.DataAnnotations;
using Salon.Api.Models;

namespace Salon.Api.Dtos;

public record UpdateBookingStatusRequest(
    [Required] BookingStatus Status);