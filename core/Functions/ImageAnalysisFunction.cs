using HttpMultipartParser;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.AI;

namespace fast_everglades.Functions
{
    public class ImageAnalysisFunction(IChatClient chatClient)
    {
        private readonly IChatClient _chatClient = chatClient;

        [Function("AnalyzeImage")]
        public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "api/analyze")] HttpRequestData req, CancellationToken cancellationToken)
        {
            var parser = await MultipartFormDataParser.ParseAsync(req.Body, cancellationToken: cancellationToken);

            MemoryStream? imageStream = null;
            string? imageContentType = null;
            var file = parser.Files.FirstOrDefault(x => x.Name.Equals("image", StringComparison.InvariantCultureIgnoreCase));
            if (file != null)
            {
                string fileName = file.FileName;
                imageStream = new MemoryStream();
                imageContentType = file.ContentType;
                await file.Data.CopyToAsync(imageStream, cancellationToken);
            }

            if (imageStream is null || imageContentType is null)
            {
                return new BadRequestObjectResult(new { message = "Missing 'image' file." });
            }

            // Convert uploaded file into an AI-ready DataContent object
            var imageBytes = imageStream.ToArray();
            var imageContent = new DataContent(imageBytes, imageContentType);

            // Construct the multi-modal request
            var messages = new List<ChatMessage>
            {
                new(ChatRole.System, @"You are an expert image analysis tool.
                    Analyze the image and extract tags, a description, content safety metrics,
                    and pixel coordinates for prominent objects."),
                new(ChatRole.User,
                [
                    new TextContent("Analyze this image according to the schema provided."),
                    imageContent
                ])
            };

            try
            {
                // Execute using the unified client
                var response = await _chatClient.GetResponseAsync<ImageAnalysisResponse>(messages, cancellationToken: cancellationToken);

                return new OkObjectResult(response.Result);
            }
            catch (Exception ex)
            {
                return new StatusCodeResult(StatusCodes.Status500InternalServerError);
            }
        }
    }

    public class ImageAnalysisResponse
    {
        public required string Description { get; set; }
        public string[] Tags { get; set; } = [];
        public bool NSFW { get; set; }
        public ImageDetection[] Detections { get; set; } = [];
    }

    public class ImageDetection
    {
        public int X { get; set; }
        public int Y { get; set; }
        public required string Label { get; set; }
    }
}
