using Microsoft.EntityFrameworkCore;
using PayrollService.Models;

namespace PayrollService.Data
{
    public class PayrollDbContext : DbContext
    {
        public PayrollDbContext(DbContextOptions<PayrollDbContext> options) : base(options)
        {
        }
        public DbSet<SalaryRecord> SalaryRecords { get; set; }
        public DbSet<PayrollRun> PayrollRuns { get; set; }
    }
}