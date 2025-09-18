export interface EditedResult {
  imageUrl?: string;
  videoUrl?: string;
  text: string;
}

export interface OriginalImage {
  file: File;
  base64: string;
}

export interface OriginalVideo {
  file: File;
  url: string;
}

export interface UserInfo {
  name: string;
  email: string;
  phone: string;
}

export interface HistoryItem {
  id: string;
  originalImage: OriginalImage;
  originalImage2?: OriginalImage;
  originalVideo?: OriginalVideo;
  prompt: string;
  result: EditedResult;
  type: 'edit' | 'combine' | 'video';
}

export interface PromptIdea {
  title: string;
  prompt: string;
  gender?: 'male' | 'female' | 'unisex';
}

export interface PromptCategory {
  category: string;
  prompts: PromptIdea[];
}

export interface VideoPreset {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

export interface CommunityPrompt {
  id: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  prompt: string;
  createdAt: string;
}
