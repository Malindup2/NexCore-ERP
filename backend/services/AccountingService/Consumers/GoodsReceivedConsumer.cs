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
        private IConnection? _connection;
        private IModel? _channel;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<GoodsReceivedConsumer> _logger;
        private readonly string _queueName = "accounting.procurement.goods.queue";

        public GoodsReceivedConsumer(IServiceScopeFactory scopeFactory, ILogger<GoodsReceivedConsumer> logger)
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

                    _channel.ExchangeDeclare("procurement.events", ExchangeType.Fanout, durable: true);
                    _channel.QueueDeclare(queue: _queueName, durable: true, exclusive: false, autoDelete: false);
                    _channel.QueueBind(_queueName, "procurement.events", "");

                    _logger.LogInformation("[AccountingService] Connected to RabbitMQ. Listening for goods received events...");

                    var consumer = new EventingBasicConsumer(_channel);

                    consumer.Received += async (model, ea) =>
                    {
                        var body = ea.Body.ToArray();
                        var message = Encoding.UTF8.GetString(body);

                        try
                        {
                            _logger.LogInformation($"[AccountingService] Received Goods Received Event: {message}");

                            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                            var eventData = JsonSerializer.Deserialize<GoodsReceivedEvent>(message, options);

                            if (eventData != null)
                            {
                                await RecordPurchaseTransaction(eventData);
                                _channel.BasicAck(ea.DeliveryTag, false);
                                _logger.LogInformation($"[AccountingService] Successfully processed goods received for PO #{eventData.PurchaseOrderId}");
                            }
                            else
                            {
                                _logger.LogWarning("Failed to deserialize goods received event");
                                _channel.BasicNack(ea.DeliveryTag, false, false);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError($"[AccountingService] Error processing goods received: {ex.Message}");
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

        private async Task RecordPurchaseTransaction(GoodsReceivedEvent eventData)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<AccountingDbContext>();

                var inventoryAsset = await context.Accounts
                    .FirstOrDefaultAsync(a => a.AccountCode == "1300");
                var accountsPayable = await context.Accounts
                    .FirstOrDefaultAsync(a => a.AccountCode == "2000");

                if (inventoryAsset == null || accountsPayable == null)
                {
                    _logger.LogError("Required accounts not found in Chart of Accounts!");
                    return;
                }

                decimal actualAmount = eventData.TotalAmount;

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

                inventoryAsset.Balance += actualAmount;
                accountsPayable.Balance += actualAmount;

                await context.SaveChangesAsync();

                _logger.LogInformation($"[AccountingService] Recorded Purchase: PO #{eventData.PurchaseOrderId} | SKU: {eventData.ProductSku} | Qty: {eventData.QuantityReceived} | Amount: {actualAmount:C}");
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
