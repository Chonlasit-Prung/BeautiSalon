using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Salon.Api.Data;
using Salon.Api.Dtos;
using Salon.Api.Models;

namespace Salon.Api.Controllers;

[ApiController]
[Route("api/v1/customers")]
public class CustomersController(SalonDbContext db) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IEnumerable<CustomerResponse>>(200)]
    public async Task<IActionResult> GetCustomers(CancellationToken ct)
    {
        var customers = await db.Customers
            .OrderBy(c => c.Id)
            .Select(c => new CustomerResponse(
                c.Id,
                c.Name,
                c.PhoneNumber,
                c.Email))
            .ToListAsync(ct);

        return Ok(customers);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType<CustomerResponse>(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetCustomerById(int id, CancellationToken ct)
    {
        var customer = await db.Customers
            .Where(c => c.Id == id)
            .Select(c => new CustomerResponse(
                c.Id,
                c.Name,
                c.PhoneNumber,
                c.Email))
            .FirstOrDefaultAsync(ct);

        if (customer is null)
        {
            return NotFound();
        }

        return Ok(customer);
    }

    [HttpPost]
    [ProducesResponseType<CustomerResponse>(201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> CreateCustomer(CreateCustomerRequest request, CancellationToken ct)
    {
        if (await db.Customers.AnyAsync(c => c.PhoneNumber == request.PhoneNumber, ct))
        {
            return BadRequest(new { message = "Phone number already exists." });
        }

        var customer = new Customer
        {
            Name = request.Name,
            PhoneNumber = request.PhoneNumber,
            Email = request.Email
        };

        db.Customers.Add(customer);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetCustomerById), new { id = customer.Id }, new CustomerResponse(
            customer.Id,
            customer.Name,
            customer.PhoneNumber,
            customer.Email));
    }
}