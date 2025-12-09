using AccountingService.Models;

namespace AccountingService.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AccountingDbContext context)
        {
            // Ensure database is created
            context.Database.EnsureCreated();

            
            if (context.Accounts.Any()) return;

            var accounts = new Account[]
            {
                // ASSETS (1xxx)
                new Account { AccountCode = "1000", Name = "Cash on Hand", Type = "Asset", Balance = 0 },
                new Account { AccountCode = "1010", Name = "Bank Account", Type = "Asset", Balance = 1000000 }, 
                new Account { AccountCode = "1200", Name = "Accounts Receivable", Type = "Asset", Balance = 0 }, 
                new Account { AccountCode = "1300", Name = "Inventory Asset", Type = "Asset", Balance = 0 }, 

                // LIABILITIES (2xxx)
                new Account { AccountCode = "2000", Name = "Accounts Payable", Type = "Liability", Balance = 0 }, 

                // EQUITY (3xxx)
                new Account { AccountCode = "3000", Name = "Owner's Equity", Type = "Equity", Balance = 1000000 },

                // REVENUE (4xxx)
                new Account { AccountCode = "4000", Name = "Sales Revenue", Type = "Revenue", Balance = 0 },

                // EXPENSES (5xxx)
                new Account { AccountCode = "5000", Name = "Cost of Goods Sold (COGS)", Type = "Expense", Balance = 0 },
                new Account { AccountCode = "5100", Name = "Salary Expense", Type = "Expense", Balance = 0 }
            };

            context.Accounts.AddRange(accounts);
            context.SaveChanges();
        }
    }
}