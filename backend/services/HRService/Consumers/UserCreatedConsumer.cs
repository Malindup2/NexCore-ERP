using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;
using HRService.Data;
using HRService.Models;
using Microsoft.EntityFrameworkCore;

namespace HRService.Consumers
{
    public class UserCreatedConsumer : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<UserCreatedConsumer> _logger;
        private readonly IConfiguration _configuration;
        private IConnection? _connection;
        private IModel? _channel;

        public UserCreatedConsumer(
            IServiceProvider serviceProvider,
            ILogger<UserCreatedConsumer> logger,
            IConfiguration configuration)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await Task.Delay(5000, stoppingToken); 

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

                // Declare exchange
                _channel.ExchangeDeclare(
                    exchange: "user_events",
                    type: ExchangeType.Fanout,
                    durable: true
                );

                // Declare queue
                var queueName = _channel.QueueDeclare(
                    queue: "hr_user_created_queue",
                    durable: true,
                    exclusive: false,
                    autoDelete: false
                ).QueueName;

                _channel.QueueBind(queueName, "user_events", "");

                var consumer = new EventingBasicConsumer(_channel);
                consumer.Received += async (model, ea) =>
                {
                    var body = ea.Body.ToArray();
                    var message = Encoding.UTF8.GetString(body);
                    
                    try
                    {
                        var userCreated = JsonSerializer.Deserialize<UserCreatedEventDto>(message);
                        if (userCreated != null)
                        {
                            await CreateEmployeeFromUser(userCreated);
                        }
                        
                        _channel.BasicAck(ea.DeliveryTag, false);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError($"Error processing UserCreated event: {ex.Message}");
                        _channel.BasicNack(ea.DeliveryTag, false, true);
                    }
                };

                _channel.BasicConsume(queue: queueName, autoAck: false, consumer: consumer);
                _logger.LogInformation("UserCreatedConsumer started listening for events");

                await Task.Delay(Timeout.Infinite, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to start UserCreatedConsumer: {ex.Message}");
            }
        }

        private async Task CreateEmployeeFromUser(UserCreatedEventDto userCreated)
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<HrDbContext>();

            try
            {
                // Check if employee already exists
                var existingEmployee = await dbContext.Employees
                    .FirstOrDefaultAsync(e => e.UserId == userCreated.UserId || e.Email == userCreated.Email);

                if (existingEmployee != null)
                {
                    _logger.LogInformation($"Employee already exists for user {userCreated.UserId}");
                    return;
                }

                // Create new employee
                var employee = new Employee
                {
                    UserId = userCreated.UserId,
                    FirstName = userCreated.Username,
                    LastName = "",
                    Email = userCreated.Email,
                    Phone = "",
                    Department = "Unassigned",
                    Designation = "Employee",
                    JoiningDate = DateTime.UtcNow,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                dbContext.Employees.Add(employee);
                await dbContext.SaveChangesAsync();

                _logger.LogInformation($"Created employee record for user {userCreated.UserId}");

                // Publish EmployeeCreated event for other services 
                PublishEmployeeCreatedEvent(employee);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to create employee from user {userCreated.UserId}: {ex.Message}");
            }
        }

        private void PublishEmployeeCreatedEvent(Employee employee)
        {
            try
            {
                var message = new
                {
                    employee.Id,
                    employee.FirstName,
                    employee.LastName,
                    employee.Email,
                    employee.Department,
                    employee.Designation
                };

                var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(message));

                _channel?.ExchangeDeclare("employee_events", ExchangeType.Fanout, durable: true);
                _channel?.BasicPublish(
                    exchange: "employee_events",
                    routingKey: "",
                    basicProperties: null,
                    body: body
                );

                _logger.LogInformation($"Published EmployeeCreated event for employee {employee.Id}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to publish EmployeeCreated event: {ex.Message}");
            }
        }

        public override void Dispose()
        {
            _channel?.Close();
            _connection?.Close();
            base.Dispose();
        }
    }

    public class UserCreatedEventDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
