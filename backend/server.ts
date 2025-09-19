// This file is configured to be a CommonJS module as per tsconfig.json.
// `__dirname` is a global variable available in this environment.
// FIX: Explicitly importing Request, Response, and NextFunction from express to resolve type conflicts with global types (e.g., from DOM libraries). This ensures that Express's methods and properties are correctly recognized throughout the file.
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { GoogleGenAI, Modality, GenerateVideosResponse } from '@google/genai';
import type { EditedResult, CommunityPrompt, ChatMessage } from '../types';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// --- Middleware ---
// Increase payload limit for base64 images
app.use(express.json({ limit: '50mb' }));

// --- Gemini AI Initialization ---
const apiKey = process.env.API_KEY;
if (!apiKey) {
  // Log a persistent error message if the key is missing, but don't crash the server.
  console.error("FATAL: API_KEY environment variable not set. AI services will be unavailable.");
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const imageModel = 'gemini-2.5-flash-image-preview'; // aka 'nano-banana'
const textModel = 'gemini-2.5-flash';
const videoModel = 'veo-2.0-generate-001';

// --- System Instructions ---
const EDIT_INSTRUCTION_PREFIX = "You are an expert photo editor. Your primary goal is to generate an ultra-high-resolution, photorealistic image that perfectly preserves and enhances the quality of the original photo. Edits must be seamless and indistinguishable from reality, perfectly matching the original lighting, shadows, textures, and environment. Never degrade the original image quality. Maintain absolute facial consistency and features if a person is present. The user's request is: ";
const COMBINE_INSTRUCTION_PREFIX = "You are an expert photo editor. Your task is to seamlessly and creatively combine the two provided images based on the user's prompt. Prioritize creating a single, cohesive, and photorealistic scene. Pay close attention to lighting, shadows, scale, and perspective to ensure the final image is believable. Preserve the key features of the subjects from both images unless instructed otherwise. The user's request is: ";
const BOT_SYSTEM_INSTRUCTION = "You are Echo, a witty and sarcastic AI assistant. Your goal is to be a fun, engaging, and slightly argumentative creative partner for photo editing ideas and other topics. Never be a generic, boring AI. Use humor and a human-like conversational tone. You can playfully argue but always remain polite. Keep responses concise and to the point. Avoid long, repetitive answers.";


// --- Data Persistence for Community Prompts ---
// Correctly resolve path for both development (ts-node-dev) and production (dist folder)
const communityPromptsPath = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, '..', '..', 'community-prompts.json') // In prod, __dirname is backend/dist/backend, so we go up two levels
    : path.join(__dirname, 'community-prompts.json'); // In dev, __dirname is backend/, so it's in the same folder

const badWords = ['badword1', 'badword2', 'inappropriate']; // Add more words as needed

// --- Helper Functions ---

async function writePromptsToFile(prompts: CommunityPrompt[]): Promise<void> {
    await fs.writeFile(communityPromptsPath, JSON.stringify(prompts, null, 2));
}

async function readPromptsFromFile(): Promise<CommunityPrompt[]> {
    try {
        const data = await fs.readFile(communityPromptsPath, 'utf-8');
        return JSON.parse(data);
    } catch (error: any) {
        // If the file doesn't exist (ENOENT), create it with an empty array
        if (error.code === 'ENOENT') {
            await writePromptsToFile([]); // Create the file
            return [];
        }
        // For other errors (e.g., permission denied), re-throw
        console.error("Error reading prompts file:", error);
        throw error;
    }
}

const processImageApiResponse = (response: any): EditedResult => {
    if (response.promptFeedback?.blockReason) {
      throw new Error(`Request blocked: ${response.promptFeedback.blockReason}. Please adjust your prompt.`);
    }

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("The model did not generate a response. This may be due to the prompt being uninterpretable or violating safety policies.");
    }

    const result: EditedResult = {
      imageUrl: '',
      text: '',
    };

    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        result.text += part.text + ' ';
      } else if (part.inlineData) {
        const mimeType = part.inlineData.mimeType;
        const base64ImageBytes = part.inlineData.data;
        result.imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;
      }
    }

    if (!result.imageUrl) {
        throw new Error("The model's response did not include an image. This can happen if the request violates content policies. Please try a different prompt.");
    }

    result.text = result.text.trim();
    return result;
};

// Centralized error handler for generating user-friendly messages
const handleApiError = (error: unknown, req: Request, res: Response) => {
    console.error(`Error in ${req.path}:`, error);
    let friendlyMessage = "An unexpected server error occurred. Please try again later.";
    let statusCode = 500;

    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        const status = (error as any).status;
        
        if (status === 429 || message.includes("quota")) {
            friendlyMessage = "The service is currently experiencing high demand and has exceeded its usage limit. Please try again in a little while.";
            statusCode = 429;
        } else if (message.includes("api key") || message.includes("api_key")) {
            friendlyMessage = "The server's API Key is invalid or missing. Please contact the administrator.";
            statusCode = 503; // Service Unavailable
        } else if (message.includes("blocked") || message.includes("safety policies") || message.includes("prompt was rejected") || message.includes("violates content policies")) {
            friendlyMessage = "The request was blocked for safety reasons. Please adjust your prompt or image.";
            statusCode = 400; // Bad Request
        } else if (message.includes("did not generate a response") || message.includes("did not include an image")) {
            friendlyMessage = "The AI model could not process this request. It might be too complex or unusual. Please try a different prompt.";
            statusCode = 422; // Unprocessable Entity
        } else if (message.includes("timed out") || message.includes("timeout")) {
            friendlyMessage = "The request to the AI service timed out. The service may be busy. Please try again in a moment.";
            statusCode = 504; // Gateway Timeout
        } else if (message.includes("required")) { // for missing fields
            friendlyMessage = error.message;
            statusCode = 400;
        }
    }
    
    res.status(statusCode).json({ error: friendlyMessage });
};


// Middleware to gracefully handle missing API key
const checkApiKeyAndService = (req: Request, res: Response, next: NextFunction) => {
    if (!ai) {
        return res.status(503).json({
            error: "Service Unavailable: The server is missing the required API_KEY. Please contact the administrator to configure the server environment."
        });
    }
    next();
};

// --- API Endpoints ---

const apiRouter = express.Router();
apiRouter.use(checkApiKeyAndService); // Apply middleware to all API routes

apiRouter.post('/classify-image', async (req: Request, res: Response) => {
    try {
        const { imageData } = req.body;
        if (!imageData) {
            return res.status(400).json({ error: 'imageData is required' });
        }

        const imagePart = { inlineData: { data: imageData.data, mimeType: imageData.mimeType } };
        const textPart = { text: "Analyze the image and determine if it contains one or more male individuals. Respond with only 'Yes' or 'No'." };

        const response = await ai!.models.generateContent({
            model: textModel,
            contents: [{ parts: [imagePart, textPart] }],
        });

        res.json({ classification: response.text });
    } catch (error) {
        handleApiError(error, req, res);
    }
});

apiRouter.post('/improve-prompt', async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'prompt is required' });
        }

        const fullPrompt = `You are a prompt engineering expert for a generative AI image editor. Your task is to rewrite the following user prompt to be more descriptive, vivid, and detailed. Add keywords that are known to produce higher quality, more artistic results (e.g., 'photorealistic', '8k', 'cinematic lighting', 'detailed'). Respond ONLY with the improved prompt, without any conversational text or explanations. Here is the user's prompt: "${prompt}"`;

        const response = await ai!.models.generateContent({
            model: textModel,
            contents: fullPrompt,
        });

        res.json({ improvedPrompt: response.text });
    } catch (error) {
        handleApiError(error, req, res);
    }
});

apiRouter.post('/edit-image', async (req: Request, res: Response) => {
    try {
        const { imageData, prompt } = req.body;
        if (!imageData || !prompt) {
            return res.status(400).json({ error: 'imageData and prompt are required' });
        }

        const imagePart = { inlineData: { data: imageData.data, mimeType: imageData.mimeType } };
        const textPart = { text: `${EDIT_INSTRUCTION_PREFIX}${prompt}` };

        const response = await ai!.models.generateContent({
            model: imageModel,
            contents: [{ parts: [imagePart, textPart] }],
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const result = processImageApiResponse(response);
        res.json(result);
    } catch (error) {
        handleApiError(error, req, res);
    }
});

apiRouter.post('/combine-images', async (req: Request, res: Response) => {
    try {
        const { image1Data, image2Data, prompt } = req.body;
        if (!image1Data || !image2Data || !prompt) {
            return res.status(400).json({ error: 'image1Data, image2Data and prompt are required' });
        }

        const image1Part = { inlineData: { data: image1Data.data, mimeType: image1Data.mimeType } };
        const image2Part = { inlineData: { data: image2Data.data, mimeType: image2Data.mimeType } };
        const textPart = { text: `${COMBINE_INSTRUCTION_PREFIX}${prompt}` };

        const response = await ai!.models.generateContent({
            model: imageModel,
            contents: [{ parts: [image1Part, image2Part, textPart] }],
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const result = processImageApiResponse(response);
        res.json(result);
    } catch (error) {
        handleApiError(error, req, res);
    }
});

apiRouter.post('/generate-video', async (req: Request, res: Response) => {
    try {
        const { prompt, imageData } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'prompt is required' });
        }

        const operation = await ai!.models.generateVideos({
            model: videoModel,
            prompt,
            image: imageData ? { imageBytes: imageData.data, mimeType: imageData.mimeType } : undefined,
            config: {
                numberOfVideos: 1,
            },
        });

        res.json({ operationName: operation.name });

    } catch (error) {
        handleApiError(error, req, res);
    }
});

apiRouter.post('/video-status', async (req: Request, res: Response) => {
    try {
        const { operationName } = req.body;
        if (!operationName) {
            return res.status(400).json({ error: 'operationName is required' });
        }
        
        const operation = await ai!.operations.getVideosOperation({ operation: operationName });
        
        const metadata = operation.metadata;

        if (operation.done) {
            const error = operation.error as any;
            if (error && error.message) {
                throw new Error(`Video generation failed: ${error.message}`);
            }

            const videoResponse = operation.response as GenerateVideosResponse;
            const videoUrl = videoResponse?.generatedVideos?.[0]?.video?.uri;
            if (!videoUrl) {
                throw new Error("Video generation completed, but no video URI was returned.");
            }
            
            const downloadableUrl = `${videoUrl}&key=${apiKey}`;

            const result: EditedResult = {
                videoUrl: downloadableUrl,
                text: "Video generation complete."
            };
            res.json({ done: true, result, metadata });
        } else {
            res.json({ done: false, metadata });
        }
    } catch (error) {
        handleApiError(error, req, res);
    }
});

apiRouter.post('/chat', async (req: Request, res: Response) => {
    try {
        const { history, newMessage } = req.body as { history: ChatMessage[], newMessage: string };
        if (!newMessage) {
            return res.status(400).json({ error: 'newMessage is required.' });
        }

        const contents = [
            ...history.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.text }]
            })),
            { role: 'user' as const, parts: [{ text: newMessage }] }
        ];

        const response = await ai!.models.generateContent({
            model: textModel,
            contents: contents,
            config: {
                systemInstruction: BOT_SYSTEM_INSTRUCTION
            }
        });

        res.json({ reply: response.text });
        
    } catch (error) {
        handleApiError(error, req, res);
    }
});


// --- Community Endpoints ---
const communityRouter = express.Router();

communityRouter.get('/prompts', async (req: Request, res: Response) => {
    try {
        const communityPrompts = await readPromptsFromFile();
        // Return prompts in reverse chronological order
        res.json([...communityPrompts].reverse());
    } catch(error) {
        handleApiError(error, req, res);
    }
});

communityRouter.post('/share-prompt', checkApiKeyAndService, async (req: Request, res: Response) => {
    try {
        const { name, email, phone, title, prompt } = req.body;
        if (!name || !email || !phone || !title || !prompt) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        const combinedText = `${title} ${prompt}`.toLowerCase();
        
        // 1. Predefined word filter
        for (const word of badWords) {
            if (combinedText.includes(word)) {
                return res.status(400).json({ error: 'Your prompt contains inappropriate language and was rejected.' });
            }
        }

        // 2. AI-based moderation
        const moderationPrompt = `You are a content moderator. Analyze the following user-submitted prompt for an image generation tool. Determine if it contains any hateful, violent, sexually explicit, harmful, or otherwise inappropriate content. Respond with only 'SAFE' or 'UNSAFE'. Prompt: "${combinedText}"`;
        const moderationResponse = await ai!.models.generateContent({
            model: textModel,
            contents: moderationPrompt
        });

        if (!moderationResponse.text?.toUpperCase().includes('SAFE')) {
            return res.status(400).json({ error: 'Your prompt was rejected by our AI safety filter. Please be respectful and try again.' });
        }
        
        const communityPrompts = await readPromptsFromFile();

        const newPrompt: CommunityPrompt = {
            id: Date.now().toString(),
            name,
            email,
            phone,
            title,
            prompt,
            createdAt: new Date().toISOString()
        };

        communityPrompts.push(newPrompt);
        await writePromptsToFile(communityPrompts);

        res.status(201).json({ message: "Thank you! Your prompt has been approved and shared with the community." });

    } catch (error) {
        handleApiError(error, req, res);
    }
});


app.use('/api', apiRouter);
app.use('/api/community', communityRouter);

// --- Static Asset Serving ---
// Serve the built Vite app in production
if (process.env.NODE_ENV === 'production') {
    const frontendDistPath = path.join(__dirname, '..', '..', '..', 'dist');
    app.use(express.static(frontendDistPath));

    // Handle all other routes by serving the index.html, allowing React to handle routing
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
}


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
