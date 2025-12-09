using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace AccountingService.Models
{
    public class JournalEntryLine
    {
        public int Id { get; set; }
        public int JournalEntryId { get; set; }

        public int AccountId { get; set; }
        public Account? Account { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Debit { get; set; } 

        [Column(TypeName = "decimal(18,2)")]
        public decimal Credit { get; set; } 
        [JsonIgnore]
        public JournalEntry? JournalEntry { get; set; }
    }
}