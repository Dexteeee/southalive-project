using NetTopologySuite.Geometries;

namespace AdminApi.Models
{
    public class Area
    {
        public int AreaId { get; set; }
        public string AreaName { get; set; } = string.Empty;
        public string AreaType { get; set; } = "street";
        public Geometry Geom { get; set; } = null!;
        public string CurrentStatus { get; set; } = "adopted";

        public ICollection<Adoption> Adoptions { get; set; } = new List<Adoption>();
    }
}