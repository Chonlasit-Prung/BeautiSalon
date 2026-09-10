using Microsoft.EntityFrameworkCore;
using Salon.Api.Models;

namespace Salon.Api.Data;

public class SalonDbContext(DbContextOptions<SalonDbContext> options) : DbContext(options)
{
    public DbSet<Service> Services => Set<Service>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Booking> Bookings => Set<Booking>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Service>(entity =>
        {
            entity.ToTable("services");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.NameTh)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(e => e.NameEn)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(e => e.Description)
                .HasMaxLength(500);

            entity.Property(e => e.MinPrice)
                .HasPrecision(10, 2);

            entity.Property(e => e.MaxPrice)
                .HasPrecision(10, 2);

            entity.Property(e => e.ImageUrl)
                .HasMaxLength(255);

            entity.Property(e => e.IsActive)
                .HasDefaultValue(true);

            entity.HasIndex(e => e.IsActive);

            entity.HasData(
                new Service
                {
                    Id = 1,
                    NameTh = "ตัดผม",
                    NameEn = "Haircut",
                    Description = "ออกแบบทรงผมตามสไตล์ที่คุณชอบ ด้วยช่างผมมืออาชีพ",
                    MinPrice = 300,
                    MaxPrice = 300,
                    DurationMinutes = 45,
                    ImageUrl = "/images/haircut.svg",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Service
                {
                    Id = 2,
                    NameTh = "ทำสีผม",
                    NameEn = "Hair Coloring",
                    Description = "เปลี่ยนลุคใหม่ด้วยสีผมออร์แกนิค ถนอมเส้นผมและหนังศีรษะ",
                    MinPrice = 1500,
                    MaxPrice = 2500,
                    DurationMinutes = 120,
                    ImageUrl = "/images/hair-coloring.svg",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Service
                {
                    Id = 3,
                    NameTh = "ทรีทเม้นท์บำรุงผม",
                    NameEn = "Hair Treatment",
                    Description = "ฟื้นฟูผมเสียให้กลับมานุ่มสลวย เงางาม",
                    MinPrice = 800,
                    MaxPrice = 800,
                    DurationMinutes = 60,
                    ImageUrl = "/images/hair-treatment.svg",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Service
                {
                    Id = 4,
                    NameTh = "เพ้นท์เล็บเจล",
                    NameEn = "Nail Art",
                    Description = "ออกแบบลายเล็บสวยๆ ด้วยเจลคุณภาพ สีสดใสติดทน",
                    MinPrice = 500,
                    MaxPrice = 500,
                    DurationMinutes = 90,
                    ImageUrl = "/images/nail-art.svg",
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc)
                });
        });

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.ToTable("customers");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Name)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(e => e.PhoneNumber)
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(e => e.Email)
                .HasMaxLength(100);
        });

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.ToTable("bookings");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.BookingCode)
                .HasMaxLength(20)
                .IsRequired();

            entity.HasIndex(e => e.BookingCode)
                .IsUnique();

            entity.HasOne(e => e.Customer)
                .WithMany()
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Service)
                .WithMany()
                .HasForeignKey(e => e.ServiceId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.Property(e => e.Status)
                .HasDefaultValueSql("'pending'")
                .HasSentinel(BookingStatus.Pending);

            entity.Property(e => e.Price)
                .HasPrecision(10, 2);

            entity.HasIndex(e => new { e.BookingDate, e.Status });
        });
    }
}