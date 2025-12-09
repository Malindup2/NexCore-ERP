namespace Shared.Events
{
    public class StockDeductedEvent : IntegrationEvent
    {
        public int OrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string ProductSku { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public int QuantityDeducted { get; set; }
        public decimal UnitCost { get; set; }
        public decimal TotalCost { get; set; }
    }
}
