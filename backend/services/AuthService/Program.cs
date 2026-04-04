using AuthService.Data;
using AuthService.Services;
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

// Setup Logging
builder.Logging.ClearProviders();
builder.Logging.AddSerilogLogging();

// DB context
builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<JwtTokenGenerator>();
builder.Services.AddScoped<Shared.Messaging.IRabbitMQProducer, Shared.Messaging.RabbitMQProducer>();
builder.Services.AddScoped<IEmailService, EmailService>();

// JWT Authentication 
var jwtSecret = RequireConfig("JwtSettings:Secret");
if (IsWeakJwtSecret(jwtSecret) && !builder.Environment.IsDevelopment())
{
    throw new InvalidOperationException("JwtSettings:Secret must be a strong value (min 32 chars) in non-development environments.");
}

var jwtIssuer = RequireConfig("JwtSettings:Issuer");
var jwtAudience = RequireConfig("JwtSettings:Audience");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
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

// CORS configuration 
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy
            .WithOrigins(
                "http://localhost:3000",
                "http://localhost:3001"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

// controllers
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Use CORS
app.UseCors("AllowFrontend");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Add Authentication & Authorization middleware
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
