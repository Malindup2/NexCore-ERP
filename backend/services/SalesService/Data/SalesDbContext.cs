using Microsoft.EntityFrameworkCore;
using SalesService.Models;

namespace SalesService.Data
{
    public class SalesDbContext : DbContext
    {
        public SalesDbContext(DbContextOptions<SalesDbContext> options) : base(options)
        {
        }

        public DbSet<Customer> Customers { get; set; }
        public DbSet<SalesOrder> SalesOrders { get; set; }
        public DbSet<SalesOrderItem> SalesOrderItems { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Customer indexes
            modelBuilder.Entity<Customer>()
                .HasIndex(c => c.Email)
                .IsUnique();

            // SalesOrder indexes
            modelBuilder.Entity<SalesOrder>()
                .HasIndex(so => so.OrderNumber)
                .IsUnique();

            modelBuilder.Entity<SalesOrder>()
                .HasIndex(so => so.OrderDate);

            modelBuilder.Entity<SalesOrder>()
                .HasIndex(so => so.CustomerId);

            // Configure relationships
            modelBuilder.Entity<SalesOrder>()
                .HasMany(so => so.Items)
                .WithOne()
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}