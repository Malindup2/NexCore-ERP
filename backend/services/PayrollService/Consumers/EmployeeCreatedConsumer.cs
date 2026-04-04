using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using Shared.Events;
using PayrollService.Data;
using PayrollService.Models;

namespace PayrollService.Consumers
{
    public class EmployeeCreatedConsumer : BackgroundService
    {
        private IConnection? _connection;
        private IModel? _channel;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<EmployeeCreatedConsumer> _logger;
        private readonly string _queueName = "payroll.employee.created.queue";

        public EmployeeCreatedConsumer(IServiceScopeFactory scopeFactory, ILogger<EmployeeCreatedConsumer> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Wait for infrastructure to be ready
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

                    _channel.ExchangeDeclare("employee.events", ExchangeType.Fanout, durable: true);
                    _channel.QueueDeclare(queue: _queueName, durable: true, exclusive: false, autoDelete: false);
                    _channel.QueueBind(_queueName, "employee.events", "");

                    _logger.LogInformation("[PayrollService] Connected to RabbitMQ. Listening for employee events...");

                    var consumer = new EventingBasicConsumer(_channel);

                    consumer.Received += (model, ea) =>
                    {
                        try
                        {
                            var body = ea.Body.ToArray();
                            var message = Encoding.UTF8.GetString(body);

                            _logger.LogInformation($"[PayrollService] Received employee event: {message}");

                            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                            var eventData = JsonSerializer.Deserialize<EmployeeCreatedEvent>(message, options);

                            if (eventData != null)
                            {
                                HandleEvent(eventData);
                            }
                            else
                            {
                                _logger.LogError("[PayrollService] Deserialization returned NULL.");
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError($"[PayrollService] Error processing event: {ex.Message}");
                        }
                    };

                    _channel.BasicConsume(_queueName, true, consumer);

                    // Keep alive until cancelled or connection drops
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
                    _logger.LogWarning($"[PayrollService] RabbitMQ connection failed: {ex.Message}. Retrying in 10 seconds...");
                    CleanupConnection();
                    try { await Task.Delay(10000, stoppingToken); } catch (OperationCanceledException) { break; }
                }
            }
        }

        private void HandleEvent(EmployeeCreatedEvent eventData)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<PayrollDbContext>();

                var existingRecord = dbContext.SalaryRecords
                    .FirstOrDefault(s => s.EmployeeId == eventData.EmployeeId);

                if (existingRecord == null)
                {
                    var salary = new SalaryRecord
                    {
                        EmployeeId = eventData.EmployeeId,
                        EmployeeName = $"{eventData.FirstName} {eventData.LastName}",
                        Department = eventData.Department,
                        BasicSalary = 50000,
                        Allowances = 5000,
                        NetSalary = 55000,
                        CreatedAt = DateTime.UtcNow
                    };

                    dbContext.SalaryRecords.Add(salary);
                    dbContext.SaveChanges();

                    _logger.LogInformation($"[PayrollService] Saved Salary for: {salary.EmployeeName}");
                }
                else
                {
                    _logger.LogWarning($"[PayrollService] Salary record already exists for Employee ID {eventData.EmployeeId}");
                }
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
