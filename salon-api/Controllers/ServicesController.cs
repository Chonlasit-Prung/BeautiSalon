using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Salon.Api.Data;
using Salon.Api.Dtos;
using Salon.Api.Models;

namespace Salon.Api.Controllers;

[ApiController]
[Route("api/v1/services")]
public class ServicesController(SalonDbContext db) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IEnumerable<ServiceResponse>>(200)]
    public async Task<IActionResult> GetServices(CancellationToken ct)
    {
        var services = await db.Services
            .Where(s => s.IsActive)
            .OrderBy(s => s.Id)
            .Select(s => new ServiceResponse(
                s.Id,
                s.NameTh,
                s.NameEn,
                s.Description,
                s.MinPrice,
                s.MaxPrice,
                s.DurationMinutes,
                s.ImageUrl))
            .ToListAsync(ct);

        return Ok(services);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType<ServiceResponse>(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetServiceById(int id, CancellationToken ct)
    {
        var service = await db.Services
            .Where(s => s.Id == id && s.IsActive)
            .Select(s => new ServiceResponse(
                s.Id,
                s.NameTh,
                s.NameEn,
                s.Description,
                s.MinPrice,
                s.MaxPrice,
                s.DurationMinutes,
                s.ImageUrl))
            .FirstOrDefaultAsync(ct);

        if (service is null)
        {
            return NotFound();
        }

        return Ok(service);
    }
}