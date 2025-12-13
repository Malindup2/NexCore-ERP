namespace AuthService.Models
{
    public class User
    {
        public int Id { get; set; }

        public string Username { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string PasswordHash { get; set; } = string.Empty;

        public string Role { get; set; } = UserRoles.Employee;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public static class UserRoles
    {
        public const string Admin = "Admin";
        public const string HRManager = "HRManager";
        public const string Accountant = "Accountant";
        public const string SalesProcurement = "SalesProcurement";
        public const string Employee = "Employee";
    }
}
