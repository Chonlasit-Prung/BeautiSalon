namespace Salon.Api.Dtos;

public record TakenSlot(TimeOnly StartTime, TimeOnly EndTime);

public record BookingAvailabilityResponse(DateOnly Date, List<TakenSlot> Taken);