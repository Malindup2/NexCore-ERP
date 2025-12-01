using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Serilog;
using Serilog.Events;

namespace Shared.Logging
{
    public static class LoggingExtensions
    {
        public static ILoggingBuilder AddSerilogLogging(this ILoggingBuilder builder)
        {
            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
                .Enrich.FromLogContext()
                .WriteTo.Console()
                .CreateLogger();

            builder.ClearProviders();
            builder.AddSerilog();

            return builder;
        }
    }
}
