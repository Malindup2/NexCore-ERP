namespace Shared.Events
{
    public class GoodsReceivedEvent : IntegrationEvent
    {
        public int PurchaseOrderId { get; set; }
        public string ProductSku { get; set; } = string.Empty;
        public int QuantityReceived { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime ReceivedDate { get; set; }
    }
}