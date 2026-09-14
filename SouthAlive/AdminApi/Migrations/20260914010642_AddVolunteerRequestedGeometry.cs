using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AdminApi.Migrations
{
    /// <inheritdoc />
    public partial class AddVolunteerRequestedGeometry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RequestedAreaType",
                table: "Volunteers",
                type: "text",
                nullable: false,
                defaultValue: "street");

            migrationBuilder.AddColumn<string>(
                name: "RequestedGeometryGeoJson",
                table: "Volunteers",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RequestedAreaType",
                table: "Volunteers");

            migrationBuilder.DropColumn(
                name: "RequestedGeometryGeoJson",
                table: "Volunteers");
        }
    }
}
