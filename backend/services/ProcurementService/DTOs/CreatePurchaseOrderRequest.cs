namespace ProcurementService.DTOs
{
    public class CreatePurchaseOrderRequest
    {
        public int SupplierId { get; set; }
        public string ProductSku { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal TotalAmount { get; set; }
    }
}