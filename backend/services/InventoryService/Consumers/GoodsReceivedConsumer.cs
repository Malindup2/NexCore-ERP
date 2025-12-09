using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using Shared.Events;
using InventoryService.Data;
using InventoryService.Models;

namespace InventoryService.Consumers
{
    public class GoodsReceivedConsumer : BackgroundService
    {
        private readonly IConnection _connection;
        private readonly IModel _channel;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<GoodsReceivedConsumer> _logger;
        private readonly string _queueName;

        public GoodsReceivedConsumer(IServiceScopeFactory scopeFactory, ILogger<GoodsReceivedConsumer> logger)
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
            _channel.ExchangeDeclare("procurement.events", ExchangeType.Fanout, durable: true);

            //Create Queue & Bind
            _queueName = "inventory.goods.received.queue";
            _channel.QueueDeclare(queue: _queueName, durable: true, exclusive: false, autoDelete: false);
            _channel.QueueBind(_queueName, "procurement.events", "");
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

                    _logger.LogInformation($" [Inventory] Received Goods: {message}");

                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var eventData = JsonSerializer.Deserialize<GoodsReceivedEvent>(message, options);

                    if (eventData != null)
                    {
                        await UpdateStock(eventData);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($" Error processing goods received: {ex.Message}");
                }
            };

            _channel.BasicConsume(_queueName, true, consumer);
            return Task.CompletedTask;
        }

        private async Task UpdateStock(GoodsReceivedEvent eventData)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<InventoryDbContext>();


                var product = await context.Products.FirstOrDefaultAsync(p => p.SKU == eventData.ProductSku);

                if (product != null)
                {
                    int oldQty = product.Quantity;
                    product.Quantity += eventData.QuantityReceived;
                    product.UpdatedAt = DateTime.UtcNow;

                    await context.SaveChangesAsync();

                    _logger.LogInformation($" [Stock Updated] {product.Name} (SKU: {product.SKU}) | {oldQty} -> {product.Quantity}");
                }
                else
                {
                    _logger.LogWarning($" Product with SKU '{eventData.ProductSku}' not found. Stock update skipped.");
                }
            }
        }
    }
}