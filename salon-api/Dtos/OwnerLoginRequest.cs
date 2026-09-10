using System.ComponentModel.DataAnnotations;

namespace Salon.Api.Dtos;

public record OwnerLoginRequest(
    [Required] string Pin);