using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using System.IO;
using System.Threading.Tasks;
using System;
using RealEstateHubAPI.Models;
using RealEstateHubAPI.Model;
using RealEstateHubAPI.DTOs;

namespace RealEstateHubAPI.Controllers
{
    [ApiController]
    [Route("api/payment")]
    public class PaymentController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;
        private readonly ApplicationDbContext _context;
        public PaymentController(IWebHostEnvironment env, ApplicationDbContext context)
        {
            _env = env;
            _context = context;
        }

        [HttpPost("confirm")]
        public async Task<IActionResult> Confirm([FromForm] PaymentConfirmationDto dto)
        {
            string receiptUrl = null;
            if (dto.Receipt != null && dto.Receipt.Length > 0)
            {
                var uploads = Path.Combine(_env.WebRootPath, "uploads", "receipts");
                if (!Directory.Exists(uploads)) Directory.CreateDirectory(uploads);
                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(dto.Receipt.FileName)}";
                var filePath = Path.Combine(uploads, fileName);
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.Receipt.CopyToAsync(stream);
                }
                receiptUrl = $"/uploads/receipts/{fileName}";
            }

            var model = new PaymentConfirmation
            {
                UserId = dto.UserId,
                Name = dto.Name, 
                Phone = dto.Phone,
                Email = dto.Email,
                PaymentMethod = dto.PaymentMethod,
                ReceiptUrl = receiptUrl,
                CreatedAt = DateTime.Now
            };

            _context.PaymentConfirmations.Add(model);
            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }
    }


}