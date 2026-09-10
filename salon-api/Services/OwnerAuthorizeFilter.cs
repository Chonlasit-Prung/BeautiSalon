using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Salon.Api.Services;

namespace Salon.Api.Services;

public class OwnerAuthorizeFilter(OwnerAuthService authService) : IActionFilter
{
    public const string Scheme = "Bearer";

    public void OnActionExecuting(ActionExecutingContext context)
    {
        var authorization = context.HttpContext.Request.Headers.Authorization.ToString();

        if (!authorization.StartsWith($"{Scheme} ", StringComparison.OrdinalIgnoreCase))
        {
            context.Result = new UnauthorizedObjectResult(new { message = "ไม่ได้รับอนุญาต" });
            return;
        }

        var token = authorization[Scheme.Length..].Trim();

        if (!authService.IsValid(token))
        {
            context.Result = new UnauthorizedObjectResult(new { message = "ไม่ได้รับอนุญาต" });
        }
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
    }
}