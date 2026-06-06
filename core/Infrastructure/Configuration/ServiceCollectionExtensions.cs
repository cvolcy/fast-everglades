using Azure;
using Azure.AI.Inference;
using Microsoft.Extensions.AI;

namespace fast_everglades.Infrastructure.Configuration
{
    internal static class ServiceCollectionExtensions
    {
        public static IServiceCollection ConfigureLLM(this IServiceCollection services, IConfiguration configuration)
        {
            services.Configure<ChatClientSettings>(configuration.GetSection(nameof(ChatClientSettings)));

            var chatClientSettings = configuration
                .GetSection(nameof(ChatClientSettings))
                .Get<ChatClientSettings>() ?? throw new InvalidOperationException("ChatClientSettings is missing or invalid.");
            services.Configure<ChatClientSettings>(configuration.GetSection(nameof(ChatClientSettings)));

            var chatCompletionsClient = new ChatCompletionsClient(
                endpoint: new Uri(chatClientSettings.ChatCompletionsUri),
                new AzureKeyCredential(chatClientSettings.GithubToken)
            );

            var openAiClient = new ChatClientBuilder(
                    chatCompletionsClient.AsIChatClient(chatClientSettings.ChatCompletionsModel))
                .Build();

            services.AddChatClient(openAiClient);

            return services;
        }
    }
}
