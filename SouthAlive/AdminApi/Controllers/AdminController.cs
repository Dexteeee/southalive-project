using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace AdminApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        [HttpGet("profile")]
        [Authorize]
        public IActionResult GetProfile()
        {
            return Ok(new
            {
                message = "Authenticated user access granted.",
                user = User.Identity?.Name,
                role = User.Claims.FirstOrDefault(c => c.Type.Contains("role"))?.Value
            });
        }
        
        [HttpGet("super-only")]
        [Authorize(Roles = "SuperAdmin")]
        public IActionResult SuperAdminOnly()
        {
            return Ok(new
            {
                message = "Only SuperAdmin can access this endpoint."
            });
        }
        
        [HttpGet("admin-or-super")]
        [Authorize(Roles = "Admin,SuperAdmin")]
        public IActionResult AdminOrSuperAdmin()
        {
            return Ok(new
            {
                message = "Admin or SuperAdmin access granted."
            });
        }
    }
}