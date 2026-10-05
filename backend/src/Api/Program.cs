using SecurePortal.Application;
using SecurePortal.Infrastructure;
using SecurePortal.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Add Application & Infrastructure Services
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

builder.Services.AddControllers();

var app = builder.Build();

// Initialise and Seed Database
using (var scope = app.Services.CreateScope())
{
    var initialiser = scope.ServiceProvider.GetRequiredService<AppDbContextInitialiser>();
    await initialiser.InitialiseAsync();
    await initialiser.SeedAsync();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
