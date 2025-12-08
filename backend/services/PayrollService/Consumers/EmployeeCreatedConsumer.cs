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
        private readonly IConnection _connection;
        private readonly IModel _channel;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<EmployeeCreatedConsumer> _logger;

        // Keep queue name stored
        private readonly string _queueName;

        public EmployeeCreatedConsumer(IServiceScopeFactory scopeFactory, ILogger<EmployeeCreatedConsumer> logger)
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

            _channel.ExchangeDeclare("employee.events", ExchangeType.Fanout, durable: true);

            // Declare queue ONCE and bind ONCE
            _queueName = _channel.QueueDeclare().QueueName;
            _channel.QueueBind(_queueName, "employee.events", "");
        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var consumer = new EventingBasicConsumer(_channel);

            consumer.Received += (model, ea) =>
            {
                try
                {
                    var body = ea.Body.ToArray();
                    var message = Encoding.UTF8.GetString(body);

                    _logger.LogInformation($" [DEBUG] Received RAW JSON: {message}");

                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var eventData = JsonSerializer.Deserialize<EmployeeCreatedEvent>(message, options);

                    if (eventData != null)
                    {
                        _logger.LogInformation($" [DEBUG] Deserialized Name: {eventData.FirstName} {eventData.LastName}");
                        HandleEvent(eventData);
                    }
                    else
                    {
                        _logger.LogError(" [ERROR] Deserialization returned NULL.");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($" [CRITICAL ERROR] Consumer crashed: {ex.Message}");
                }
            };

           
            // _channel.BasicConsume(_channel.QueueDeclare().QueueName, true, consumer);
            _channel.BasicConsume(_queueName, true, consumer);

            return Task.CompletedTask;
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

                    _logger.LogInformation($"[SUCCESS] Saved Salary for: {salary.EmployeeName}");
                }
                else
                {
                    _logger.LogWarning($"[INFO] Salary record already exists for ID {eventData.EmployeeId}");
                }
            }
        }
    }
}
