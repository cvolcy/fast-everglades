using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using System.Net;

namespace fast_everglades
{
    public class Proxies
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<Proxies> _logger;

        // Inject HttpClient via Dependency Injection for performance and socket reuse
        public Proxies(IHttpClientFactory httpClientFactory, ILogger<Proxies> logger)
        {
            _httpClient = httpClientFactory.CreateClient();
            _logger = logger;
        }

        #region Node.js Microservice Proxies (fast-everglades-node)

        [Function("Proxy_NodeDate")]
        public async Task<HttpResponseData> ProxyNodeDate(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "date")] HttpRequestData req)
        {
            return await ForwardRequest(req, "https://fast-everglades-node.azurewebsites.net/api/date");
        }

        [Function("Proxy_NodeVideos")]
        public async Task<HttpResponseData> ProxyNodeVideos(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "videos")] HttpRequestData req)
        {
            return await ForwardRequest(req, "https://fast-everglades-node.azurewebsites.net/api/videos");
        }

        [Function("Proxy_NodeGraphQL")]
        public async Task<HttpResponseData> ProxyNodeGraphQL(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = "graphql")] HttpRequestData req)
        {
            return await ForwardRequest(req, "https://fast-everglades-node.azurewebsites.net/api/graphql");
        }

        #endregion

        #region Python Microservice Proxies (fast-everglades-py)

        [Function("Proxy_PyCowsay")]
        public async Task<HttpResponseData> ProxyPyCowsay(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "cowsay")] HttpRequestData req)
        {
            return await ForwardRequest(req, "https://fast-everglades-py.azurewebsites.net/api/cowsay");
        }

        [Function("Proxy_PyDetection")]
        public async Task<HttpResponseData> ProxyPyDetection(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options", Route = "detection")] HttpRequestData req)
        {
            return await ForwardRequest(req, "https://fast-everglades-py.azurewebsites.net/api/detection");
        }

        #endregion

        // Reusable core logic to handle the heavy lifting of proxying
        private async Task<HttpResponseData> ForwardRequest(HttpRequestData incomingRequest, string backendUrl)
        {
            try
            {
                _logger.LogInformation("Proxying request to backend: {backendUrl}", backendUrl);

                // 1. Build out the outgoing HTTP message
                var outgoingMessage = new HttpRequestMessage(new HttpMethod(incomingRequest.Method), backendUrl);

                // Copy over incoming body if it exists (for POST requests)
                if (incomingRequest.Method == "POST" && incomingRequest.Body != Stream.Null)
                {
                    // Copy body safely without loading everything into memory at once
                    outgoingMessage.Content = new StreamContent(incomingRequest.Body);

                    // Transfer Content-Type header if it exists
                    if (incomingRequest.Headers.TryGetValues("Content-Type", out var contentTypes))
                    {
                        outgoingMessage.Content.Headers.TryAddWithoutValidation("Content-Type", contentTypes);
                    }
                }

                // Copy other crucial headers (like Authorization, User-Agent, etc.)
                foreach (var header in incomingRequest.Headers)
                {
                    if (!header.Key.Equals("Host", StringComparison.OrdinalIgnoreCase) &&
                        !header.Key.Equals("Content-Type", StringComparison.OrdinalIgnoreCase))
                    {
                        outgoingMessage.Headers.TryAddWithoutValidation(header.Key, header.Value);
                    }
                }

                // 2. Fire request off to the destination backend microservice
                var backendResponse = await _httpClient.SendAsync(outgoingMessage, HttpCompletionOption.ResponseHeadersRead);

                // 3. Map the backend response back to the Azure Functions response payload
                var functionResponse = incomingRequest.CreateResponse((HttpStatusCode)backendResponse.StatusCode);

                await backendResponse.Content.CopyToAsync(functionResponse.Body);

                // Map response headers back to client
                foreach (var header in backendResponse.Headers)
                {
                    functionResponse.Headers.Add(header.Key, header.Value);
                }
                foreach (var header in backendResponse.Content.Headers)
                {
                    functionResponse.Headers.Add(header.Key, header.Value);
                }

                return functionResponse;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to proxy request to {backendUrl}", backendUrl);
                return incomingRequest.CreateResponse(HttpStatusCode.BadGateway);
            }
        }
    }
}
