namespace SalesService.DTOs
{
    public class SalesOrderItemRequest
    {
        public string ProductSku { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    public class CreateSalesOrderRequest
    {
        public int CustomerId { get; set; }
        public List<SalesOrderItemRequest> Items { get; set; } = new();
    }
}