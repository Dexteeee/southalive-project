namespace AdminApi.Models
{
    public class AdoptionUpdate
    {
        public int UpdateId { get; set; }
        public int AdoptionId { get; set; }
        public Adoption Adoption { get; set; } = null!;
        public int LogYear { get; set; }
        public string? Notes { get; set; }
    }
}