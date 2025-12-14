using AccountingService.Data;
using AccountingService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AccountingService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JournalEntriesController : ControllerBase
    {
        private readonly AccountingDbContext _context;
        private readonly ILogger<JournalEntriesController> _logger;

        public JournalEntriesController(AccountingDbContext context, ILogger<JournalEntriesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/JournalEntries
        [HttpGet]
        public async Task<ActionResult<IEnumerable<JournalEntry>>> GetJournalEntries(
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] int? accountId)
        {
            try
            {
                var query = _context.JournalEntries
                    .Include(je => je.Lines)
                        .ThenInclude(l => l.Account)
                    .AsQueryable();

                if (startDate.HasValue)
                {
                    query = query.Where(je => je.Date >= startDate.Value);
                }

                if (endDate.HasValue)
                {
                    query = query.Where(je => je.Date <= endDate.Value);
                }

                if (accountId.HasValue)
                {
                    query = query.Where(je => je.Lines.Any(l => l.AccountId == accountId.Value));
                }

                var entries = await query
                    .OrderByDescending(je => je.Date)
                    .ThenByDescending(je => je.Id)
                    .ToListAsync();

                return Ok(entries);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching journal entries");
                return StatusCode(500, new { message = "Error fetching journal entries" });
            }
        }

        // GET: api/JournalEntries/5
        [HttpGet("{id}")]
        public async Task<ActionResult<JournalEntry>> GetJournalEntry(int id)
        {
            try
            {
                var entry = await _context.JournalEntries
                    .Include(je => je.Lines)
                        .ThenInclude(l => l.Account)
                    .FirstOrDefaultAsync(je => je.Id == id);

                if (entry == null)
                {
                    return NotFound(new { message = "Journal entry not found" });
                }

                return Ok(entry);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching journal entry");
                return StatusCode(500, new { message = "Error fetching journal entry" });
            }
        }

        // POST: api/JournalEntries
        [HttpPost]
        public async Task<ActionResult<JournalEntry>> CreateJournalEntry(JournalEntry journalEntry)
        {
            try
            {
                // Validate double-entry accounting: debits must equal credits
                var totalDebits = journalEntry.Lines.Sum(l => l.Debit);
                var totalCredits = journalEntry.Lines.Sum(l => l.Credit);

                if (totalDebits != totalCredits)
                {
                    return BadRequest(new
                    {
                        message = "Journal entry is not balanced. Total debits must equal total credits.",
                        totalDebits,
                        totalCredits,
                        difference = totalDebits - totalCredits
                    });
                }

                if (journalEntry.Lines.Count < 2)
                {
                    return BadRequest(new { message = "Journal entry must have at least 2 lines" });
                }

                // Validate that all accounts exist
                var accountIds = journalEntry.Lines.Select(l => l.AccountId).Distinct().ToList();
                var accounts = await _context.Accounts
                    .Where(a => accountIds.Contains(a.Id))
                    .ToListAsync();

                if (accounts.Count != accountIds.Count)
                {
                    return BadRequest(new { message = "One or more accounts do not exist" });
                }

                // Validate that each line has either debit or credit, not both
                foreach (var line in journalEntry.Lines)
                {
                    if (line.Debit > 0 && line.Credit > 0)
                    {
                        return BadRequest(new { message = "A line cannot have both debit and credit amounts" });
                    }
                    if (line.Debit == 0 && line.Credit == 0)
                    {
                        return BadRequest(new { message = "A line must have either a debit or credit amount" });
                    }
                }

                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    _context.JournalEntries.Add(journalEntry);
                    await _context.SaveChangesAsync();

                    // Update account balances
                    foreach (var line in journalEntry.Lines)
                    {
                        var account = accounts.First(a => a.Id == line.AccountId);
                        
                        // Apply accounting rules:
                        // Assets & Expenses: Debit increases, Credit decreases
                        // Liabilities, Equity & Revenue: Credit increases, Debit decreases
                        if (account.Type == "Asset" || account.Type == "Expense")
                        {
                            account.Balance += line.Debit - line.Credit;
                        }
                        else // Liability, Equity, Revenue
                        {
                            account.Balance += line.Credit - line.Debit;
                        }
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    // Reload the entry with navigation properties
                    var savedEntry = await _context.JournalEntries
                        .Include(je => je.Lines)
                            .ThenInclude(l => l.Account)
                        .FirstAsync(je => je.Id == journalEntry.Id);

                    return CreatedAtAction(nameof(GetJournalEntry), new { id = savedEntry.Id }, savedEntry);
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating journal entry");
                return StatusCode(500, new { message = "Error creating journal entry" });
            }
        }

        // DELETE: api/JournalEntries/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJournalEntry(int id)
        {
            try
            {
                var entry = await _context.JournalEntries
                    .Include(je => je.Lines)
                        .ThenInclude(l => l.Account)
                    .FirstOrDefaultAsync(je => je.Id == id);

                if (entry == null)
                {
                    return NotFound(new { message = "Journal entry not found" });
                }

                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Reverse the account balance changes
                    foreach (var line in entry.Lines)
                    {
                        var account = line.Account!;
                        
                        // Reverse the balance changes
                        if (account.Type == "Asset" || account.Type == "Expense")
                        {
                            account.Balance -= line.Debit - line.Credit;
                        }
                        else // Liability, Equity, Revenue
                        {
                            account.Balance -= line.Credit - line.Debit;
                        }
                    }

                    _context.JournalEntries.Remove(entry);
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok(new { message = "Journal entry deleted successfully" });
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting journal entry");
                return StatusCode(500, new { message = "Error deleting journal entry" });
            }
        }

        // GET: api/JournalEntries/reference/{referenceId}
        [HttpGet("reference/{referenceId}")]
        public async Task<ActionResult<IEnumerable<JournalEntry>>> GetJournalEntriesByReference(string referenceId)
        {
            try
            {
                var entries = await _context.JournalEntries
                    .Include(je => je.Lines)
                        .ThenInclude(l => l.Account)
                    .Where(je => je.ReferenceId == referenceId)
                    .OrderByDescending(je => je.Date)
                    .ToListAsync();

                return Ok(entries);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching journal entries by reference");
                return StatusCode(500, new { message = "Error fetching journal entries" });
            }
        }
    }
}
