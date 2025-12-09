namespace Shared.Events
{
    public class SalesOrderItemDto
    {
        public string ProductSku { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    public class SalesOrderCreatedEvent : IntegrationEvent
    {
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public DateTime OrderDate { get; set; }

       
        public List<SalesOrderItemDto> Items { get; set; } = new();
    }
}