using System;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using MimeTypes;

namespace fast_everglades
{
    public class StaticFile
    {
        public static readonly string STATIC_FILES_FOLDER = "www";
        public static readonly string DEFAULT_PAGE = string.IsNullOrEmpty(GetEnvironmentVariable("DEFAULT_PAGE")) ? 
                "index.html" : GetEnvironmentVariable("DEFAULT_PAGE");

        private readonly ILogger<StaticFile> _logger;

        public StaticFile(ILogger<StaticFile> logger)
        {
            _logger = logger;
        }

        [Function("staticFile")]
        public HttpResponseData Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = null)] HttpRequestData req,
            FunctionContext context)
        {
            _logger.LogInformation("C# HTTP trigger function processed a request.");
            _logger.LogInformation("Rendering Static File");

            try
            {
                var filePath = GetFilePath(req, context);

                _logger.LogInformation($"Rendering static file for {filePath}");

                var response = req.CreateResponse(HttpStatusCode.OK);
                var stream = new FileStream(filePath, FileMode.Open);
                response.Body = stream;
                response.Headers.Add("Content-Type", GetMimeType(filePath));
                return response;
            }
            catch
            {
                return req.CreateResponse(HttpStatusCode.NotFound);
            }
        }

        [Function("root")]
        public IActionResult Root(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "/")]
            HttpRequest req)
        {
            return new RedirectResult("/api/staticFile?file=Views/index.html");
        }

        [Function("bring-umbrella")]
        public IActionResult BringUmbrella(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "/bring-umbrella")]
            HttpRequest req)
        {
            return new RedirectResult("/api/staticFile?file=Views/umbrella.html");
        }

        [Function("emotion-recognition")]
        public IActionResult EmotionRecognition(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "/emotion-recognition")]
            HttpRequest req)
        {
            return new RedirectResult("/api/staticFile?file=Views/emotions.html");
        }

        [Function("detection")]
        public IActionResult Detection(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "/detection")]
            HttpRequest req)
        {
            return new RedirectResult("/api/staticFile?file=Views/detection.html");
        }

        [Function("files")]
        public IActionResult Files(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "{*path}")]
            HttpRequest req,
            string path)
        {
            return new RedirectResult($"/api/staticFile?file={path}");
        }

        private static string GetEnvironmentVariable(string name) =>
            Environment.GetEnvironmentVariable(name, EnvironmentVariableTarget.Process) ?? string.Empty;

        private static string GetFilePath(HttpRequestData req, FunctionContext context)
        {
            var path = req.Query.ContainsKey("file") ? req.Query["file"] : null;

            if (string.IsNullOrEmpty(path))
            {
                throw new ArgumentException("Missing file parameter");
            }

            var functionAppDirectory = context.FunctionDefinition.Properties["functionAppDirectory"].ToString();
            var staticFilesPath =
                Path.GetFullPath(Path.Combine(functionAppDirectory, STATIC_FILES_FOLDER));
            var fullPath = Path.GetFullPath(Path.Combine(staticFilesPath, path));

            if (!IsInDirectory(staticFilesPath, fullPath))
            {
                throw new ArgumentException("Invalid path");
            }

            var isDirectory = Directory.Exists(fullPath);
            if (isDirectory)
            {
                fullPath = Path.Combine(fullPath, DEFAULT_PAGE);
            }

            return fullPath;
        }

        private static bool IsInDirectory(string parentPath, string childPath)
        {
            var parent = new DirectoryInfo(parentPath);
            var child = new DirectoryInfo(childPath);

            var dir = child;
            do
            {
                if (dir.FullName == parent.FullName)
                {
                    return true;
                }
                dir = dir.Parent;
            } while (dir != null);

            return false;
        }

        private static string GetMimeType(string filePath)
        {
            var fileInfo = new FileInfo(filePath);
            return MimeTypeMap.GetMimeType(fileInfo.Extension);
        }
    }
}
