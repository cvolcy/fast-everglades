using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using System.Net;
using System.Net.Http.Headers;

namespace fast_everglades
{
    public class Proxies
    {
        private readonly ILogger<Proxies> _logger;

        public Proxies(ILogger<Proxies> logger)
        {
            _logger = logger;
        }

        [Function("Redirect_NodeDate")]
        public HttpResponseData RedirectNodeDate(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/date")] HttpRequestData req)
        {
            return BuildRedirect(req, "https://fast-everglades-node.azurewebsites.net/api/date");
        }

        [Function("Redirect_NodeVideos")]
        public HttpResponseData RedirectNodeVideos(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/videos")] HttpRequestData req)
        {
            return BuildRedirect(req, "https://fast-everglades-node.azurewebsites.net/api/videos");
        }

        [Function("Redirect_NodeGraphQL")]
        public HttpResponseData RedirectNodeGraphQL(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = "api/graphql")] HttpRequestData req)
        {
            return BuildRedirect(req, "https://fast-everglades-node.azurewebsites.net/api/graphql");
        }

        [Function("Redirect_PyCowsay")]
        public HttpResponseData RedirectPyCowsay(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/cowsay")] HttpRequestData req)
        {
            return BuildRedirect(req, "https://fast-everglades-py.azurewebsites.net/api/cowsay");
        }

        [Function("Redirect_PyDetection")]
        public HttpResponseData RedirectPyDetection(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options", Route = "api/detection")] HttpRequestData req)
        {
            return BuildRedirect(req, "https://fast-everglades-py.azurewebsites.net/api/detection");
        }

        private HttpResponseData BuildRedirect(HttpRequestData req, string targetUrl)
        {
            string queryString = req.Url.Query; 
            
            string destinationWithQuery = targetUrl + queryString;

            _logger.LogInformation("Redirecting request to: {destinationWithQuery}", destinationWithQuery);
            
            var response = req.CreateResponse(HttpStatusCode.RedirectKeepVerb);
            response.Headers.Add("Location", destinationWithQuery);
            
            return response;
        }
    }
}
