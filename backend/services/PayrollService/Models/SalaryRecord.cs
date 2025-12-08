using System.ComponentModel.DataAnnotations.Schema;

namespace PayrollService.Models
{
    public class SalaryRecord
    {
        public int Id { get; set; }

        public int EmployeeId { get; set; }

        public string EmployeeName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        public decimal BasicSalary { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Allowances { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal NetSalary { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}