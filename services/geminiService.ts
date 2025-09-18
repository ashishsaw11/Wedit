import type { EditedResult, CommunityPrompt } from '../types';

const API_BASE_URL = '/api'; // Using a relative URL for proxying

// Helper to convert a File to a base64 string and mimeType
const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64Data = dataUrl.split(',')[1];
      resolve({
        data: base64Data,
        mimeType: file.type,
      });
    };
    reader.onerror = (error) => reject(error);
  });
};

// Generic, robust fetch response handler
const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server responded with status ${response.status}`);
        } else {
            const errorText = await response.text();
            const shortError = errorText.length > 150 ? `${errorText.substring(0, 150)}...` : errorText;
            throw new Error(`Server error: ${response.status}. Response: ${shortError}`);
        }
    }
    // Check if the response has content before trying to parse it
    const text = await response.text();
    return text ? JSON.parse(text) : {};
};

async function postToApi<T>(endpoint: string, body: object): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    return handleApiResponse(response);
}

async function getFromApi<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    return handleApiResponse(response);
}

export const classifyImageForMale = async (imageFile: File): Promise<boolean> => {
    const imageData = await fileToBase64(imageFile);
    const response = await postToApi<{ classification: string }>('/classify-image', { imageData });
    return response.classification.trim().toLowerCase().includes('yes');
};

export const improvePrompt = async (prompt: string): Promise<string> => {
    if (!prompt.trim()) {
        throw new Error("Prompt cannot be empty.");
    }
    const response = await postToApi<{ improvedPrompt: string }>('/improve-prompt', { prompt });
    return response.improvedPrompt;
}

export const editImageWithNanoBanana = async (imageFile: File, prompt: string): Promise<EditedResult> => {
  const imageData = await fileToBase64(imageFile);
  return postToApi<EditedResult>('/edit-image', { imageData, prompt });
};

export const combineImagesWithNanoBanana = async (imageFile1: File, imageFile2: File, prompt: string): Promise<EditedResult> => {
  const image1Data = await fileToBase64(imageFile1);
  const image2Data = await fileToBase64(imageFile2);
  return postToApi<EditedResult>('/combine-images', { image1Data, image2Data, prompt });
};

export const generateVideoWithVeo = async (prompt: string, imageFile: File | null, onProgress: (message: string) => void): Promise<EditedResult> => {
  onProgress("Converting reference image...");
  const imageData = imageFile ? await fileToBase64(imageFile) : null;
  
  onProgress("Sending request to the video model...");
  // Start the video generation, get back an operation name
  const startResponse = await postToApi<{ operationName: string }>('/generate-video', { prompt, imageData });
  const { operationName } = startResponse;
  
  onProgress("Video generation started. Polling for results...");
  
  let isDone = false;
  let finalResult: EditedResult | null = null;
  let attempts = 0;
  const maxAttempts = 30; // 5 minutes max polling (30 * 10s)

  while (!isDone && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
    attempts++;
    
    try {
        const statusResponse = await postToApi<{ done: boolean; result?: EditedResult; metadata?: any }>('/video-status', { operationName });
        
        onProgress(`Checking status: ${statusResponse.metadata?.state || 'in_progress'}`);
        
        if (statusResponse.done) {
            isDone = true;
            if (!statusResponse.result?.videoUrl) {
                 throw new Error("Video generation completed, but no video URI was returned.");
            }
            onProgress("Generation complete! Finalizing video.");
            finalResult = statusResponse.result;
        }
    } catch(err) {
        // If polling fails, stop and throw
        throw err;
    }
  }

  if (!finalResult) {
      throw new Error("Video generation timed out or failed to complete.");
  }
  
  return finalResult;
};

// --- Community Endpoints ---

export const getCommunityPrompts = async (): Promise<CommunityPrompt[]> => {
    return getFromApi<CommunityPrompt[]>('/community/prompts');
};

export const shareCommunityPrompt = async (data: Omit<CommunityPrompt, 'id' | 'createdAt'>): Promise<{ message: string }> => {
    return postToApi<{ message: string }>('/community/share-prompt', data);
};
