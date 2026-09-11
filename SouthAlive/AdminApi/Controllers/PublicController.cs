using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.IO;
using AdminApi.Data;
using AdminApi.DTOs;
using AdminApi.Models;



namespace AdminApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PublicController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly ILogger<PublicController> _logger;
        private readonly GeoJsonWriter _geoJsonWriter = new();

        public PublicController(ApplicationDbContext context, IEmailService emailService, ILogger<PublicController> logger)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
        }

        // GET /api/public/areas
        [HttpGet("areas")]
        public async Task<ActionResult<IEnumerable<AreaDto>>> GetAdoptedAreas()
        {
            var areas = await _context.Areas
                .Where(a => a.CurrentStatus == "adopted")
                .ToListAsync();

            var result = areas.Select(a => new AreaDto
            {
                AreaId = a.AreaId,
                AreaName = a.AreaName,
                AreaType = a.AreaType,
                CurrentStatus = a.CurrentStatus,
                Geometry = System.Text.Json.JsonSerializer.Deserialize<object>(
                    _geoJsonWriter.Write(a.Geom))!
            });

            return Ok(result);
        }

        // POST /api/public/volunteers/register
        [HttpPost("volunteers/register")]
        public async Task<ActionResult> RegisterVolunteer(VolunteerRegistrationDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name) ||
                string.IsNullOrWhiteSpace(dto.EmailAddress) ||
                string.IsNullOrWhiteSpace(dto.RequestedAreaName))
            {
                return BadRequest("Name, email, and requested area are required.");
            }

            var volunteer = new Volunteer
            {
                Name = dto.Name,
                PhoneNo = dto.PhoneNo,
                EmailAddress = dto.EmailAddress,
                Address = dto.Address,
                RequestedAreaName = dto.RequestedAreaName,
                Status = VolunteerStatus.Pending,
                RegistrationDate = DateOnly.FromDateTime(DateTime.UtcNow)
            };

            _context.Volunteers.Add(volunteer);
            await _context.SaveChangesAsync();

            try
            {
                await _emailService.SendNewRegistrationAlertAsync(volunteer);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send registration alert email for volunteer {VolunteerId}", volunteer.VolunteerId);
                // Don't rethrow — registration already succeeded and should still return 200 even if the email fails
            }

            try
            {
                await _emailService.SendRegistrationReceivedAsync(volunteer);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send registration confirmation email for volunteer {VolunteerId}", volunteer.VolunteerId);
                // Don't rethrow — registration already succeeded and should still return 200 even if the email fails
            }

            return Ok(new { message = "Registration submitted. You'll be notified once reviewed." });

        }

    }
}