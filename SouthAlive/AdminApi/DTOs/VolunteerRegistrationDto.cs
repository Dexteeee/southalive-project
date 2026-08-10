namespace AdminApi.DTOs
{
    public class VolunteerRegistrationDto //what the public registration form submits
    {
        public string Name { get; set; } = string.Empty;
        public string PhoneNo { get; set; } = string.Empty;
        public string EmailAddress { get; set; } = string.Empty;
        public string RequestedAreaName { get; set; } = string.Empty;
    }
}