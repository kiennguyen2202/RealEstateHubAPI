using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RealEstateHubAPI.Migrations
{
    /// <inheritdoc />
    public partial class azzz : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Name",
                table: "Areas");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Areas",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
