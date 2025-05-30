using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RealEstateHubAPI.Migrations
{
    /// <inheritdoc />
    public partial class updatepriceunit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PriceUnit",
                table: "Posts",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PriceUnit",
                table: "Posts");
        }
    }
}
