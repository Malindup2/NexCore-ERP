using HRService.Models;
using Microsoft.EntityFrameworkCore;

namespace HRService.Data
{
    public class HrDbContext : DbContext
    {
        public HrDbContext(DbContextOptions<HrDbContext> options) : base(options)
        {
        }

        public DbSet<Employee> Employees { get; set; }
        public DbSet<Attendance> Attendances { get; set; }
        public DbSet<LeaveType> LeaveTypes { get; set; }
        public DbSet<LeaveRequest> LeaveRequests { get; set; }
        public DbSet<LeaveBalance> LeaveBalances { get; set; }
        public DbSet<PerformanceReview> PerformanceReviews { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Attendance
            modelBuilder.Entity<Attendance>()
                .HasOne(a => a.Employee)
                .WithMany()
                .HasForeignKey(a => a.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Attendance>()
                .HasIndex(a => new { a.EmployeeId, a.Date })
                .IsUnique();

            // Configure LeaveRequest
            modelBuilder.Entity<LeaveRequest>()
                .HasOne(lr => lr.Employee)
                .WithMany()
                .HasForeignKey(lr => lr.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LeaveRequest>()
                .HasOne(lr => lr.LeaveType)
                .WithMany(lt => lt.LeaveRequests)
                .HasForeignKey(lr => lr.LeaveTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure LeaveBalance
            modelBuilder.Entity<LeaveBalance>()
                .HasOne(lb => lb.Employee)
                .WithMany()
                .HasForeignKey(lb => lb.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LeaveBalance>()
                .HasOne(lb => lb.LeaveType)
                .WithMany()
                .HasForeignKey(lb => lb.LeaveTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<LeaveBalance>()
                .HasIndex(lb => new { lb.EmployeeId, lb.LeaveTypeId, lb.Year })
                .IsUnique();

            // Configure PerformanceReview
            modelBuilder.Entity<PerformanceReview>()
                .HasOne(pr => pr.Employee)
                .WithMany()
                .HasForeignKey(pr => pr.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            // Seed default leave types
            modelBuilder.Entity<LeaveType>().HasData(
                new LeaveType { Id = 1, Name = "Annual Leave", Description = "Paid annual vacation leave", DefaultDaysPerYear = 21, IsPaid = true, RequiresApproval = true, IsActive = true },
                new LeaveType { Id = 2, Name = "Sick Leave", Description = "Paid sick leave", DefaultDaysPerYear = 10, IsPaid = true, RequiresApproval = false, IsActive = true },
                new LeaveType { Id = 3, Name = "Personal Leave", Description = "Personal time off", DefaultDaysPerYear = 5, IsPaid = true, RequiresApproval = true, IsActive = true },
                new LeaveType { Id = 4, Name = "Unpaid Leave", Description = "Unpaid time off", DefaultDaysPerYear = 0, IsPaid = false, RequiresApproval = true, IsActive = true },
                new LeaveType { Id = 5, Name = "Maternity/Paternity Leave", Description = "Leave for new parents", DefaultDaysPerYear = 90, IsPaid = true, RequiresApproval = true, IsActive = true }
            );
        }
    }
}