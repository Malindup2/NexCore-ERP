using Microsoft.AspNetCore.Authentication.JwtBearer;
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

// logging
builder.Logging.ClearProviders();
builder.Logging.AddSerilogLogging();

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

//CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// add yarp reverse proxy
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

// Use CORS
app.UseCors("AllowFrontend");

// Use Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => "API Gateway is running...");

app.MapReverseProxy();

app.Run();
