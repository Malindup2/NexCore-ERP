using HRService.Data;
using HRService.DTOs;
using HRService.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HRService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PerformanceReviewController : ControllerBase
    {
        private readonly HrDbContext _context;
        private readonly ILogger<PerformanceReviewController> _logger;

        public PerformanceReviewController(HrDbContext context, ILogger<PerformanceReviewController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // POST: api/PerformanceReview
        [HttpPost]
        public async Task<IActionResult> CreateReview([FromBody] CreatePerformanceReviewDto request)
        {
            try
            {
                var review = new PerformanceReview
                {
                    EmployeeId = request.EmployeeId,
                    ReviewerId = request.ReviewerId,
                    Period = Enum.Parse<ReviewPeriod>(request.Period),
                    ReviewDate = request.ReviewDate.ToUniversalTime(),
                    PeriodStartDate = request.PeriodStartDate.ToUniversalTime(),
                    PeriodEndDate = request.PeriodEndDate.ToUniversalTime(),
                    Status = ReviewStatus.Draft,
                    CreatedAt = DateTime.UtcNow
                };

                _context.PerformanceReviews.Add(review);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Performance review created successfully", reviewId = review.Id });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating performance review");
                return StatusCode(500, new { message = "Error creating review" });
            }
        }

        // PUT: api/PerformanceReview/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateReview(int id, [FromBody] UpdatePerformanceReviewDto request)
        {
            try
            {
                var review = await _context.PerformanceReviews.FindAsync(id);

                if (review == null)
                {
                    return NotFound(new { message = "Review not found" });
                }

                // Update ratings
                review.QualityOfWorkRating = request.QualityOfWorkRating;
                review.ProductivityRating = request.ProductivityRating;
                review.CommunicationRating = request.CommunicationRating;
                review.TeamworkRating = request.TeamworkRating;
                review.InitiativeRating = request.InitiativeRating;
                review.AttendanceRating = request.AttendanceRating;

                // Calculate overall rating
                var ratings = new List<int?> 
                { 
                    request.QualityOfWorkRating, 
                    request.ProductivityRating, 
                    request.CommunicationRating,
                    request.TeamworkRating,
                    request.InitiativeRating,
                    request.AttendanceRating
                };

                var validRatings = ratings.Where(r => r.HasValue).Select(r => r!.Value).ToList();
                if (validRatings.Any())
                {
                    review.OverallRating = Math.Round((decimal)validRatings.Average(), 2);
                }

                // Update text fields
                review.Strengths = request.Strengths;
                review.AreasForImprovement = request.AreasForImprovement;
                review.Goals = request.Goals;
                review.ManagerComments = request.ManagerComments;
                review.EmployeeComments = request.EmployeeComments;
                review.Status = ReviewStatus.InProgress;
                review.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Review updated successfully", overallRating = review.OverallRating });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating performance review");
                return StatusCode(500, new { message = "Error updating review" });
            }
        }

        // POST: api/PerformanceReview/{id}/publish
        [HttpPost("{id}/publish")]
        public async Task<IActionResult> PublishReview(int id)
        {
            try
            {
                var review = await _context.PerformanceReviews.FindAsync(id);

                if (review == null)
                {
                    return NotFound(new { message = "Review not found" });
                }

                if (!review.OverallRating.HasValue)
                {
                    return BadRequest(new { message = "Cannot publish review without ratings" });
                }

                review.Status = ReviewStatus.Published;
                review.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Review published successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error publishing review");
                return StatusCode(500, new { message = "Error publishing review" });
            }
        }

        // GET: api/PerformanceReview/employee/{employeeId}
        [HttpGet("employee/{employeeId}")]
        public async Task<IActionResult> GetEmployeeReviews(int employeeId)
        {
            try
            {
                var reviews = await _context.PerformanceReviews
                    .Include(pr => pr.Employee)
                    .Where(pr => pr.EmployeeId == employeeId)
                    .OrderByDescending(pr => pr.ReviewDate)
                    .Select(pr => new PerformanceReviewDto
                    {
                        Id = pr.Id,
                        EmployeeId = pr.EmployeeId,
                        EmployeeName = $"{pr.Employee!.FirstName} {pr.Employee.LastName}",
                        ReviewerId = pr.ReviewerId,
                        Period = pr.Period.ToString(),
                        ReviewDate = pr.ReviewDate,
                        PeriodStartDate = pr.PeriodStartDate,
                        PeriodEndDate = pr.PeriodEndDate,
                        Status = pr.Status.ToString(),
                        QualityOfWorkRating = pr.QualityOfWorkRating,
                        ProductivityRating = pr.ProductivityRating,
                        CommunicationRating = pr.CommunicationRating,
                        TeamworkRating = pr.TeamworkRating,
                        InitiativeRating = pr.InitiativeRating,
                        AttendanceRating = pr.AttendanceRating,
                        OverallRating = pr.OverallRating,
                        Strengths = pr.Strengths,
                        AreasForImprovement = pr.AreasForImprovement,
                        Goals = pr.Goals,
                        ManagerComments = pr.ManagerComments,
                        EmployeeComments = pr.EmployeeComments,
                        CreatedAt = pr.CreatedAt
                    })
                    .ToListAsync();

                return Ok(reviews);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching employee reviews");
                return StatusCode(500, new { message = "Error fetching reviews" });
            }
        }

        // GET: api/PerformanceReview/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetReview(int id)
        {
            try
            {
                var review = await _context.PerformanceReviews
                    .Include(pr => pr.Employee)
                    .Where(pr => pr.Id == id)
                    .Select(pr => new PerformanceReviewDto
                    {
                        Id = pr.Id,
                        EmployeeId = pr.EmployeeId,
                        EmployeeName = $"{pr.Employee!.FirstName} {pr.Employee.LastName}",
                        ReviewerId = pr.ReviewerId,
                        Period = pr.Period.ToString(),
                        ReviewDate = pr.ReviewDate,
                        PeriodStartDate = pr.PeriodStartDate,
                        PeriodEndDate = pr.PeriodEndDate,
                        Status = pr.Status.ToString(),
                        QualityOfWorkRating = pr.QualityOfWorkRating,
                        ProductivityRating = pr.ProductivityRating,
                        CommunicationRating = pr.CommunicationRating,
                        TeamworkRating = pr.TeamworkRating,
                        InitiativeRating = pr.InitiativeRating,
                        AttendanceRating = pr.AttendanceRating,
                        OverallRating = pr.OverallRating,
                        Strengths = pr.Strengths,
                        AreasForImprovement = pr.AreasForImprovement,
                        Goals = pr.Goals,
                        ManagerComments = pr.ManagerComments,
                        EmployeeComments = pr.EmployeeComments,
                        CreatedAt = pr.CreatedAt
                    })
                    .FirstOrDefaultAsync();

                if (review == null)
                {
                    return NotFound(new { message = "Review not found" });
                }

                return Ok(review);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching review");
                return StatusCode(500, new { message = "Error fetching review" });
            }
        }

        // GET: api/PerformanceReview
        [HttpGet]
        public async Task<IActionResult> GetAllReviews([FromQuery] string? status)
        {
            try
            {
                var query = _context.PerformanceReviews
                    .Include(pr => pr.Employee)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(status))
                {
                    var reviewStatus = Enum.Parse<ReviewStatus>(status);
                    query = query.Where(pr => pr.Status == reviewStatus);
                }

                var reviews = await query
                    .OrderByDescending(pr => pr.ReviewDate)
                    .Select(pr => new PerformanceReviewDto
                    {
                        Id = pr.Id,
                        EmployeeId = pr.EmployeeId,
                        EmployeeName = $"{pr.Employee!.FirstName} {pr.Employee.LastName}",
                        ReviewerId = pr.ReviewerId,
                        Period = pr.Period.ToString(),
                        ReviewDate = pr.ReviewDate,
                        PeriodStartDate = pr.PeriodStartDate,
                        PeriodEndDate = pr.PeriodEndDate,
                        Status = pr.Status.ToString(),
                        OverallRating = pr.OverallRating,
                        CreatedAt = pr.CreatedAt
                    })
                    .ToListAsync();

                return Ok(reviews);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching reviews");
                return StatusCode(500, new { message = "Error fetching reviews" });
            }
        }

        // GET: api/PerformanceReview/summary/{employeeId}
        [HttpGet("summary/{employeeId}")]
        public async Task<IActionResult> GetEmployeePerformanceSummary(int employeeId)
        {
            try
            {
                var employee = await _context.Employees.FindAsync(employeeId);
                if (employee == null)
                {
                    return NotFound(new { message = "Employee not found" });
                }

                var reviews = await _context.PerformanceReviews
                    .Where(pr => pr.EmployeeId == employeeId && pr.Status == ReviewStatus.Published)
                    .OrderByDescending(pr => pr.ReviewDate)
                    .ToListAsync();

                var summary = new EmployeePerformanceSummaryDto
                {
                    EmployeeId = employeeId,
                    EmployeeName = $"{employee.FirstName} {employee.LastName}",
                    TotalReviews = reviews.Count,
                    AverageOverallRating = reviews.Any(r => r.OverallRating.HasValue) 
                        ? Math.Round(reviews.Where(r => r.OverallRating.HasValue).Average(r => r.OverallRating!.Value), 2)
                        : 0,
                    LatestOverallRating = reviews.FirstOrDefault()?.OverallRating ?? 0,
                    LatestReviewDate = reviews.FirstOrDefault()?.ReviewDate,
                    PerformanceTrend = reviews.Count >= 2 
                        ? (reviews[0].OverallRating > reviews[1].OverallRating ? "Improving" : 
                           reviews[0].OverallRating < reviews[1].OverallRating ? "Declining" : "Stable")
                        : "Insufficient Data"
                };

                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching performance summary");
                return StatusCode(500, new { message = "Error fetching summary" });
            }
        }
    }
}
