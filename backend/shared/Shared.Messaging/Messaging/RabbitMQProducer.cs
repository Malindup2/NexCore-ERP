using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using Shared.Events;

namespace Shared.Messaging
{
    public class RabbitMQProducer : IRabbitMQProducer
    {
        private readonly ConnectionFactory _factory;

        public RabbitMQProducer()
        {
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
            using var connection = _factory.CreateConnection();

            using var channel = connection.CreateModel();

            channel.ExchangeDeclare(exchange, ExchangeType.Fanout, durable: true);

            var message = JsonSerializer.Serialize(@event);
            var body = Encoding.UTF8.GetBytes(message);

            channel.BasicPublish(exchange: exchange, routingKey: "", basicProperties: null, body: body);
        }
    }
}