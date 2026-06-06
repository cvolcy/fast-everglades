namespace fast_everglades.Infrastructure.Configuration
{
    /// <summary>
    /// Represents configuration settings required to connect to a chat completions service, including model selection,
    /// service endpoint, and authentication credentials.
    /// </summary>
    public class ChatClientSettings
    {
        /// <summary>
        /// Gets or sets the model name used for chat completions
        /// when interacting with the primary AI provider (OpenAI).
        /// </summary>
        public required string ChatCompletionsModel { get; set; }
        /// <summary>
        /// Gets or sets the endpoint URI for the chat completions service
        /// (e.g., OpenAI or Azure-hosted endpoint).
        /// </summary>
        public required string ChatCompletionsUri { get; set; }
        /// <summary>
        /// Gets or sets the GitHub token or API key used for authentication
        /// with the chat completions service.
        /// </summary>
        public required string GithubToken { get; set; }
    }
}
