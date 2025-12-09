namespace AccountingService.Models
{
    public class JournalEntry
    {
        public int Id { get; set; }
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public string Description { get; set; } = string.Empty; 
        public string ReferenceId { get; set; } = string.Empty; 

        public List<JournalEntryLine> Lines { get; set; } = new();
    }
}