namespace AdminApi.DTOs
{
    public class VolunteerDto //what the admin dashboard sees(includes PII, admin-only)
    {
        public int VolunteerId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string PhoneNo { get; set; } = string.Empty;
        public string EmailAddress { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string Status { get; set; } = string.Empty;
        public string RequestedAreaName { get; set; } = string.Empty;
        public DateOnly RegistrationDate { get; set; }
        public DateOnly? ApprovedDate { get; set; }
    }
}