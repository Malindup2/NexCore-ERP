using Microsoft.EntityFrameworkCore;
using PayrollService.Data;
using Serilog;
using Shared.Logging;

var builder = WebApplication.CreateBuilder(args);

//Setup Logging
builder.Logging.ClearProviders();
builder.Logging.AddSerilogLogging();

// Setup Database
builder.Services.AddDbContext<PayrollDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Setup RabbitMQ Consumers
builder.Services.AddHostedService<PayrollService.Consumers.EmployeeCreatedConsumer>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();
app.MapControllers();

app.Run();