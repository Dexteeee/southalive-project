using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.IO;
using AdminApi.Data;
using AdminApi.DTOs;
using AdminApi.Models;

namespace AdminApi.Controllers
{
    [ApiController]
    [Route("api/admin/[controller]")]
    [Authorize]
    public class VolunteerAdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;
        private readonly ILogger<VolunteerAdminController> _logger;
        private readonly GeoJsonReader _geoJsonReader = new();

        public VolunteerAdminController(ApplicationDbContext context, IEmailService emailService, ILogger<VolunteerAdminController> logger)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
        }
        

        // GET /api/admin/volunteeradmin 
        [HttpGet]
        public async Task<ActionResult<IEnumerable<VolunteerDto>>> GetVolunteers([FromQuery] string? status)
        {
            var query = _context.Volunteers.AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(v => v.Status.ToString() == status);
            }

            var volunteers = await query
                .OrderBy(v => v.RegistrationDate)
                .Select(v => new VolunteerDto
                {
                    VolunteerId = v.VolunteerId,
                    Name = v.Name,
                    PhoneNo = v.PhoneNo,
                    EmailAddress = v.EmailAddress,
                    Address = v.Address,
                    Status = v.Status.ToString(),
                    RequestedAreaName = v.RequestedAreaName,
                    RegistrationDate = v.RegistrationDate,
                    ApprovedDate = v.ApprovedDate
                })
                .ToListAsync();

            return Ok(volunteers);
        }

        // PATCH /api/admin/volunteeradmin/{id}/approve
        [HttpPatch("{id}/approve")]
        public async Task<ActionResult> ApproveVolunteer(int id, ApproveVolunteerDto dto)
        {
            var volunteer = await _context.Volunteers.FindAsync(id);
            if (volunteer == null) return NotFound();
            if (volunteer.Status != VolunteerStatus.Pending)
                return BadRequest("Only pending registrations can be approved.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var geometry = _geoJsonReader.Read<NetTopologySuite.Geometries.Geometry>(dto.GeometryGeoJson);

                var area = new Area
                {
                    AreaName = dto.AreaName,
                    AreaType = dto.AreaType,
                    Geom = geometry,
                    CurrentStatus = "adopted"
                };
                _context.Areas.Add(area);
                await _context.SaveChangesAsync();

                var adoption = new Adoption
                {
                    AreaId = area.AreaId,
                    VolunteerId = volunteer.VolunteerId,
                    StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
                    IsActive = true
                };
                _context.Adoptions.Add(adoption);

                volunteer.Status = VolunteerStatus.Approved;
                volunteer.ApprovedDate = DateOnly.FromDateTime(DateTime.UtcNow);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                try
                {
                    await _emailService.SendApprovalConfirmationAsync(volunteer, area);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to send approval confirmation email for volunteer {VolunteerId}", volunteer.VolunteerId);
                    // Don't rethrow — approval already succeeded and should still return 200 even if the email fails
                }
                return Ok(new { message = "Volunteer approved and area created." });
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // PATCH /api/admin/volunteeradmin/{id}/reject
        [HttpPatch("{id}/reject")]
        public async Task<ActionResult> RejectVolunteer(int id)
        {
            var volunteer = await _context.Volunteers.FindAsync(id);
            if (volunteer == null) return NotFound();
            if (volunteer.Status != VolunteerStatus.Pending)
                return BadRequest("Only pending registrations can be rejected.");

            volunteer.Status = VolunteerStatus.Rejected;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Volunteer rejected." });
        }

        // PATCH /api/admin/volunteeradmin/{id}
        [HttpPatch("{id}")]
        public async Task<ActionResult> UpdateVolunteer(int id, UpdateVolunteerDto dto)
        {
            var volunteer = await _context.Volunteers.FindAsync(id);
            if (volunteer == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(dto.Name)) volunteer.Name = dto.Name;
            if (!string.IsNullOrWhiteSpace(dto.PhoneNo)) volunteer.PhoneNo = dto.PhoneNo;
            if (!string.IsNullOrWhiteSpace(dto.EmailAddress)) volunteer.EmailAddress = dto.EmailAddress;
            if (!string.IsNullOrWhiteSpace(dto.Address)) volunteer.Address = dto.Address;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Volunteer updated." });
        }

        // DELETE /api/admin/volunteeradmin/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteVolunteer(int id)
        {
            var volunteer = await _context.Volunteers
                .Include(v => v.Adoptions)
                .FirstOrDefaultAsync(v => v.VolunteerId == id);

            if (volunteer == null) return NotFound();

            if (volunteer.Adoptions.Any())
            {
                return BadRequest(new
                {
                    message = "Cannot delete a volunteer with adoption history. This volunteer was approved and has an associated area record."
                });
            }

            _context.Volunteers.Remove(volunteer);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Volunteer deleted." });
        }
    }
}