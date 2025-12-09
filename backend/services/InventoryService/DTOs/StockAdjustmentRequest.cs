namespace InventoryService.DTOs
{
    public class StockAdjustmentRequest
    {
        public int Adjustment { get; set; } 
        public string Reason { get; set; } = "Manual Adjustment";
    }
}