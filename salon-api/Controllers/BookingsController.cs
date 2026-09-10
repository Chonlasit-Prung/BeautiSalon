using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Salon.Api.Data;
using Salon.Api.Dtos;
using Salon.Api.Models;
using Salon.Api.Services;

namespace Salon.Api.Controllers;

[ApiController]
[Route("api/v1/bookings")]
public class BookingsController(SalonDbContext db) : ControllerBase
{
    [HttpGet("availability")]
    [ProducesResponseType<BookingAvailabilityResponse>(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> GetAvailability([FromQuery] DateOnly? date, CancellationToken ct)
    {
        if (!date.HasValue)
        {
            return BadRequest(new { message = "date is required (YYYY-MM-DD)." });
        }

        var taken = await db.Bookings
            .Where(b => b.BookingDate == date.Value && b.Status != BookingStatus.Cancelled)
            .OrderBy(b => b.StartTime)
            .Select(b => new TakenSlot(b.StartTime, b.EndTime))
            .ToListAsync(ct);

        return Ok(new BookingAvailabilityResponse(date.Value, taken));
    }

    [HttpGet]
    [ServiceFilter(typeof(OwnerAuthorizeFilter))]
    [ProducesResponseType<IEnumerable<BookingResponse>>(200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> GetBookings([FromQuery] DateOnly? date, [FromQuery] BookingStatus? status, [FromQuery] string? search, CancellationToken ct)
    {
        var query = db.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Service)
            .AsQueryable();

        if (date.HasValue)
        {
            query = query.Where(b => b.BookingDate == date.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(b => b.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();
            query = query.Where(b =>
                b.Customer.Name.Contains(keyword) ||
                b.Customer.PhoneNumber.Contains(keyword) ||
                b.Service.NameTh.Contains(keyword) ||
                b.Service.NameEn.Contains(keyword));
        }

        var bookings = await query
            .OrderByDescending(b => b.Id)
            .Select(b => new BookingResponse(
                b.Id,
                b.BookingCode,
                b.CustomerId,
                b.Customer.Name,
                b.Customer.PhoneNumber,
                b.ServiceId,
                b.Service.NameTh,
                b.Service.MinPrice,
                b.Service.MaxPrice,
                b.BookingDate,
                b.StartTime,
                b.EndTime,
                b.Status,
                b.Price))
            .ToListAsync(ct);

        return Ok(bookings);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType<BookingResponse>(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetBookingById(int id, CancellationToken ct)
    {
        var booking = await db.Bookings
            .Where(b => b.Id == id)
            .Select(b => new BookingResponse(
                b.Id,
                b.BookingCode,
                b.CustomerId,
                b.Customer.Name,
                b.Customer.PhoneNumber,
                b.ServiceId,
                b.Service.NameTh,
                b.Service.MinPrice,
                b.Service.MaxPrice,
                b.BookingDate,
                b.StartTime,
                b.EndTime,
                b.Status,
                b.Price))
            .FirstOrDefaultAsync(ct);

        if (booking is null)
        {
            return NotFound();
        }

        return Ok(booking);
    }

    [HttpPatch("{id:int}/status")]
    [ServiceFilter(typeof(OwnerAuthorizeFilter))]
    [ProducesResponseType<BookingResponse>(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateBookingStatus(int id, UpdateBookingStatusRequest request, CancellationToken ct)
    {
        if (request.Status is not (BookingStatus.Confirmed or BookingStatus.Completed or BookingStatus.Cancelled))
        {
            return BadRequest(new { message = "Valid statuses are: Confirmed, Completed, Cancelled." });
        }

        var booking = await db.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Service)
            .FirstOrDefaultAsync(b => b.Id == id, ct);

        if (booking is null)
        {
            return NotFound();
        }

        booking.Status = request.Status;
        booking.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        return Ok(new BookingResponse(
            booking.Id,
            booking.BookingCode,
            booking.CustomerId,
            booking.Customer.Name,
            booking.Customer.PhoneNumber,
            booking.ServiceId,
            booking.Service.NameTh,
            booking.Service.MinPrice,
            booking.Service.MaxPrice,
            booking.BookingDate,
            booking.StartTime,
            booking.EndTime,
            booking.Status,
            booking.Price));
    }

    [HttpPatch("{id:int}/price")]
    [ServiceFilter(typeof(OwnerAuthorizeFilter))]
    [ProducesResponseType<BookingResponse>(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateBookingPrice(int id, UpdateBookingPriceRequest request, CancellationToken ct)
    {
        if (request.Price < 0)
        {
            return BadRequest(new { message = "Price must be zero or positive." });
        }

        var booking = await db.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Service)
            .FirstOrDefaultAsync(b => b.Id == id, ct);

        if (booking is null)
        {
            return NotFound();
        }

        booking.Price = request.Price;
        booking.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        return Ok(new BookingResponse(
            booking.Id,
            booking.BookingCode,
            booking.CustomerId,
            booking.Customer.Name,
            booking.Customer.PhoneNumber,
            booking.ServiceId,
            booking.Service.NameTh,
            booking.Service.MinPrice,
            booking.Service.MaxPrice,
            booking.BookingDate,
            booking.StartTime,
            booking.EndTime,
            booking.Status,
            booking.Price));
    }

    [HttpPost]
    [ProducesResponseType<BookingResponse>(201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> CreateBooking(CreateBookingRequest request, CancellationToken ct)
    {
        var customer = await db.Customers
            .FirstOrDefaultAsync(c => c.Id == request.CustomerId, ct);

        if (customer is null)
        {
            return NotFound("Customer not found.");
        }

        var service = await db.Services
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId && s.IsActive);

        if (service is null)
        {
            return NotFound("Service not found.");
        }

        var startTime = request.StartTime;
        var endTime = startTime.AddMinutes(service.DurationMinutes);

        if (await db.Bookings.AnyAsync(b =>
                b.BookingDate == request.BookingDate &&
                b.Status != BookingStatus.Cancelled &&
                startTime < b.EndTime &&
                endTime > b.StartTime, ct))
        {
            return BadRequest(new { message = "The selected time slot is already booked." });
        }

        var booking = new Booking
        {
            BookingCode = await GenerateBookingCodeAsync(ct),
            CustomerId = customer.Id,
            ServiceId = service.Id,
            BookingDate = request.BookingDate,
            StartTime = startTime,
            EndTime = endTime
        };

        db.Bookings.Add(booking);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetBookingById), new { id = booking.Id }, new BookingResponse(
            booking.Id,
            booking.BookingCode,
            booking.CustomerId,
            customer.Name,
            customer.PhoneNumber,
            booking.ServiceId,
            service.NameTh,
            service.MinPrice,
            service.MaxPrice,
            booking.BookingDate,
            booking.StartTime,
            booking.EndTime,
            booking.Status,
            booking.Price));
    }

    private async Task<string> GenerateBookingCodeAsync(CancellationToken ct)
    {
        using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();

        while (true)
        {
            var bytes = new byte[4];
            rng.GetBytes(bytes);
            var code = $"BK-{BitConverter.ToUInt32(bytes, 0):X8}";

            if (!await db.Bookings.AnyAsync(b => b.BookingCode == code, ct))
            {
                return code;
            }
        }
    }
}