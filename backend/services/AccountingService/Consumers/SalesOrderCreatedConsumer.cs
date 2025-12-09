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

            // Create Queue & Bind
            _queueName = "accounting.sales.orders.queue";
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

                    _logger.LogInformation($" [Accounting] Received Sales Order: {message}");

                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var eventData = JsonSerializer.Deserialize<SalesOrderCreatedEvent>(message, options);

                    if (eventData != null)
                    {
                        await RecordSalesTransaction(eventData);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($" Error processing sales order in accounting: {ex.Message}");
                }
            };

            _channel.BasicConsume(_queueName, true, consumer);
            return Task.CompletedTask;
        }

        private async Task RecordSalesTransaction(SalesOrderCreatedEvent eventData)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<AccountingDbContext>();

                // Find required accounts for revenue recognition
                var accountsReceivable = await context.Accounts
                    .FirstOrDefaultAsync(a => a.AccountCode == "1200");
                var salesRevenue = await context.Accounts
                    .FirstOrDefaultAsync(a => a.AccountCode == "4000");

                if (accountsReceivable == null || salesRevenue == null)
                {
                    _logger.LogError("Required accounts (A/R or Revenue) not found in Chart of Accounts!");
                    return;
                }

                // Journal Entry: Record Sale (Revenue Recognition)
                // Note: COGS is now handled separately by StockDeductedConsumer with actual costs
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

                // Update Account Balances
                accountsReceivable.Balance += eventData.TotalAmount;
                salesRevenue.Balance += eventData.TotalAmount;

                await context.SaveChangesAsync();

                _logger.LogInformation($"[Accounting] Recorded Revenue: Order #{eventData.OrderNumber} | Amount: {eventData.TotalAmount:C}");
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