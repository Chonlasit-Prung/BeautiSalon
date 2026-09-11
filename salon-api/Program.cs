using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL;
using Salon.Api.Data;
using Salon.Api.Models;
using Salon.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddSingleton<OwnerAuthService>();
builder.Services.AddScoped<OwnerAuthorizeFilter>();
builder.Services.AddDbContext<SalonDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"),
        o => o.MapEnum<BookingStatus>("booking_status")));
var allowedCorsOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(allowedCorsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod());
});
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnet/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SalonDbContext>();
    db.Database.Migrate();
}

app.Run();