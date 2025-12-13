using AuthService.Data;
using AuthService.DTOs;
using AuthService.Models;
using AuthService.Services;
using BCrypt.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shared.Messaging;
using Shared.Events;
using RegisterRequest = AuthService.DTOs.RegisterRequest;
using LoginRequest = AuthService.DTOs.LoginRequest;
using ForgotPasswordRequest = AuthService.DTOs.ForgotPasswordRequest;
using ResetPasswordRequest = AuthService.DTOs.ResetPasswordRequest;

namespace AuthService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AuthDbContext _context;
        private readonly JwtTokenGenerator _tokenGenerator;
        private readonly IRabbitMQProducer _messageProducer;

        public AuthController(AuthDbContext context, JwtTokenGenerator tokenGenerator, IRabbitMQProducer messageProducer)
        {
            _context = context;
            _tokenGenerator = tokenGenerator;
            _messageProducer = messageProducer;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest("User already exists.");
            }

            // Hash the password 
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // Save user to DB
            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = passwordHash
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Publish event for Employee role only (HRService will create Employee record)
            if (user.Role == UserRoles.Employee)
            {
                var userCreatedEvent = new UserCreatedEvent
                {
                    UserId = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role
                };
                _messageProducer.PublishEvent(userCreatedEvent, "user_events");
            }

            return Ok("User registered successfully");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // Find user by email
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            // Check if user exists OR if password matches
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Unauthorized("Invalid credentials");
            }

            // Generate Token
            var token = _tokenGenerator.GenerateToken(user);

            return Ok(new 
            { 
                Token = token,
                User = new
                {
                    user.Id,
                    user.Username,
                    user.Email,
                    user.Role
                }
            });
        }

        // Admin endpoint to create users with any role
        [HttpPost("admin/create-user")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            // TODO: Add [Authorize(Roles = "Admin")] attribute once JWT authentication is configured
            // For now, this endpoint is open - secure it in production!

            // Validate role
            var validRoles = new[] { UserRoles.Admin, UserRoles.HRManager, UserRoles.Accountant, UserRoles.SalesProcurement, UserRoles.Employee };
            if (!validRoles.Contains(request.Role))
            {
                return BadRequest("Invalid role specified.");
            }

            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest("User with this email already exists.");
            }

            // Hash the password
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // Create user
            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = passwordHash,
                Role = request.Role
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Publish event only for Employee role
            if (user.Role == UserRoles.Employee)
            {
                var userCreatedEvent = new UserCreatedEvent
                {
                    UserId = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role
                };
                _messageProducer.PublishEvent(userCreatedEvent, "user_events");
            }

            return Ok(new 
            { 
                Message = "User created successfully",
                User = new
                {
                    user.Id,
                    user.Username,
                    user.Email,
                    user.Role
                }
            });
        }

        // Get all users (Admin only)
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            // TODO: Add [Authorize(Roles = "Admin")] attribute once JWT authentication is configured
            
            var users = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.Email,
                    u.Role,
                    u.CreatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            // Find user by email
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            // Don't reveal if user exists or not (security best practice)
            if (user == null)
            {
                return Ok(new { Message = "If the email exists, a password reset link has been sent." });
            }

            // Generate secure random token
            var resetToken = GenerateSecureToken();

            // Create password reset token record
            var passwordResetToken = new PasswordResetToken
            {
                UserId = user.Id,
                Token = resetToken,
                ExpiresAt = DateTime.UtcNow.AddHours(1), // Token valid for 1 hour
                IsUsed = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.PasswordResetTokens.Add(passwordResetToken);
            await _context.SaveChangesAsync();

            // Send password reset email
            try
            {
                await _emailService.SendPasswordResetEmailAsync(user.Email, resetToken, user.Username);
                _logger.LogInformation($"Password reset email sent to {user.Email}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to send password reset email to {user.Email}: {ex.Message}");
                return StatusCode(500, new { Message = "Failed to send reset email. Please try again later." });
            }

            return Ok(new 
            { 
                Message = "If the email exists, a password reset link has been sent to your email address."
            });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            // Find the reset token
            var resetToken = await _context.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Token == request.Token);

            // Validate token exists
            if (resetToken == null)
            {
                return BadRequest(new { Message = "Invalid or expired reset token." });
            }

            // Validate token hasn't been used
            if (resetToken.IsUsed)
            {
                return BadRequest(new { Message = "This reset token has already been used." });
            }

            // Validate token hasn't expired
            if (resetToken.ExpiresAt < DateTime.UtcNow)
            {
                return BadRequest(new { Message = "This reset token has expired. Please request a new one." });
            }

            // Hash the new password
            var newPasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

            // Update user's password
            if (resetToken.User != null)
            {
                resetToken.User.PasswordHash = newPasswordHash;
            }

            // Mark token as used
            resetToken.IsUsed = true;

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Password has been reset successfully. You can now login with your new password." });
        }

        private string GenerateSecureToken()
        {
            // Generate a cryptographically secure random token
            var randomBytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomBytes);
            }
            return Convert.ToBase64String(randomBytes).Replace("+", "-").Replace("/", "_").Replace("=", "");
        }
    }
}