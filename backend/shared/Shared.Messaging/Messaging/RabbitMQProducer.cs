using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using Shared.Events;

namespace Shared.Messaging
{
    public class RabbitMQProducer : IRabbitMQProducer
    {
        private readonly ConnectionFactory _factory;
        private readonly ILogger<RabbitMQProducer>? _logger;

        public RabbitMQProducer(ILogger<RabbitMQProducer>? logger = null)
        {
            _logger = logger;
            _factory = new ConnectionFactory
            {
                HostName = "localhost",
                Port = 5672,
                UserName = "guest",
                Password = "guest"
            };
        }

        public void PublishEvent<T>(T @event, string exchange) where T : IntegrationEvent
        {
            try
            {
                using var connection = _factory.CreateConnection();
                using var channel = connection.CreateModel();

                channel.ExchangeDeclare(exchange, ExchangeType.Fanout, durable: true);

                var message = JsonSerializer.Serialize(@event);
                var body = Encoding.UTF8.GetBytes(message);

                channel.BasicPublish(exchange: exchange, routingKey: "", basicProperties: null, body: body);

                _logger?.LogInformation($"[RabbitMQ] Published event to '{exchange}'");
            }
            catch (Exception ex)
            {
                _logger?.LogWarning($"[RabbitMQ] Failed to publish event to '{exchange}': {ex.Message}. RabbitMQ may not be running.");
            }
        }
    }
}