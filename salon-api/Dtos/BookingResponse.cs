using Salon.Api.Models;

namespace Salon.Api.Dtos;

public record BookingResponse(
    int Id,
    string BookingCode,
    int CustomerId,
    string CustomerName,
    string CustomerPhoneNumber,
    int ServiceId,
    string ServiceName,
    decimal ServiceMinPrice,
    decimal ServiceMaxPrice,
    DateOnly BookingDate,
    TimeOnly StartTime,
    TimeOnly EndTime,
    BookingStatus Status,
    decimal? Price);