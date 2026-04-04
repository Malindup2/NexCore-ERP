using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using Shared.Events;
using AccountingService.Data;
using AccountingService.Models;

namespace AccountingService.Consumers
{
    public class StockDeductedConsumer : BackgroundService
    {
        private IConnection? _connection;
        private IModel? _channel;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<StockDeductedConsumer> _logger;
        private readonly string _queueName = "accounting.cogs.queue";

        public StockDeductedConsumer(IServiceScopeFactory scopeFactory, ILogger<StockDeductedConsumer> logger)
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

                    _channel.ExchangeDeclare("inventory.cogs.events", ExchangeType.Fanout, durable: true);
                    _channel.QueueDeclare(queue: _queueName, durable: true, exclusive: false, autoDelete: false);
                    _channel.QueueBind(_queueName, "inventory.cogs.events", "");

                    _logger.LogInformation("[AccountingService] Connected to RabbitMQ. Listening for COGS events...");

                    var consumer = new EventingBasicConsumer(_channel);

                    consumer.Received += async (model, ea) =>
                    {
                        var body = ea.Body.ToArray();
                        var message = Encoding.UTF8.GetString(body);

                        try
                        {
                            _logger.LogInformation($"[AccountingService] Received COGS Event: {message}");

                            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                            var eventData = JsonSerializer.Deserialize<StockDeductedEvent>(message, options);

                            if (eventData != null)
                            {
                                await RecordCOGSTransaction(eventData);
                                _channel.BasicAck(ea.DeliveryTag, false);
                                _logger.LogInformation($"[AccountingService] Successfully processed COGS for order #{eventData.OrderNumber}");
                            }
                            else
                            {
                                _logger.LogWarning("Failed to deserialize COGS event");
                                _channel.BasicNack(ea.DeliveryTag, false, false);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError($"[AccountingService] Error processing COGS event: {ex.Message}");
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
                    _logger.LogWarning($"[AccountingService] RabbitMQ connection failed: {ex.Message}. Retrying in 10 seconds...");
                    CleanupConnection();
                    try { await Task.Delay(10000, stoppingToken); } catch (OperationCanceledException) { break; }
                }
            }
        }

        private async Task RecordCOGSTransaction(StockDeductedEvent eventData)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<AccountingDbContext>();

                var cogsAccount = await context.Accounts
                    .FirstOrDefaultAsync(a => a.AccountCode == "5000");
                var inventoryAsset = await context.Accounts
                    .FirstOrDefaultAsync(a => a.AccountCode == "1300");

                if (cogsAccount == null || inventoryAsset == null)
                {
                    _logger.LogError("Required accounts (COGS or Inventory) not found in Chart of Accounts!");
                    return;
                }

                var cogsJournalEntry = new JournalEntry
                {
                    Date = DateTime.UtcNow,
                    Description = $"COGS - Order #{eventData.OrderNumber} - {eventData.ProductName}",
                    ReferenceId = $"COGS-{eventData.OrderId}",
                    Lines = new List<JournalEntryLine>
                    {
                        new JournalEntryLine
                        {
                            AccountId = cogsAccount.Id,
                            Debit = eventData.TotalCost,
                            Credit = 0
                        },
                        new JournalEntryLine
                        {
                            AccountId = inventoryAsset.Id,
                            Debit = 0,
                            Credit = eventData.TotalCost
                        }
                    }
                };

                context.JournalEntries.Add(cogsJournalEntry);

                cogsAccount.Balance += eventData.TotalCost;
                inventoryAsset.Balance -= eventData.TotalCost;

                await context.SaveChangesAsync();

                _logger.LogInformation($"[AccountingService] Recorded COGS: Order #{eventData.OrderNumber} | {eventData.ProductName} ({eventData.ProductSku}) | Qty: {eventData.QuantityDeducted} | Cost: {eventData.TotalCost:C}");
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
