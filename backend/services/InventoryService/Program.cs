using InventoryService.Data;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared.Logging;

var builder = WebApplication.CreateBuilder(args);

// Setup Logging
builder.Logging.ClearProviders();
builder.Logging.AddSerilogLogging();

// Setup Database
builder.Services.AddDbContext<InventoryDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<Shared.Messaging.IRabbitMQProducer, Shared.Messaging.RabbitMQProducer>();
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