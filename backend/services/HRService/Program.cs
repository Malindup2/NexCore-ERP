using HRService.Data;
using HRService.Consumers;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Shared.Logging;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

bool IsWeakJwtSecret(string secret)
{
    if (string.IsNullOrWhiteSpace(secret))
    {
        return true;
    }

    if (secret.Length < 32)
    {
        return true;
    }

    return secret.Contains("YOUR_JWT_SECRET", StringComparison.OrdinalIgnoreCase)
        || secret.Contains("CHANGE_ME", StringComparison.OrdinalIgnoreCase)
        || secret == "ThisIsTheSuperSecretKeyForNexCoreERP123!";
}

string RequireConfig(string key)
{
    var value = builder.Configuration[key];
    if (string.IsNullOrWhiteSpace(value))
    {
        throw new InvalidOperationException($"Missing configuration value for {key}.");
    }

    return value;
}

builder.Logging.ClearProviders();
builder.Logging.AddSerilogLogging();

builder.Services.AddDbContext<HrDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<Shared.Messaging.IRabbitMQProducer, Shared.Messaging.RabbitMQProducer>();
builder.Services.AddHostedService<UserCreatedConsumer>();

builder.Services.AddHttpClient();

// JWT Authentication configuration
var jwtSecret = RequireConfig("JwtSettings:Secret");
if (IsWeakJwtSecret(jwtSecret) && !builder.Environment.IsDevelopment())
{
    throw new InvalidOperationException("JwtSettings:Secret must be a strong value (min 32 chars) in non-development environments.");
}

var jwtIssuer = RequireConfig("JwtSettings:Issuer");
var jwtAudience = RequireConfig("JwtSettings:Audience");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret!))
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
