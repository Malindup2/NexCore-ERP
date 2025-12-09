using AccountingService.Models;
using Microsoft.EntityFrameworkCore;

namespace AccountingService.Data
{
    public class AccountingDbContext : DbContext
    {
        public AccountingDbContext(DbContextOptions<AccountingDbContext> options) : base(options)
        {
        }

        public DbSet<Account> Accounts { get; set; }
        public DbSet<JournalEntry> JournalEntries { get; set; }
        public DbSet<JournalEntryLine> JournalEntryLines { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Account indexes
            modelBuilder.Entity<Account>()
                .HasIndex(a => a.AccountCode)
                .IsUnique();

            modelBuilder.Entity<Account>()
                .HasIndex(a => a.Type);

            // JournalEntry indexes
            modelBuilder.Entity<JournalEntry>()
                .HasIndex(je => je.ReferenceId);

            modelBuilder.Entity<JournalEntry>()
                .HasIndex(je => je.Date);

            // Configure relationships
            modelBuilder.Entity<JournalEntry>()
                .HasMany(je => je.Lines)
                .WithOne()
                .HasForeignKey(jel => jel.JournalEntryId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}