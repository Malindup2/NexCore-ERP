namespace Shared.Events
{
   
    public class EmployeeCreatedEvent : IntegrationEvent
    {
        public int EmployeeId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public DateTime JoiningDate { get; set; }
    }
}