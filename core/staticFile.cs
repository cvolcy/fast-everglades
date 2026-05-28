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
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = null)] HttpRequestData req)
        {
            _logger.LogInformation("C# HTTP trigger function processed a request.");
            _logger.LogInformation("Rendering Static File");

            try
            {
                var filePath = GetFilePath(req);

                _logger.LogInformation("Rendering static file for {filePath}", filePath);

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
        public HttpResponseData Root(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "/")]
            HttpRequestData req)
        {
            var response = req.CreateResponse(HttpStatusCode.Redirect);

            response.Headers.Add(
                "Location",
                "/api/staticFile?file=Views/index.html");

            return response;
        }

        [Function("bring-umbrella")]
        public HttpResponseData BringUmbrella(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "/bring-umbrella")]
            HttpRequestData req)
        {
            var response = req.CreateResponse(HttpStatusCode.Redirect);

            response.Headers.Add(
                "Location",
                "/api/staticFile?file=Views/umbrella.html");

            return response;
        }

        [Function("emotion-recognition")]
        public HttpResponseData EmotionRecognition(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "/emotion-recognition")]
            HttpRequestData req)
        {
            var response = req.CreateResponse(HttpStatusCode.Redirect);

            response.Headers.Add(
                "Location",
                "/api/staticFile?file=Views/emotions.html");

            return response;
        }

        [Function("detection")]
        public HttpResponseData Detection(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "/detection")]
            HttpRequestData req)
        {
            var response = req.CreateResponse(HttpStatusCode.Redirect);

            response.Headers.Add(
                "Location",
                "/api/staticFile?file=Views/detection.html");

            return response;
        }

        [Function("files")]
        public HttpResponseData Files(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "{*path}")]
            HttpRequestData req,
            string path)
        {
            var response = req.CreateResponse(HttpStatusCode.Redirect);

            response.Headers.Add(
                "Location",
                $"/api/staticFile?file={path}");

            return response;
        }

        private static string GetEnvironmentVariable(string name) =>
            Environment.GetEnvironmentVariable(name, EnvironmentVariableTarget.Process) ?? string.Empty;

        private static string GetFilePath(HttpRequestData req)
        {
            var path = req.Query.GetValues("file")?.FirstOrDefault();

            if (string.IsNullOrEmpty(path))
            {
                throw new ArgumentException("Missing file parameter");
            }

            var functionAppDirectory = AppContext.BaseDirectory;
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
