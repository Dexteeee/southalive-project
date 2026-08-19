// DTOs/AdoptionUpdateDto.cs
namespace AdminApi.DTOs
{
    public class AdoptionUpdateDto
    {
        public int UpdateId { get; set; }
        public int AdoptionId { get; set; }
        public int LogYear { get; set; }
        public string? Notes { get; set; }
    }

    public class CreateAdoptionUpdateDto
    {
        public int LogYear { get; set; }
        public string? Notes { get; set; }
    }
}