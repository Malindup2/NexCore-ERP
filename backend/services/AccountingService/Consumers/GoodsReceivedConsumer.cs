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

            // Create Queue & Bind
            _queueName = "accounting.procurement.goods.queue";
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

                    _logger.LogInformation($" [Accounting] Received Goods Received Event: {message}");

                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var eventData = JsonSerializer.Deserialize<GoodsReceivedEvent>(message, options);

                    if (eventData != null)
                    {
                        await RecordPurchaseTransaction(eventData);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($" Error processing goods received in accounting: {ex.Message}");
                }
            };

            _channel.BasicConsume(_queueName, true, consumer);
            return Task.CompletedTask;
        }

        private async Task RecordPurchaseTransaction(GoodsReceivedEvent eventData)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<AccountingDbContext>();

                // Find required accounts
                var inventoryAsset = await context.Accounts
                    .FirstOrDefaultAsync(a => a.AccountCode == "1300");
                var accountsPayable = await context.Accounts
                    .FirstOrDefaultAsync(a => a.AccountCode == "2000");

                if (inventoryAsset == null || accountsPayable == null)
                {
                    _logger.LogError("Required accounts not found in Chart of Accounts!");
                    return;
                }

                
                // For now, using a placeholder calculation
                decimal estimatedCost = eventData.QuantityReceived * 50m; 

                
                var purchaseJournalEntry = new JournalEntry
                {
                    Date = DateTime.UtcNow,
                    Description = $"Goods Received - PO #{eventData.PurchaseOrderId}",
                    ReferenceId = $"PO-{eventData.PurchaseOrderId}",
                    Lines = new List<JournalEntryLine>
                    {
                        new JournalEntryLine
                        {
                            AccountId = inventoryAsset.Id,
                            Debit = estimatedCost,
                            Credit = 0
                        },
                        new JournalEntryLine
                        {
                            AccountId = accountsPayable.Id,
                            Debit = 0,
                            Credit = estimatedCost
                        }
                    }
                };

                context.JournalEntries.Add(purchaseJournalEntry);

                // Update Account Balances
                inventoryAsset.Balance += estimatedCost;
                accountsPayable.Balance += estimatedCost;

                await context.SaveChangesAsync();

                _logger.LogInformation($"[Accounting] Recorded Purchase: PO #{eventData.PurchaseOrderId} | SKU: {eventData.ProductSku} | Qty: {eventData.QuantityReceived} | Amount: {estimatedCost:C}");
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
