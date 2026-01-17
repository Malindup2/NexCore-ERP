using System.ComponentModel.DataAnnotations;

namespace AuthService.DTOs
{
    public class ResetPasswordRequest
    {
        [Required(ErrorMessage = "Token is required")]
        public string Token { get; set; } = string.Empty;

        [Required(ErrorMessage = "New password is required")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
        [MaxLength(100, ErrorMessage = "Password cannot exceed 100 characters")]
        public string NewPassword { get; set; } = string.Empty;
    }
}
