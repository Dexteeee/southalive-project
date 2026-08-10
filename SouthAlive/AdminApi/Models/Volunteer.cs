namespace AdminApi.Models
{
    public enum VolunteerStatus
    {
        Pending,
        Approved,
        Rejected
    }

    public class Volunteer
    {
        public int VolunteerId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string PhoneNo { get; set; } = string.Empty;
        public string EmailAddress { get; set; } = string.Empty;
        public VolunteerStatus Status { get; set; } = VolunteerStatus.Pending;
        public string RequestedAreaName { get; set; } = string.Empty;
        public DateOnly RegistrationDate { get; set; }
        public DateOnly? ApprovedDate { get; set; }

        public ICollection<Adoption> Adoptions { get; set; } = new List<Adoption>();
    }
}