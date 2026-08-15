using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AdminApi.Models;

namespace AdminApi.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
        {
        }
        public DbSet<Admin> Admins => Set<Admin>();
        public DbSet<Volunteer> Volunteers => Set<Volunteer>();
        public DbSet<Area> Areas => Set<Area>();
        public DbSet<Adoption> Adoptions => Set<Adoption>();
        public DbSet<AdoptionUpdate> AdoptionUpdates => Set<AdoptionUpdate>();
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<Admin>(entity =>
            {
                entity.HasKey(a => a.Id);
                entity.HasIndex(a => a.Username).IsUnique();
                entity.HasIndex(a => a.Email).IsUnique();
                entity.Property(a => a.Username)
                    .IsRequired()
                    .HasMaxLength(100);
                entity.Property(a => a.Email)
                    .IsRequired()
                    .HasMaxLength(150);
                entity.Property(a => a.PasswordHash)
                    .IsRequired();
                entity.Property(a => a.Role)
                    .IsRequired()
                    .HasMaxLength(50);
            });
            modelBuilder.Entity<Volunteer>(entity =>
            {
                entity.HasKey(v => v.VolunteerId);
                entity.Property(v => v.Name)
                    .IsRequired()
                    .HasMaxLength(150);
                entity.Property(v => v.PhoneNo)
                    .IsRequired()
                    .HasMaxLength(30);
                entity.Property(v => v.EmailAddress)
                    .IsRequired()
                    .HasMaxLength(150);
                entity.Property(v => v.Address)
                    .HasMaxLength(250);
                entity.Property(v => v.Status)
                    .HasConversion<string>()
                    .IsRequired();
                entity.Property(v => v.RequestedAreaName)
                    .IsRequired()
                    .HasMaxLength(200);
                entity.Property(v => v.RegistrationDate)
                    .HasDefaultValueSql("CURRENT_DATE")
                    .IsRequired();
                entity.Property(v => v.ApprovedDate)
                    .IsRequired(false); // nullable — only set on approval
            });

            modelBuilder.Entity<Area>(entity =>
            {
                entity.HasKey(a => a.AreaId);
                entity.Property(a => a.AreaName)
                    .IsRequired()
                    .HasMaxLength(200);
                entity.Property(a => a.AreaType)
                    .IsRequired()
                    .HasMaxLength(20);
                entity.Property(a => a.Geom)
                    .IsRequired();
                entity.Property(a => a.CurrentStatus)
                    .IsRequired()
                    .HasMaxLength(30);
            });

            modelBuilder.Entity<Adoption>(entity =>
            {
                entity.HasKey(a => a.AdoptionId);
                entity.Property(a => a.StartDate)
                    .HasDefaultValueSql("CURRENT_DATE")
                    .IsRequired();
                entity.Property(a => a.EndDate)
                    .IsRequired(false);
                entity.Property(a => a.IsActive)
                    .HasDefaultValue(true)
                    .IsRequired();

                entity.HasOne(a => a.Area)
                    .WithMany(ar => ar.Adoptions)
                    .HasForeignKey(a => a.AreaId)
                    .OnDelete(DeleteBehavior.Restrict); // don't cascade-delete adoptions if an area is removed

                entity.HasOne(a => a.Volunteer)
                    .WithMany(v => v.Adoptions)
                    .HasForeignKey(a => a.VolunteerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<AdoptionUpdate>(entity =>
            {
                entity.HasKey(u => u.UpdateId);
                entity.Property(u => u.LogYear)
                    .IsRequired();
                entity.Property(u => u.Notes)
                    .HasMaxLength(1000);

                entity.HasOne(u => u.Adoption)
                    .WithMany(a => a.Updates)
                    .HasForeignKey(u => u.AdoptionId)
                    .OnDelete(DeleteBehavior.Cascade); // if an adoption is deleted, its update logs go with it
            });
        }
    }
}