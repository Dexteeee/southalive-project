using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.IO;
using AdminApi.Data;
using AdminApi.DTOs;

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
    }
}