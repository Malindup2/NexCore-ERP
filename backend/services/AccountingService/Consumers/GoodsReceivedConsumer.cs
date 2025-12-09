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
                var body = ea.Body.ToArray();
                var message = Encoding.UTF8.GetString(body);

                try
                {
                    _logger.LogInformation($" [Accounting] Received Goods Received Event: {message}");

                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var eventData = JsonSerializer.Deserialize<GoodsReceivedEvent>(message, options);

                    if (eventData != null)
                    {
                        await RecordPurchaseTransaction(eventData);
                        
                        // Acknowledge successful processing
                        _channel.BasicAck(ea.DeliveryTag, false);
                        _logger.LogInformation($"[Accounting] Successfully processed goods received for PO #{eventData.PurchaseOrderId}");
                    }
                    else
                    {
                        _logger.LogWarning("Failed to deserialize goods received event");
                        _channel.BasicNack(ea.DeliveryTag, false, false); // Don't requeue invalid messages
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($" Error processing goods received in accounting: {ex.Message}");
                    // Reject and requeue for retry
                    _channel.BasicNack(ea.DeliveryTag, false, true);
                }
            };

            // Change autoAck to false for manual acknowledgment
            _channel.BasicConsume(_queueName, autoAck: false, consumer);
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

                // Use actual amount from purchase order
                decimal actualAmount = eventData.TotalAmount;

                // Journal Entry: Record Inventory Purchase
                var purchaseJournalEntry = new JournalEntry
                {
                    Date = eventData.ReceivedDate,
                    Description = $"Goods Received - PO #{eventData.PurchaseOrderId}",
                    ReferenceId = $"PO-{eventData.PurchaseOrderId}",
                    Lines = new List<JournalEntryLine>
                    {
                        new JournalEntryLine
                        {
                            AccountId = inventoryAsset.Id,
                            Debit = actualAmount,
                            Credit = 0
                        },
                        new JournalEntryLine
                        {
                            AccountId = accountsPayable.Id,
                            Debit = 0,
                            Credit = actualAmount
                        }
                    }
                };

                context.JournalEntries.Add(purchaseJournalEntry);

                // Update Account Balances
                inventoryAsset.Balance += actualAmount;
                accountsPayable.Balance += actualAmount;

                await context.SaveChangesAsync();

                _logger.LogInformation($"[Accounting] Recorded Purchase: PO #{eventData.PurchaseOrderId} | SKU: {eventData.ProductSku} | Qty: {eventData.QuantityReceived} | Amount: {actualAmount:C}");
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
