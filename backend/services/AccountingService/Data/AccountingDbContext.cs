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
    }
}