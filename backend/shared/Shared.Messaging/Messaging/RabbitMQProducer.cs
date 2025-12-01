using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using Shared.Events;

namespace Shared.Messaging
{
    public class RabbitMQProducer : IRabbitMQProducer
    {
        private readonly IConnection _connection;

        public RabbitMQProducer()
        {
            var factory = new ConnectionFactory()
            {
                HostName = "localhost",
                Port = 5672,
                UserName = "guest",
                Password = "guest"
            };

            _connection = factory.CreateConnection();
        }

        public void PublishEvent<T>(T @event, string exchange) where T : IntegrationEvent
        {
            using var channel = _connection.CreateModel();

            channel.ExchangeDeclare(exchange, ExchangeType.Fanout, durable: true);

            var message = JsonSerializer.Serialize(@event);
            var body = Encoding.UTF8.GetBytes(message);

            channel.BasicPublish(exchange, routingKey: "", body: body);
        }
    }
}
