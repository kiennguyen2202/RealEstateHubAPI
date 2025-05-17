using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RealEstateHubAPI.Migrations
{
    /// <inheritdoc />
    public partial class z : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PostImages_Posts_PostId1",
                table: "PostImages");

            migrationBuilder.DropIndex(
                name: "IX_PostImages_PostId1",
                table: "PostImages");

            migrationBuilder.DropColumn(
                name: "PostId1",
                table: "PostImages");

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "Posts",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)")
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "PostImages",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)")
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.CreateIndex(
                name: "IX_PostImages_PostId",
                table: "PostImages",
                column: "PostId");

            migrationBuilder.AddForeignKey(
                name: "FK_PostImages_Posts_PostId",
                table: "PostImages",
                column: "PostId",
                principalTable: "Posts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PostImages_Posts_PostId",
                table: "PostImages");

            migrationBuilder.DropIndex(
                name: "IX_PostImages_PostId",
                table: "PostImages");

            migrationBuilder.AlterColumn<string>(
                name: "Id",
                table: "Posts",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AlterColumn<string>(
                name: "Id",
                table: "PostImages",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int")
                .OldAnnotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddColumn<string>(
                name: "PostId1",
                table: "PostImages",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PostImages_PostId1",
                table: "PostImages",
                column: "PostId1");

            migrationBuilder.AddForeignKey(
                name: "FK_PostImages_Posts_PostId1",
                table: "PostImages",
                column: "PostId1",
                principalTable: "Posts",
                principalColumn: "Id");
        }
    }
}
