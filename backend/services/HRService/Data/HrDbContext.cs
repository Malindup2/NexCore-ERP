using HRService.Models;
using Microsoft.EntityFrameworkCore;

namespace HRService.Data
{
    public class HrDbContext : DbContext
    {
        public HrDbContext(DbContextOptions<HrDbContext> options) : base(options)
        {
        }

        public DbSet<Employee> Employees { get; set; }
    }
}