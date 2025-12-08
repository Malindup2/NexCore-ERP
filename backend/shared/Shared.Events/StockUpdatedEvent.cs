namespace Shared.Events
{
    public class StockUpdatedEvent : IntegrationEvent
    {
        public int ProductId { get; set; }
        public string SKU { get; set; } = string.Empty;
        public int OldQuantity { get; set; }
        public int NewQuantity { get; set; }
        public string Reason { get; set; } = string.Empty; 
    }
}