using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SecurePortal.Domain.Entities;

namespace SecurePortal.Infrastructure.Persistence.Configurations;

public class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> builder)
    {
        builder.ToTable("Documents");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.FileName)
            .IsRequired()
            .HasMaxLength(260);

        builder.Property(d => d.ContentType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(d => d.StoragePath)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(d => d.HashSha256)
            .IsRequired()
            .HasMaxLength(64);

        builder.HasIndex(d => d.UploadedByUserId);
        builder.HasIndex(d => d.HashSha256);

        builder.HasOne(d => d.UploadedByUser)
            .WithMany(u => u.UploadedDocuments)
            .HasForeignKey(d => d.UploadedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Global Query Filter for Soft Delete
        builder.HasQueryFilter(d => !d.IsDeleted);
    }
}
