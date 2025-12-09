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
        private readonly IConnection _connection;
        private readonly IModel _channel;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<StockDeductedConsumer> _logger;
        private readonly string _queueName;

        public StockDeductedConsumer(IServiceScopeFactory scopeFactory, ILogger<StockDeductedConsumer> logger)
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
            _channel.ExchangeDeclare("inventory.cogs.events", ExchangeType.Fanout, durable: true);

            // Create Queue & Bind
            _queueName = "accounting.cogs.queue";
            _channel.QueueDeclare(queue: _queueName, durable: true, exclusive: false, autoDelete: false);
            _channel.QueueBind(_queueName, "inventory.cogs.events", "");
        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var consumer = new EventingBasicConsumer(_channel);

            consumer.Received += async (model, ea) =>
            {
                var body = ea.Body.ToArray();
                var message = Encoding.UTF8.GetString(body);

                try
                {
                    _logger.LogInformation($" [Accounting] Received COGS Event: {message}");

                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var eventData = JsonSerializer.Deserialize<StockDeductedEvent>(message, options);

                    if (eventData != null)
                    {
                        await RecordCOGSTransaction(eventData);
                        
                        // Acknowledge successful processing
                        _channel.BasicAck(ea.DeliveryTag, false);
                        _logger.LogInformation($"[Accounting] Successfully processed COGS for order #{eventData.OrderNumber}");
                    }
                    else
                    {
                        _logger.LogWarning("Failed to deserialize COGS event");
                        _channel.BasicNack(ea.DeliveryTag, false, false); // Don't requeue invalid messages
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($" Error processing COGS event in accounting: {ex.Message}");
                    // Reject and requeue for retry
                    _channel.BasicNack(ea.DeliveryTag, false, true);
                }
            };

            // Change autoAck to false for manual acknowledgment
            _channel.BasicConsume(_queueName, autoAck: false, consumer);
            return Task.CompletedTask;
        }

        private async Task RecordCOGSTransaction(StockDeductedEvent eventData)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<AccountingDbContext>();

                // Find required accounts
                var cogsAccount = await context.Accounts
                    .FirstOrDefaultAsync(a => a.AccountCode == "5000");
                var inventoryAsset = await context.Accounts
                    .FirstOrDefaultAsync(a => a.AccountCode == "1300");

                if (cogsAccount == null || inventoryAsset == null)
                {
                    _logger.LogError("Required accounts (COGS or Inventory) not found in Chart of Accounts!");
                    return;
                }

                // Journal Entry: Record COGS
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

                // Update Account Balances
                cogsAccount.Balance += eventData.TotalCost;
                inventoryAsset.Balance -= eventData.TotalCost;

                await context.SaveChangesAsync();

                _logger.LogInformation($"[Accounting] Recorded COGS: Order #{eventData.OrderNumber} | {eventData.ProductName} ({eventData.ProductSku}) | Qty: {eventData.QuantityDeducted} | Cost: {eventData.TotalCost:C}");
            }
        }

        public override void Dispose()
        {
            _channel?.Close();
            _connection?.Close();
            base.Dispose();
        }
    }
}
