using AccountingService.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AccountingService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        private readonly AccountingDbContext _context;
        private readonly ILogger<ReportsController> _logger;

        public ReportsController(AccountingDbContext context, ILogger<ReportsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Reports/trial-balance
        [HttpGet("trial-balance")]
        public async Task<ActionResult> GetTrialBalance([FromQuery] DateTime? asOfDate)
        {
            try
            {
                var targetDate = asOfDate ?? DateTime.UtcNow;

                // Get all accounts with their current balances
                var accounts = await _context.Accounts
                    .OrderBy(a => a.AccountCode)
                    .ToListAsync();

                var trialBalance = accounts.Select(a => new
                {
                    a.AccountCode,
                    a.Name,
                    a.Type,
                    Debit = (a.Type == "Asset" || a.Type == "Expense") && a.Balance > 0 ? a.Balance : 0m,
                    Credit = (a.Type == "Liability" || a.Type == "Equity" || a.Type == "Revenue") && a.Balance > 0 ? a.Balance : 0m
                }).ToList();

                var totalDebits = trialBalance.Sum(tb => tb.Debit);
                var totalCredits = trialBalance.Sum(tb => tb.Credit);

                return Ok(new
                {
                    asOfDate = targetDate,
                    accounts = trialBalance,
                    totalDebits,
                    totalCredits,
                    isBalanced = totalDebits == totalCredits,
                    difference = totalDebits - totalCredits
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating trial balance");
                return StatusCode(500, new { message = "Error generating trial balance" });
            }
        }

        // GET: api/Reports/balance-sheet
        [HttpGet("balance-sheet")]
        public async Task<ActionResult> GetBalanceSheet([FromQuery] DateTime? asOfDate)
        {
            try
            {
                var targetDate = asOfDate ?? DateTime.UtcNow;

                var accounts = await _context.Accounts.ToListAsync();

                var assets = accounts
                    .Where(a => a.Type == "Asset")
                    .Select(a => new { a.AccountCode, a.Name, a.Balance })
                    .OrderBy(a => a.AccountCode)
                    .ToList();

                var liabilities = accounts
                    .Where(a => a.Type == "Liability")
                    .Select(a => new { a.AccountCode, a.Name, a.Balance })
                    .OrderBy(a => a.AccountCode)
                    .ToList();

                var equity = accounts
                    .Where(a => a.Type == "Equity")
                    .Select(a => new { a.AccountCode, a.Name, a.Balance })
                    .OrderBy(a => a.AccountCode)
                    .ToList();

                // Calculate retained earnings (Revenue - Expenses)
                var revenue = accounts.Where(a => a.Type == "Revenue").Sum(a => a.Balance);
                var expenses = accounts.Where(a => a.Type == "Expense").Sum(a => a.Balance);
                var retainedEarnings = revenue - expenses;

                var totalAssets = assets.Sum(a => a.Balance);
                var totalLiabilities = liabilities.Sum(a => a.Balance);
                var totalEquity = equity.Sum(a => a.Balance) + retainedEarnings;

                return Ok(new
                {
                    asOfDate = targetDate,
                    assets = new
                    {
                        accounts = assets,
                        total = totalAssets
                    },
                    liabilities = new
                    {
                        accounts = liabilities,
                        total = totalLiabilities
                    },
                    equity = new
                    {
                        accounts = equity,
                        retainedEarnings,
                        total = totalEquity
                    },
                    isBalanced = Math.Abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01m,
                    difference = totalAssets - (totalLiabilities + totalEquity)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating balance sheet");
                return StatusCode(500, new { message = "Error generating balance sheet" });
            }
        }

        // GET: api/Reports/income-statement
        [HttpGet("income-statement")]
        public async Task<ActionResult> GetIncomeStatement(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            try
            {
                var start = startDate ?? new DateTime(DateTime.UtcNow.Year, 1, 1);
                var end = endDate ?? DateTime.UtcNow;

                // Get all journal entries within the period
                var journalEntries = await _context.JournalEntries
                    .Include(je => je.Lines)
                        .ThenInclude(l => l.Account)
                    .Where(je => je.Date >= start && je.Date <= end)
                    .ToListAsync();

                // Calculate revenue and expenses from the journal entries
                var accounts = await _context.Accounts
                    .Where(a => a.Type == "Revenue" || a.Type == "Expense")
                    .ToListAsync();

                var revenueAccounts = accounts
                    .Where(a => a.Type == "Revenue")
                    .Select(a => new
                    {
                        a.AccountCode,
                        a.Name,
                        Amount = journalEntries
                            .SelectMany(je => je.Lines)
                            .Where(l => l.AccountId == a.Id)
                            .Sum(l => l.Credit - l.Debit) // Revenue increases with credits
                    })
                    .Where(a => a.Amount != 0)
                    .OrderBy(a => a.AccountCode)
                    .ToList();

                var expenseAccounts = accounts
                    .Where(a => a.Type == "Expense")
                    .Select(a => new
                    {
                        a.AccountCode,
                        a.Name,
                        Amount = journalEntries
                            .SelectMany(je => je.Lines)
                            .Where(l => l.AccountId == a.Id)
                            .Sum(l => l.Debit - l.Credit) // Expenses increase with debits
                    })
                    .Where(a => a.Amount != 0)
                    .OrderBy(a => a.AccountCode)
                    .ToList();

                var totalRevenue = revenueAccounts.Sum(a => a.Amount);
                var totalExpenses = expenseAccounts.Sum(a => a.Amount);
                var netIncome = totalRevenue - totalExpenses;

                return Ok(new
                {
                    startDate = start,
                    endDate = end,
                    revenue = new
                    {
                        accounts = revenueAccounts,
                        total = totalRevenue
                    },
                    expenses = new
                    {
                        accounts = expenseAccounts,
                        total = totalExpenses
                    },
                    netIncome,
                    profitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating income statement");
                return StatusCode(500, new { message = "Error generating income statement" });
            }
        }

        // GET: api/Reports/general-ledger
        [HttpGet("general-ledger")]
        public async Task<ActionResult> GetGeneralLedger(
            [FromQuery] int? accountId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            try
            {
                var start = startDate ?? new DateTime(DateTime.UtcNow.Year, 1, 1);
                var end = endDate ?? DateTime.UtcNow;

                var query = _context.JournalEntryLines
                    .Include(l => l.Account)
                    .Include(l => l.JournalEntry)
                    .Where(l => l.JournalEntry!.Date >= start && l.JournalEntry.Date <= end);

                if (accountId.HasValue)
                {
                    query = query.Where(l => l.AccountId == accountId.Value);
                }

                var lines = await query
                    .OrderBy(l => l.Account!.AccountCode)
                    .ThenBy(l => l.JournalEntry!.Date)
                    .ThenBy(l => l.JournalEntryId)
                    .ToListAsync();

                // Group by account
                var ledger = lines
                    .GroupBy(l => new { l.Account!.Id, l.Account.AccountCode, l.Account.Name, l.Account.Type })
                    .Select(g => new
                    {
                        accountId = g.Key.Id,
                        accountCode = g.Key.AccountCode,
                        accountName = g.Key.Name,
                        accountType = g.Key.Type,
                        transactions = g.Select(l => new
                        {
                            date = l.JournalEntry!.Date,
                            description = l.JournalEntry.Description,
                            referenceId = l.JournalEntry.ReferenceId,
                            debit = l.Debit,
                            credit = l.Credit
                        }).ToList(),
                        totalDebits = g.Sum(l => l.Debit),
                        totalCredits = g.Sum(l => l.Credit),
                        balance = g.Key.Type == "Asset" || g.Key.Type == "Expense"
                            ? g.Sum(l => l.Debit - l.Credit)
                            : g.Sum(l => l.Credit - l.Debit)
                    })
                    .ToList();

                return Ok(new
                {
                    startDate = start,
                    endDate = end,
                    accounts = ledger
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating general ledger");
                return StatusCode(500, new { message = "Error generating general ledger" });
            }
        }

        // GET: api/Reports/cash-flow
        [HttpGet("cash-flow")]
        public async Task<ActionResult> GetCashFlow(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            try
            {
                var start = startDate ?? new DateTime(DateTime.UtcNow.Year, 1, 1);
                var end = endDate ?? DateTime.UtcNow;

                // Find cash accounts (typically account codes starting with 10xx)
                var cashAccounts = await _context.Accounts
                    .Where(a => a.Type == "Asset" && (a.AccountCode.StartsWith("10") || a.Name.Contains("Cash") || a.Name.Contains("Bank")))
                    .ToListAsync();

                if (!cashAccounts.Any())
                {
                    return Ok(new { message = "No cash accounts found" });
                }

                var cashAccountIds = cashAccounts.Select(a => a.Id).ToList();

                var cashTransactions = await _context.JournalEntryLines
                    .Include(l => l.JournalEntry)
                    .Include(l => l.Account)
                    .Where(l => cashAccountIds.Contains(l.AccountId) &&
                               l.JournalEntry!.Date >= start &&
                               l.JournalEntry.Date <= end)
                    .OrderBy(l => l.JournalEntry!.Date)
                    .Select(l => new
                    {
                        date = l.JournalEntry!.Date,
                        description = l.JournalEntry.Description,
                        accountCode = l.Account!.AccountCode,
                        accountName = l.Account.Name,
                        cashIn = l.Debit,
                        cashOut = l.Credit
                    })
                    .ToListAsync();

                var totalCashIn = cashTransactions.Sum(t => t.cashIn);
                var totalCashOut = cashTransactions.Sum(t => t.cashOut);
                var netCashFlow = totalCashIn - totalCashOut;

                return Ok(new
                {
                    startDate = start,
                    endDate = end,
                    transactions = cashTransactions,
                    totalCashIn,
                    totalCashOut,
                    netCashFlow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating cash flow report");
                return StatusCode(500, new { message = "Error generating cash flow report" });
            }
        }
    }
}
