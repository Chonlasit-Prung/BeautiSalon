using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Salon.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitServices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "services",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NameTh = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    NameEn = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    MinPrice = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    MaxPrice = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_services", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "services",
                columns: new[] { "Id", "CreatedAt", "Description", "DurationMinutes", "ImageUrl", "IsActive", "MaxPrice", "MinPrice", "NameEn", "NameTh", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 9, 1, 0, 0, 0, 0, DateTimeKind.Utc), "ออกแบบทรงผมตามสไตล์ที่คุณชอบ ด้วยช่างผมมืออาชีพ", 45, "/images/haircut.jpg", true, 300m, 300m, "Haircut", "ตัดผม", null },
                    { 2, new DateTime(2026, 9, 1, 0, 0, 0, 0, DateTimeKind.Utc), "เปลี่ยนลุคใหม่ด้วยสีผมออร์แกนิค ถนอมเส้นผมและหนังศีรษะ", 120, "/images/hair-coloring.jpg", true, 2500m, 1500m, "Hair Coloring", "ทำสีผม", null },
                    { 3, new DateTime(2026, 9, 1, 0, 0, 0, 0, DateTimeKind.Utc), "ฟื้นฟูผมเสียให้กลับมานุ่มสลวย เงางาม", 60, "/images/hair-treatment.jpg", true, 800m, 800m, "Hair Treatment", "ทรีทเม้นท์บำรุงผม", null },
                    { 4, new DateTime(2026, 9, 1, 0, 0, 0, 0, DateTimeKind.Utc), "ออกแบบลายเล็บสวยๆ ด้วยเจลคุณภาพ สีสดใสติดทน", 90, "/images/nail-art.jpg", true, 500m, 500m, "Nail Art", "เพ้นท์เล็บเจล", null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_services_IsActive",
                table: "services",
                column: "IsActive");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "services");
        }
    }
}
