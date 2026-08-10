namespace AdminApi.DTOs
{
    public class ApproveVolunteerDto //what the admin submits when approving a volunteer
    {
        public string AreaName { get; set; } = string.Empty;
        public string AreaType { get; set; } = string.Empty; // "street" or "zone"
        public string GeometryGeoJson { get; set; } = string.Empty; // raw GeoJSON string from Leaflet.draw
    }
}