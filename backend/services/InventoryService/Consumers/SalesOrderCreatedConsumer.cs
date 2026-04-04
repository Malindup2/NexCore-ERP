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
        private IConnection? _connection;
        private IModel? _channel;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<SalesOrderCreatedConsumer> _logger;
        private readonly string _queueName = "inventory.sales.orders.queue";

        public SalesOrderCreatedConsumer(IServiceScopeFactory scopeFactory, ILogger<SalesOrderCreatedConsumer> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await Task.Delay(5000, stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var factory = new ConnectionFactory
                    {
                        HostName = "localhost",
                        Port = 5672,
                        UserName = "guest",
                        Password = "guest"
                    };

                    _connection = factory.CreateConnection();
                    _channel = _connection.CreateModel();

                    _channel.ExchangeDeclare("sales.events", ExchangeType.Fanout, durable: true);
                    _channel.QueueDeclare(queue: _queueName, durable: true, exclusive: false, autoDelete: false);
                    _channel.QueueBind(_queueName, "sales.events", "");

                    _logger.LogInformation("[InventoryService] Connected to RabbitMQ. Listening for sales order events...");

                    var consumer = new EventingBasicConsumer(_channel);

                    consumer.Received += async (model, ea) =>
                    {
                        var body = ea.Body.ToArray();
                        var message = Encoding.UTF8.GetString(body);

                        try
                        {
                            _logger.LogInformation($"[InventoryService] Received Sales Order: {message}");

                            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                            var eventData = JsonSerializer.Deserialize<SalesOrderCreatedEvent>(message, options);

                            if (eventData != null)
                            {
                                await DeductStock(eventData);
                                _channel.BasicAck(ea.DeliveryTag, false);
                                _logger.LogInformation($"[InventoryService] Successfully processed stock deduction for order #{eventData.OrderNumber}");
                            }
                            else
                            {
                                _logger.LogWarning("Failed to deserialize sales order event");
                                _channel.BasicNack(ea.DeliveryTag, false, false);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError($"[InventoryService] Error processing sales order: {ex.Message}");
                            _channel.BasicNack(ea.DeliveryTag, false, true);
                        }
                    };

                    _channel.BasicConsume(_queueName, autoAck: false, consumer);

                    while (!stoppingToken.IsCancellationRequested && _connection.IsOpen)
                    {
                        await Task.Delay(5000, stoppingToken);
                    }
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning($"[InventoryService] RabbitMQ connection failed: {ex.Message}. Retrying in 10 seconds...");
                    CleanupConnection();
                    try { await Task.Delay(10000, stoppingToken); } catch (OperationCanceledException) { break; }
                }
            }
        }

        private async Task DeductStock(SalesOrderCreatedEvent eventData)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<InventoryDbContext>();
                var producer = scope.ServiceProvider.GetRequiredService<Shared.Messaging.IRabbitMQProducer>();

                foreach (var item in eventData.Items)
                {
                    var product = await context.Products.FirstOrDefaultAsync(p => p.SKU == item.ProductSku);

                    if (product == null)
                    {
                        _logger.LogWarning($"Product SKU '{item.ProductSku}' not found in Inventory!");
                        continue;
                    }

                    if (product.Quantity < item.Quantity)
                    {
                        _logger.LogError($"Insufficient stock for {item.ProductSku}. Available: {product.Quantity}, Requested: {item.Quantity}");
                        continue;
                    }

                    int oldQty = product.Quantity;
                    product.Quantity -= item.Quantity;
                    product.UpdatedAt = DateTime.UtcNow;

                    decimal unitCost = product.CostPrice > 0 ? product.CostPrice : product.Price * 0.60m;

                    var cogsEvent = new StockDeductedEvent
                    {
                        OrderId = eventData.OrderId,
                        OrderNumber = eventData.OrderNumber,
                        ProductSku = product.SKU,
                        ProductName = product.Name,
                        QuantityDeducted = item.Quantity,
                        UnitCost = unitCost,
                        TotalCost = unitCost * item.Quantity
                    };

                    producer.PublishEvent(cogsEvent, "inventory.cogs.events");

                    _logger.LogInformation($"[Stock Deducted] Order #{eventData.OrderNumber} | {product.Name} ({product.SKU}) | {oldQty} -> {product.Quantity} | COGS: {cogsEvent.TotalCost:C}");
                }

                await context.SaveChangesAsync();
            }
        }

        private void CleanupConnection()
        {
            try { _channel?.Close(); } catch { }
            try { _connection?.Close(); } catch { }
            _channel = null;
            _connection = null;
        }

        public override void Dispose()
        {
            CleanupConnection();
            base.Dispose();
        }
    }
}