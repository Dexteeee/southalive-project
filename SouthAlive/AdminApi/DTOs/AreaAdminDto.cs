namespace AdminApi.DTOs
{
    public class AreaAdminDto
    {
        public int AreaId { get; set; }
        public string AreaName { get; set; } = string.Empty;
        public string AreaType { get; set; } = string.Empty;
        public string CurrentStatus { get; set; } = string.Empty;
        public object Geometry { get; set; } = null!;
        public int? VolunteerId { get; set; }
        public string? VolunteerName { get; set; }
        public string? VolunteerEmail { get; set; }
        public DateOnly? StartDate { get; set; }
        public DateOnly? EndDate { get; set; }
    }
}