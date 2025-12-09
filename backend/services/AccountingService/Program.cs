using AccountingService.Data;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Shared.Logging;

var builder = WebApplication.CreateBuilder(args);

//  Setup Logging
builder.Logging.ClearProviders();
builder.Logging.AddSerilogLogging();

//  Setup Database
builder.Services.AddDbContext<AccountingDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

//  Setup RabbitMQ
builder.Services.AddScoped<Shared.Messaging.IRabbitMQProducer, Shared.Messaging.RabbitMQProducer>();

// Add Consumers for Accounting Automation
builder.Services.AddHostedService<AccountingService.Consumers.SalesOrderCreatedConsumer>();
builder.Services.AddHostedService<AccountingService.Consumers.GoodsReceivedConsumer>();
builder.Services.AddHostedService<AccountingService.Consumers.StockDeductedConsumer>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AccountingDbContext>();
        DbInitializer.Initialize(context);
        Log.Information("Chart of Accounts Seeded Successfully");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "An error occurred while seeding the database.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();
app.MapControllers();

app.Run();