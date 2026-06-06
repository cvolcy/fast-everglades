using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using MimeTypes;
using System.Net;

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
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/staticFile")] HttpRequestData req)
        {
            _logger.LogInformation("C# HTTP trigger function processed a request.");

            var filePath = GetFilePath(req);
            return ServeStaticFile(req, filePath);
        }

        [Function("root")]
        public HttpResponseData Root(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "/")]
            HttpRequestData req)
        {
            _logger.LogInformation("Serving index.html directly from root.");

            var filePath = GetFilePath(req, "Views/index.html");
            return ServeStaticFile(req, filePath);
        }

        [Function("bringumbrella")]
        public HttpResponseData BringUmbrella(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "bring-umbrella")]
            HttpRequestData req)
        {
            _logger.LogInformation("Serving umbrella.html directly from bringumbrella.");

            var filePath = GetFilePath(req, "Views/umbrella.html");
            return ServeStaticFile(req, filePath);
        }

        [Function("emotionrecognition")]
        public HttpResponseData EmotionRecognition(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "emotion-recognition")]
            HttpRequestData req)
        {
            _logger.LogInformation("Serving emotions.html directly from emotionrecognition.");

            var filePath = GetFilePath(req, "Views/emotions.html");
            return ServeStaticFile(req, filePath);
        }

        [Function("detection")]
        public HttpResponseData Detection(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "detection")]
            HttpRequestData req)
        {
            _logger.LogInformation("Serving detection.html directly from detection.");

            var filePath = GetFilePath(req, "Views/detection.html");
            return ServeStaticFile(req, filePath);
        }

        [Function("zfiles")]
        public HttpResponseData Files(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "{*path}")]
            HttpRequestData req,
            string path)
        {
            var filePath = GetFilePath(req, path);
            return ServeStaticFile(req, filePath);
        }

        private static string GetEnvironmentVariable(string name) =>
            Environment.GetEnvironmentVariable(name, EnvironmentVariableTarget.Process) ?? string.Empty;

        private static string GetFilePath(HttpRequestData req, string forcePath = "")
        {
            var path = string.IsNullOrEmpty(forcePath)
                ? req.Query.GetValues("file")?.FirstOrDefault()
                : forcePath;

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

        private HttpResponseData ServeStaticFile(HttpRequestData req, string filePath)
        {
            try
            {
                _logger.LogInformation("Rendering static file for {filePath}", filePath);

                var response = req.CreateResponse(HttpStatusCode.OK);

                if (!File.Exists(filePath)) throw new InvalidOperationException($"file at `{filePath}` does not exists.");

                var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read);

                response.Body = stream;
                response.Headers.Add("Content-Type", GetMimeType(filePath));
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error serving file {filePath}", filePath);
                return req.CreateResponse(HttpStatusCode.NotFound);
            }
        }
    }
}
