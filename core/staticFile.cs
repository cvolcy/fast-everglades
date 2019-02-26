using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.Net.Http;
using System.Net;
using System.Net.Http.Headers;
using System.Linq;
using MimeTypes;

namespace fast_everglades
{
    public static class StaticFile
    {
        public static readonly string STATIC_FILES_FOLDER = "www";
        public static readonly string DEFAULT_PAGE = string.IsNullOrEmpty(GetEnvironmentVariable("DEFAULT_PAGE")) ? 
                "index.html" : GetEnvironmentVariable("DEFAULT_PAGE");

        [FunctionName("staticFile")]
        public static async Task<HttpResponseMessage> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = null)] HttpRequest req,
            ILogger log, ExecutionContext context)
        {
            log.LogInformation("C# HTTP trigger function processed a request.");
            log.LogInformation("Rendering Static File");

            try
            {
                var filePath = GetFilePath(req, context);

                log.LogInformation($"Rendering static file for {filePath}");

                var response = new HttpResponseMessage(HttpStatusCode.OK);
                var stream = new FileStream(filePath, FileMode.Open);
                response.Content = new StreamContent(stream);
                response.Content.Headers.ContentType =
                    new MediaTypeHeaderValue(GetMimeType(filePath));
                return response;
            }
            catch
            {
                return new HttpResponseMessage(HttpStatusCode.NotFound);
            }
        }
        private static string GetEnvironmentVariable(string name) =>
            Environment.GetEnvironmentVariable(name, EnvironmentVariableTarget.Process);
        private static string GetFilePath(HttpRequest req, ExecutionContext context)
        {
            var path = req.GetQueryParameterDictionary()
                               .Where(q => string.Compare(q.Key, "file", true) == 0)
                               .Select(q => q.Value)
                               .FirstOrDefault();

            var staticFilesPath =
                Path.GetFullPath(Path.Combine(context.FunctionAppDirectory, STATIC_FILES_FOLDER));
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
