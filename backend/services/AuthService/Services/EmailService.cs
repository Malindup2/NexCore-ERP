using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Configuration;

namespace AuthService.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string resetToken, string userName)
        {
            var frontendUrl = _configuration["AppSettings:FrontendUrl"] ?? "http://localhost:3000";
            var resetLink = $"{frontendUrl}/auth/reset-password?token={resetToken}";

            var subject = "Reset Your Password - NexCore ERP";
            var htmlBody = GeneratePasswordResetEmailTemplate(userName, resetLink, resetToken);

            await SendEmailAsync(toEmail, subject, htmlBody);
        }

        public async Task SendWelcomeEmailAsync(string toEmail, string userName)
        {
            var subject = "Welcome to NexCore ERP";
            var htmlBody = GenerateWelcomeEmailTemplate(userName);

            await SendEmailAsync(toEmail, subject, htmlBody);
        }

        private async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(
                    _configuration["EmailSettings:FromName"] ?? "NexCore ERP",
                    _configuration["EmailSettings:FromEmail"]
                ));
                message.To.Add(new MailboxAddress("", toEmail));
                message.Subject = subject;

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = htmlBody
                };
                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();
                
                // Connect to SMTP server
                await client.ConnectAsync(
                    _configuration["EmailSettings:SmtpHost"],
                    int.Parse(_configuration["EmailSettings:SmtpPort"] ?? "587"),
                    SecureSocketOptions.StartTls
                );

                // Authenticate
                await client.AuthenticateAsync(
                    _configuration["EmailSettings:SmtpUsername"],
                    _configuration["EmailSettings:SmtpPassword"]
                );

                // Send email
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger.LogInformation($"Email sent successfully to {toEmail}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to send email to {toEmail}: {ex.Message}");
                throw new Exception("Failed to send email. Please try again later.", ex);
            }
        }

        private string GeneratePasswordResetEmailTemplate(string userName, string resetLink, string token)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Reset Your Password</title>
</head>
<body style='margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;'>
    <table width='100%' cellpadding='0' cellspacing='0' style='background-color: #f4f4f4; padding: 20px;'>
        <tr>
            <td align='center'>
                <table width='600' cellpadding='0' cellspacing='0' style='background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);'>
                    <!-- Header -->
                    <tr>
                        <td style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;'>
                            <h1 style='color: #ffffff; margin: 0; font-size: 28px;'>NexCore ERP</h1>
                            <p style='color: #f0f0f0; margin: 10px 0 0 0; font-size: 14px;'>Enterprise Resource Planning</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style='padding: 40px 30px;'>
                            <h2 style='color: #333333; margin: 0 0 20px 0; font-size: 24px;'>Password Reset Request</h2>
                            <p style='color: #666666; line-height: 1.6; margin: 0 0 20px 0;'>
                                Hi {userName},
                            </p>
                            <p style='color: #666666; line-height: 1.6; margin: 0 0 20px 0;'>
                                We received a request to reset your password for your NexCore ERP account. Click the button below to create a new password:
                            </p>
                            
                            <!-- Reset Button -->
                            <table width='100%' cellpadding='0' cellspacing='0' style='margin: 30px 0;'>
                                <tr>
                                    <td align='center'>
                                        <a href='{resetLink}' style='display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;'>Reset Password</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style='color: #666666; line-height: 1.6; margin: 20px 0;'>
                                Or copy and paste this link into your browser:
                            </p>
                            <p style='background-color: #f8f8f8; padding: 15px; border-radius: 4px; word-break: break-all; font-size: 13px; color: #667eea; margin: 0 0 20px 0;'>
                                {resetLink}
                            </p>
                            
                            <div style='background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;'>
                                <p style='color: #856404; margin: 0; font-size: 14px;'>
                                     <strong>Important:</strong> This link will expire in 1 hour for security reasons.
                                </p>
                            </div>
                            
                            <p style='color: #666666; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;'>
                                If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style='background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;'>
                            <p style='color: #6c757d; margin: 0 0 10px 0; font-size: 13px;'>
                                This is an automated email from NexCore ERP
                            </p>
                            <p style='color: #6c757d; margin: 0; font-size: 13px;'>
                                © 2025 NexCore ERP. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
        }

        private string GenerateWelcomeEmailTemplate(string userName)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Welcome to NexCore ERP</title>
</head>
<body style='margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;'>
    <table width='100%' cellpadding='0' cellspacing='0' style='background-color: #f4f4f4; padding: 20px;'>
        <tr>
            <td align='center'>
                <table width='600' cellpadding='0' cellspacing='0' style='background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);'>
                    <!-- Header -->
                    <tr>
                        <td style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;'>
                            <h1 style='color: #ffffff; margin: 0; font-size: 28px;'>Welcome to NexCore ERP! 🎉</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style='padding: 40px 30px;'>
                            <h2 style='color: #333333; margin: 0 0 20px 0; font-size: 24px;'>Hello {userName}!</h2>
                            <p style='color: #666666; line-height: 1.6; margin: 0 0 20px 0;'>
                                Thank you for joining NexCore ERP. Your account has been successfully created!
                            </p>
                            <p style='color: #666666; line-height: 1.6; margin: 0 0 20px 0;'>
                                You can now access all features of our Enterprise Resource Planning system to streamline your business operations.
                            </p>
                            
                            <div style='background-color: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 4px;'>
                                <p style='color: #0c5689; margin: 0; font-size: 14px;'>
                                     <strong>Quick Tip:</strong> Start by exploring the dashboard and setting up your business modules.
                                </p>
                            </div>
                            
                            <p style='color: #666666; line-height: 1.6; margin: 20px 0 0 0;'>
                                Best regards,<br>
                                The NexCore ERP Team
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style='background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;'>
                            <p style='color: #6c757d; margin: 0; font-size: 13px;'>
                                © 2025 NexCore ERP. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
        }
    }
}
