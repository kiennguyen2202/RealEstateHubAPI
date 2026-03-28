using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.Models;
using System.Security.Claims;

namespace RealEstateHubAPI.Controllers
{
    [ApiController]
    [Route("api/payment-history")]
    public class PaymentHistoryController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PaymentHistoryController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("user")]
        public async Task<IActionResult> GetUserPaymentHistory()
        {
            try
            {
                // Get current user ID from JWT token
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized("User not authenticated");
                }

                var paymentHistory = await _context.PaymentHistories
                    .Where(ph => ph.UserId == userId)
                    .OrderByDescending(ph => ph.CreatedAt)
                    .Select(ph => new
                    {
                        ph.Id,
                        ph.Plan,
                        ph.Amount,
                        ph.PaymentMethod,
                        ph.TransactionId,
                        ph.Status,
                        ph.CreatedAt,
                        ph.ProcessedAt,
                        ph.ErrorMessage
                    })
                    .ToListAsync();

                return Ok(paymentHistory);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }

        [HttpGet("admin")]
        public async Task<IActionResult> GetAllPaymentHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                // Check if user is admin
                var userRoleClaim = User.FindFirst(ClaimTypes.Role);
                if (userRoleClaim?.Value != "Admin")
                {
                    return Forbid("Admin access required");
                }

                var query = _context.PaymentHistories
                    .Include(ph => ph.User)
                    .OrderByDescending(ph => ph.CreatedAt);

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);

                var paymentHistory = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(ph => new
                    {
                        ph.Id,
                        ph.UserId,
                        ph.UserName,
                        ph.Plan,
                        ph.Amount,
                        ph.PaymentMethod,
                        ph.TransactionId,
                        ph.Status,
                        ph.PreviewId,
                        ph.CreatedAt,
                        ph.ProcessedAt,
                        ph.ErrorMessage,
                       
                    })
                    .ToListAsync();

                return Ok(new
                {
                    data = paymentHistory,
                    pagination = new
                    {
                        page,
                        pageSize,
                        totalCount,
                        totalPages
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }
    }
}
