using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Salon.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateServiceImages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "services",
                keyColumn: "Id",
                keyValue: 1,
                column: "ImageUrl",
                value: "/images/haircut.svg");

            migrationBuilder.UpdateData(
                table: "services",
                keyColumn: "Id",
                keyValue: 2,
                column: "ImageUrl",
                value: "/images/hair-coloring.svg");

            migrationBuilder.UpdateData(
                table: "services",
                keyColumn: "Id",
                keyValue: 3,
                column: "ImageUrl",
                value: "/images/hair-treatment.svg");

            migrationBuilder.UpdateData(
                table: "services",
                keyColumn: "Id",
                keyValue: 4,
                column: "ImageUrl",
                value: "/images/nail-art.svg");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "services",
                keyColumn: "Id",
                keyValue: 1,
                column: "ImageUrl",
                value: "/images/haircut.jpg");

            migrationBuilder.UpdateData(
                table: "services",
                keyColumn: "Id",
                keyValue: 2,
                column: "ImageUrl",
                value: "/images/hair-coloring.jpg");

            migrationBuilder.UpdateData(
                table: "services",
                keyColumn: "Id",
                keyValue: 3,
                column: "ImageUrl",
                value: "/images/hair-treatment.jpg");

            migrationBuilder.UpdateData(
                table: "services",
                keyColumn: "Id",
                keyValue: 4,
                column: "ImageUrl",
                value: "/images/nail-art.jpg");
        }
    }
}
