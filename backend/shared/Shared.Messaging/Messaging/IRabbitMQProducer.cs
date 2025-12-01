using Shared.Events;

namespace Shared.Messaging
{
	public interface IRabbitMQProducer
	{
		void PublishEvent<T>(T @event, string exchange) where T : IntegrationEvent;
	}
}
