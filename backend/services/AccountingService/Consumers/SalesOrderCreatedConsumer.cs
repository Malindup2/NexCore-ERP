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
    public class SalesOrderCreatedConsumer : BackgroundService
    {
        private IConnection? _connection;
        private IModel? _channel;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<SalesOrderCreatedConsumer> _logger;
        private readonly string _queueName = "accounting.sales.orders.queue";

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

                    _logger.LogInformation("[AccountingService] Connected to RabbitMQ. Listening for sales order events...");

                    var consumer = new EventingBasicConsumer(_channel);

                    consumer.Received += async (model, ea) =>
                    {
                        var body = ea.Body.ToArray();
                        var message = Encoding.UTF8.GetString(body);

                        try
                        {
                            _logger.LogInformation($"[AccountingService] Received Sales Order: {message}");

                            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                            var eventData = JsonSerializer.Deserialize<SalesOrderCreatedEvent>(message, options);

                            if (eventData != null)
                            {
                                await RecordSalesTransaction(eventData);
                                _channel.BasicAck(ea.DeliveryTag, false);
                                _logger.LogInformation($"[AccountingService] Successfully processed sales order #{eventData.OrderNumber}");
                            }
                            else
                            {
                                _logger.LogWarning("Failed to deserialize sales order event");
                                _channel.BasicNack(ea.DeliveryTag, false, false);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError($"[AccountingService] Error processing sales order: {ex.Message}");
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

        private async Task RecordSalesTransaction(SalesOrderCreatedEvent eventData)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<AccountingDbContext>();

                var accountsReceivable = await context.Accounts
                    .FirstOrDefaultAsync(a => a.AccountCode == "1200");
                var salesRevenue = await context.Accounts
                    .FirstOrDefaultAsync(a => a.AccountCode == "4000");

                if (accountsReceivable == null || salesRevenue == null)
                {
                    _logger.LogError("Required accounts (A/R or Revenue) not found in Chart of Accounts!");
                    return;
                }

                var saleJournalEntry = new JournalEntry
                {
                    Date = DateTime.UtcNow,
                    Description = $"Sales Order #{eventData.OrderNumber}",
                    ReferenceId = $"SO-{eventData.OrderId}",
                    Lines = new List<JournalEntryLine>
                    {
                        new JournalEntryLine
                        {
                            AccountId = accountsReceivable.Id,
                            Debit = eventData.TotalAmount,
                            Credit = 0
                        },
                        new JournalEntryLine
                        {
                            AccountId = salesRevenue.Id,
                            Debit = 0,
                            Credit = eventData.TotalAmount
                        }
                    }
                };

                context.JournalEntries.Add(saleJournalEntry);

                accountsReceivable.Balance += eventData.TotalAmount;
                salesRevenue.Balance += eventData.TotalAmount;

                await context.SaveChangesAsync();

                _logger.LogInformation($"[AccountingService] Recorded Revenue: Order #{eventData.OrderNumber} | Amount: {eventData.TotalAmount:C}");
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