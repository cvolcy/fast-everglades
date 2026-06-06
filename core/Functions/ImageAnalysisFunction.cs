using HttpMultipartParser;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.AI;

namespace fast_everglades.Functions
{
    public class ImageAnalysisFunction(
        ILogger<ImageAnalysisFunction> logger,
        IChatClient chatClient)
    {
        private readonly ILogger<ImageAnalysisFunction> _logger = logger;
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

            var imageBytes = imageStream.ToArray();
            var imageContent = new DataContent(imageBytes, imageContentType);

            var messages = new List<ChatMessage>
            {
                new(ChatRole.System, "You are an expert image analysis tool.\n" +
                    "Analyze the image and extract tags, a description, content safety metrics. and a color palette.\n" + 
                    "CRITICAL FOR DESCRIPTION:\n" +
                    "- Do NOT include conversational filler, meta-commentary, or introductory phrases.\n" +
                    "- Never start with phrases like 'The image depicts...', 'This is a photo of...', 'An image showing...', or 'We can see...'.\n" +
                    "- Start directly with the subject matter. Act like a caption writer.\n\n" +
                    "Example Bad: 'The image depicts a futuristic city under a neon sky.'\n" +
                    "Example Good: 'A futuristic city under a neon sky.'" +
                    "format the color palette in hex css notation like #A0A0A0"),
                    //and pixel coordinates for prominent objects."),
                new(ChatRole.User,
                [
                    new TextContent("Analyze this image according to the schema provided."),
                    imageContent
                ])
            };

            try
            {
                var response = await _chatClient.GetResponseAsync<ImageAnalysisResponse>(messages, cancellationToken: cancellationToken);

                return new OkObjectResult(response.Result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing image.");
                return new StatusCodeResult(StatusCodes.Status500InternalServerError);
            }
        }
    }

    public class ImageAnalysisResponse
    {
        public required string Description { get; set; }
        public string[] Tags { get; set; } = [];
        public bool NSFW { get; set; }
        public string[] ColorPalette { get; set; } = [];
    }

    public class ImageDetection
    {
        public int X { get; set; }
        public int Y { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public required string Label { get; set; }
    }
}
