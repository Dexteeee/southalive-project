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
    }
    }
}