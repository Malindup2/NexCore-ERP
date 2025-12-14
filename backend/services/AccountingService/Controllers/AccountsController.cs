using AccountingService.Data;
using AccountingService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AccountingService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountsController : ControllerBase
    {
        private readonly AccountingDbContext _context;
        private readonly ILogger<AccountsController> _logger;

        public AccountsController(AccountingDbContext context, ILogger<AccountsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Accounts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Account>>> GetAccounts([FromQuery] string? type)
        {
            try
            {
                var query = _context.Accounts.AsQueryable();

                if (!string.IsNullOrEmpty(type))
                {
                    query = query.Where(a => a.Type == type);
                }

                var accounts = await query
                    .OrderBy(a => a.AccountCode)
                    .ToListAsync();

                return Ok(accounts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching accounts");
                return StatusCode(500, new { message = "Error fetching accounts" });
            }
        }

        // GET: api/Accounts/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Account>> GetAccount(int id)
        {
            try
            {
                var account = await _context.Accounts.FindAsync(id);

                if (account == null)
                {
                    return NotFound(new { message = "Account not found" });
                }

                return Ok(account);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching account");
                return StatusCode(500, new { message = "Error fetching account" });
            }
        }

        // GET: api/Accounts/code/{accountCode}
        [HttpGet("code/{accountCode}")]
        public async Task<ActionResult<Account>> GetAccountByCode(string accountCode)
        {
            try
            {
                var account = await _context.Accounts
                    .FirstOrDefaultAsync(a => a.AccountCode == accountCode);

                if (account == null)
                {
                    return NotFound(new { message = "Account not found" });
                }

                return Ok(account);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching account");
                return StatusCode(500, new { message = "Error fetching account" });
            }
        }

        // POST: api/Accounts
        [HttpPost]
        public async Task<ActionResult<Account>> CreateAccount(Account account)
        {
            try
            {
                // Check if account code already exists
                var existingAccount = await _context.Accounts
                    .FirstOrDefaultAsync(a => a.AccountCode == account.AccountCode);

                if (existingAccount != null)
                {
                    return BadRequest(new { message = "Account code already exists" });
                }

                // Validate account type
                var validTypes = new[] { "Asset", "Liability", "Equity", "Revenue", "Expense" };
                if (!validTypes.Contains(account.Type))
                {
                    return BadRequest(new { message = "Invalid account type. Must be: Asset, Liability, Equity, Revenue, or Expense" });
                }

                _context.Accounts.Add(account);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetAccount), new { id = account.Id }, account);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating account");
                return StatusCode(500, new { message = "Error creating account" });
            }
        }

        // PUT: api/Accounts/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAccount(int id, Account account)
        {
            if (id != account.Id)
            {
                return BadRequest(new { message = "ID mismatch" });
            }

            try
            {
                var existingAccount = await _context.Accounts.FindAsync(id);
                if (existingAccount == null)
                {
                    return NotFound(new { message = "Account not found" });
                }

                // Check if new account code conflicts with another account
                var duplicate = await _context.Accounts
                    .FirstOrDefaultAsync(a => a.AccountCode == account.AccountCode && a.Id != id);

                if (duplicate != null)
                {
                    return BadRequest(new { message = "Account code already exists" });
                }

                // Validate account type
                var validTypes = new[] { "Asset", "Liability", "Equity", "Revenue", "Expense" };
                if (!validTypes.Contains(account.Type))
                {
                    return BadRequest(new { message = "Invalid account type" });
                }

                existingAccount.AccountCode = account.AccountCode;
                existingAccount.Name = account.Name;
                existingAccount.Type = account.Type;
                // Note: Balance should not be updated directly, only through journal entries

                await _context.SaveChangesAsync();

                return Ok(new { message = "Account updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating account");
                return StatusCode(500, new { message = "Error updating account" });
            }
        }

        // DELETE: api/Accounts/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAccount(int id)
        {
            try
            {
                var account = await _context.Accounts.FindAsync(id);
                if (account == null)
                {
                    return NotFound(new { message = "Account not found" });
                }

                // Check if account has been used in journal entries
                var hasTransactions = await _context.JournalEntryLines
                    .AnyAsync(jel => jel.AccountId == id);

                if (hasTransactions)
                {
                    return BadRequest(new { message = "Cannot delete account with existing transactions" });
                }

                _context.Accounts.Remove(account);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Account deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting account");
                return StatusCode(500, new { message = "Error deleting account" });
            }
        }

        // GET: api/Accounts/types
        [HttpGet("types")]
        public ActionResult<IEnumerable<string>> GetAccountTypes()
        {
            var types = new[] { "Asset", "Liability", "Equity", "Revenue", "Expense" };
            return Ok(types);
        }
    }
}
