using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Salon.Api.Dtos;
using Salon.Api.Services;

namespace Salon.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(OwnerAuthService authService) : ControllerBase
{
    [HttpPost("owner")]
    [ProducesResponseType<OwnerLoginResponse>(200)]
    [ProducesResponseType(401)]
    public IActionResult OwnerLogin(OwnerLoginRequest request)
    {
        if (!authService.VerifyPin(request.Pin))
        {
            return Unauthorized(new { message = "PIN ผิด" });
        }

        var token = authService.IssueToken();
        var expiresAt = DateTime.UtcNow.Add(authService.TokenTtl);

        return Ok(new OwnerLoginResponse(token, expiresAt.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", CultureInfo.InvariantCulture)));
    }
}