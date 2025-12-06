using Shared.Events;
using System.Threading.Tasks;

namespace Shared.Messaging
{
    public interface IRabbitMQProducer
    {
        Task PublishEventAsync<T>(T @event, string exchange) where T : IntegrationEvent;
    }
}