using System.Text;
using System.Text.Json;
using InventoryService.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using Shared.Events;

namespace InventoryService.Consumers
{
    public class SalesOrderCreatedConsumer : BackgroundService
    {
        private readonly IConnection _connection;
        private readonly IModel _channel;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<SalesOrderCreatedConsumer> _logger;
        private readonly string _queueName;

        public SalesOrderCreatedConsumer(IServiceScopeFactory scopeFactory, ILogger<SalesOrderCreatedConsumer> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;

            var factory = new ConnectionFactory
            {
                HostName = "localhost",
                Port = 5672,
                UserName = "guest",
                Password = "guest"
            };

            _connection = factory.CreateConnection();
            _channel = _connection.CreateModel();

            // Declare Exchange 
            _channel.ExchangeDeclare("sales.events", ExchangeType.Fanout, durable: true);

            //Create Queue & Bind
            _queueName = "inventory.sales.orders.queue";
            _channel.QueueDeclare(queue: _queueName, durable: true, exclusive: false, autoDelete: false);
            _channel.QueueBind(_queueName, "sales.events", "");
        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var consumer = new EventingBasicConsumer(_channel);

            consumer.Received += async (model, ea) =>
            {
                try
                {
                    var body = ea.Body.ToArray();
                    var message = Encoding.UTF8.GetString(body);

                    _logger.LogInformation($" [Inventory] Received Sales Order: {message}");

                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var eventData = JsonSerializer.Deserialize<SalesOrderCreatedEvent>(message, options);

                    if (eventData != null)
                    {
                        await DeductStock(eventData);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($" Error processing sales order: {ex.Message}");
                }
            };

            _channel.BasicConsume(_queueName, true, consumer);
            return Task.CompletedTask;
        }

        private async Task DeductStock(SalesOrderCreatedEvent eventData)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<InventoryDbContext>();
                var producer = scope.ServiceProvider.GetRequiredService<Shared.Messaging.IRabbitMQProducer>();

                foreach (var item in eventData.Items)
                {
                    // Find Product
                    var product = await context.Products.FirstOrDefaultAsync(p => p.SKU == item.ProductSku);

                    if (product != null)
                    {
                        int oldQty = product.Quantity;

                        product.Quantity -= item.Quantity;
                        product.UpdatedAt = DateTime.UtcNow;

                        // Publish COGS Event for Accounting with actual cost
                        var cogsEvent = new StockDeductedEvent
                        {
                            OrderId = eventData.OrderId,
                            OrderNumber = eventData.OrderNumber,
                            ProductSku = product.SKU,
                            ProductName = product.Name,
                            QuantityDeducted = item.Quantity,
                            UnitCost = product.CostPrice > 0 ? product.CostPrice : product.Price * 0.60m, // Use actual cost or estimate
                            TotalCost = (product.CostPrice > 0 ? product.CostPrice : product.Price * 0.60m) * item.Quantity
                        };

                        producer.PublishEvent(cogsEvent, "inventory.cogs.events");

                        _logger.LogInformation($"[Stock Deducted] Order #{eventData.OrderNumber} | {product.Name} ({product.SKU}) | {oldQty} -> {product.Quantity} | COGS: {cogsEvent.TotalCost:C}");
                    }
                    else
                    {
                        _logger.LogWarning($" Sold product SKU '{item.ProductSku}' not found in Inventory!");
                    }
                }

                await context.SaveChangesAsync();
            }
        }
    }
}