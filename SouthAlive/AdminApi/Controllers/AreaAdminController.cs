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
    [Route("api/admin/areas")]
    [Authorize]
    public class AreaAdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly GeoJsonWriter _geoJsonWriter = new();

        public AreaAdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET /api/admin/areas
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AreaAdminDto>>> GetAreas()
        {
            var areas = await _context.Areas
                .Where(a => a.CurrentStatus == "adopted")
                .Include(a => a.Adoptions.Where(ad => ad.IsActive))
                    .ThenInclude(ad => ad.Volunteer)
                .ToListAsync();

            var result = areas.Select(a =>
            {
                var activeAdoption = a.Adoptions.FirstOrDefault(ad => ad.IsActive);
                return new AreaAdminDto
                {
                    AreaId = a.AreaId,
                    AreaName = a.AreaName,
                    AreaType = a.AreaType,
                    CurrentStatus = a.CurrentStatus,
                    Geometry = System.Text.Json.JsonSerializer.Deserialize<object>(
                        _geoJsonWriter.Write(a.Geom))!,
                    VolunteerId = activeAdoption?.VolunteerId,
                    VolunteerName = activeAdoption?.Volunteer?.Name,
                    VolunteerEmail = activeAdoption?.Volunteer?.EmailAddress,
                    StartDate = activeAdoption?.StartDate
                };
            });

            return Ok(result);
        }
// GET /api/admin/areas/ended
        [HttpGet("ended")]
        public async Task<ActionResult<IEnumerable<AreaAdminDto>>> GetEndedAdoptions()
        {
            var endedAdoptions = await _context.Adoptions
                .Where(ad => !ad.IsActive)
                .Include(ad => ad.Area)
                .Include(ad => ad.Volunteer)
                .OrderByDescending(ad => ad.EndDate)
                .ToListAsync();

            var result = endedAdoptions.Select(ad => new AreaAdminDto
            {
                AreaId = ad.Area.AreaId,
                AreaName = ad.Area.AreaName,
                AreaType = ad.Area.AreaType,
                CurrentStatus = ad.Area.CurrentStatus,
                Geometry = System.Text.Json.JsonSerializer.Deserialize<object>(
                    _geoJsonWriter.Write(ad.Area.Geom))!,
                VolunteerId = ad.VolunteerId,
                VolunteerName = ad.Volunteer.Name,
                VolunteerEmail = ad.Volunteer.EmailAddress,
                StartDate = ad.StartDate,
                EndDate = ad.EndDate
            });

            return Ok(result);
        }

        // GET /api/admin/areas/{areaId}/updates
        [HttpGet("{areaId}/updates")]
        public async Task<ActionResult<IEnumerable<AdoptionUpdateDto>>> GetUpdates(int areaId)
        {
            var updates = await _context.AdoptionUpdates
                .Where(u => u.Adoption.AreaId == areaId)
                .OrderByDescending(u => u.LogYear)
                .Select(u => new AdoptionUpdateDto
                {
                    UpdateId = u.UpdateId,
                    AdoptionId = u.AdoptionId,
                    LogYear = u.LogYear,
                    Notes = u.Notes
                })
                .ToListAsync();

            return Ok(updates);
        }

        // POST /api/admin/areas/{areaId}/updates
        [HttpPost("{areaId}/updates")]
        public async Task<ActionResult> AddUpdate(int areaId, CreateAdoptionUpdateDto dto)
        {
            var activeAdoption = await _context.Adoptions
                .FirstOrDefaultAsync(a => a.AreaId == areaId && a.IsActive);

            if (activeAdoption == null)
                return BadRequest("No active adoption found for this area.");

            var update = new AdoptionUpdate
            {
                AdoptionId = activeAdoption.AdoptionId,
                LogYear = dto.LogYear,
                Notes = dto.Notes
            };
            _context.AdoptionUpdates.Add(update);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Update logged." });
        }


        // PATCH /api/admin/areas/{id}/end-adoption
        [HttpPatch("{id}/end-adoption")]
        public async Task<ActionResult> EndAdoption(int id)
        {
            var area = await _context.Areas
                .Include(a => a.Adoptions.Where(ad => ad.IsActive))
                .FirstOrDefaultAsync(a => a.AreaId == id);

            if (area == null) return NotFound();

            var activeAdoption = area.Adoptions.FirstOrDefault(ad => ad.IsActive);
            if (activeAdoption == null)
                return BadRequest("This area has no active adoption to end.");

            activeAdoption.IsActive = false;
            activeAdoption.EndDate = DateOnly.FromDateTime(DateTime.UtcNow);
            area.CurrentStatus = "available";

            await _context.SaveChangesAsync();
            return Ok(new { message = "Adoption ended. Area is now available for re-adoption." });
        }
    }
}