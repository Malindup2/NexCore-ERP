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

        
        public async Task PublishEventAsync<T>(T @event, string exchange) where T : IntegrationEvent
        {

            using var connection = await _factory.CreateConnectionAsync();

            using var channel = await connection.CreateChannelAsync();

            await channel.ExchangeDeclareAsync(exchange, ExchangeType.Fanout, durable: true);

            var message = JsonSerializer.Serialize(@event);
            var body = Encoding.UTF8.GetBytes(message);

            await channel.BasicPublishAsync(exchange, routingKey: "", body: body);
        }
    }
}