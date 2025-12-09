using System.ComponentModel.DataAnnotations.Schema;

namespace PayrollService.Models
{
    public class PayrollRun
    {
        public int Id { get; set; }

        public int Year { get; set; }
        public int Month { get; set; }

        public int EmployeeCount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public DateTime ProcessedDate { get; set; } = DateTime.UtcNow;

        public string Status { get; set; } = "Completed";
    }
}
