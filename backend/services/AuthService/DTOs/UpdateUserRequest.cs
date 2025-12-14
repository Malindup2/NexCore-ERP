using System.ComponentModel.DataAnnotations;

namespace AuthService.DTOs
{
    public class UpdateUserRequest
    {
        [MaxLength(100)]
        public string? Username { get; set; }

        [EmailAddress]
        [MaxLength(150)]
        public string? Email { get; set; }

        [MaxLength(50)]
        public string? Role { get; set; }
    }
}
