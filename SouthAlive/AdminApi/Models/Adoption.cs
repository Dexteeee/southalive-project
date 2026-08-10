namespace AdminApi.Models
{
    public class Adoption
    {
        public int AdoptionId { get; set; }
        public int AreaId { get; set; }
        public Area Area { get; set; } = null!;
        public int VolunteerId { get; set; }
        public Volunteer Volunteer { get; set; } = null!;
        public DateOnly StartDate { get; set; }
        public DateOnly? EndDate { get; set; }
        public bool IsActive { get; set; } = true;

        public ICollection<AdoptionUpdate> Updates { get; set; } = new List<AdoptionUpdate>();
    }
}