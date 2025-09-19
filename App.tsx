
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { EditedResult, OriginalImage, OriginalVideo, HistoryItem, PromptCategory, PromptIdea, UserInfo, VideoPreset, CommunityPrompt } from './types';
import { editImageWithNanoBanana, improvePrompt, classifyImageForMale, combineImagesWithNanoBanana, generateVideoWithVeo, getCommunityPrompts, shareCommunityPrompt } from './services/geminiService';
import { sendUserInfoToDeveloper } from './services/userDataService';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import {
  SparklesIcon,
  DownloadIcon,
  CopyIcon,
  Spinner,
  AlertTriangleIcon,
  EyeIcon,
  WandIcon,
  XMarkIcon,
  PhotoStackIcon,
  VideoIcon,
  UserIcon,
  UploadIcon,
  UsersIcon,
} from './components/IconComponents';

type Tab = 'Editor' | 'Combine' | 'Video' | 'Trending' | 'Community' | 'History';
type Theme = 'light' | 'dark';
type Gender = 'male' | 'female' | 'unisex';
type Language = 'en' | 'hi';

const wittyLoadingMessages = [
  "Rummaging through digital paint buckets...",
  "Teaching the AI about 'art'. It's a slow process.",
  "Convincing the pixels to get along.",
  "Herding cats, but they're digital and on fire.",
  "Don't worry, the AI is a professional. Mostly.",
  "Generating... Please hold, your call is not important to us.",
  "Sharpening the virtual pencils.",
  "Brewing coffee for the AI. It's a diva.",
  "Searching for that one misplaced pixel from 2003.",
  "The hamsters are running as fast as they can.",
  "Struggling more than you on a Monday morning.",
];

const videoLoadingMessages = [
    "Directing the digital actors...",
    "Rendering scene 1... This might take a moment.",
    "The AI is storyboarding your masterpiece.",
    "Synchronizing audio and video that don't exist yet.",
    "Hold on, we're in the digital cutting room.",
    "This is taking longer than the credits of a fantasy epic.",
    "Buffering... Just kidding, we're generating.",
];

const promptIdeas: PromptCategory[] = [
   {
    category: "For Boys",
    prompts: [
      { title: "Cyberpunk Rebel", prompt: "Transform my photo into a cyberpunk-style portrait. Add futuristic clothing, neon lights in the background, maybe a robotic arm or glowing eye implant. Make it look like a character from a dystopian sci-fi movie." },
      { title: "Ancient Warrior", prompt: "Reimagine me as an ancient warrior (e.g., Viking, Samurai, Spartan). Give me authentic armor, a battle-worn expression, and a dramatic, misty mountain background." },
      { title: "Anime Hero Transformation", prompt: "Turn me into a classic shonen anime hero. Give me spiky, brightly colored hair, dynamic action lines, and an energy aura. The style should be reminiscent of popular battle anime." },
      { title: "Peaky Blinders Look", prompt: "Edit my photo to give me the 1920s Peaky Blinders aesthetic. Put me in a tweed cap, a sharp suit, and place me on a gritty, atmospheric street in Birmingham with moody lighting." },
      { title: "Apocalyptic Survivor", prompt: "Place me in a post-apocalyptic world. Give me rugged, worn-out clothes, a determined expression, and a background of ruined cityscapes. Add details like dust, scratches, and dramatic sunlight breaking through clouds." },
    ]
  },
  {
    category: "For Girls",
    prompts: [
      { title: "Fairytale Princess", prompt: "Turn my photo into a classic fairytale princess portrait. Add a beautiful gown, a sparkling tiara, and place me in an enchanted forest or castle setting with soft, magical lighting." },
      { title: "Goddess of Nature", prompt: "Reimagine me as a nature goddess. Weave flowers and vines into my hair, give me ethereal makeup, and surround me with lush greenery and animals. The atmosphere should be serene and powerful." },
      { title: "Watercolor Painting", prompt: "Convert my portrait into a soft, beautiful watercolor painting. The colors should be dreamy and blended, with delicate brushstrokes, giving it an artistic and gentle feel." },
      { title: "Queen of the Gala", prompt: "Edit my photo so I'm dressed in a stunning, high-fashion ball gown at a glamorous gala. Add elegant jewelry, sophisticated hair and makeup, and a background of a grand ballroom with chandeliers." },
      { title: "Vintage Film Star", prompt: "Give my photo a classic Hollywood glamour look from the 1950s. Think black and white, dramatic lighting, elegant waves in my hair, and a timeless, sophisticated expression." },
    ]
  },
  {
    category: "🔥 Top Trending",
    prompts: [
        { title: "Ultra-Realistic Saree Portrait", prompt: "Use the uploaded reference image as the main base. Ultra-realistic cinematic portrait of a young woman standing near glowing string lights at night. The woman is wearing a stylish black saree, softly smiling and gazing upward with a dreamy expression. The background is dark and blurred, with warm golden bokeh lights creating a festive, magical atmosphere. Lighting is warm and glowing, softly illuminating her face with smooth shadows and depth of field, giving a professional studio-like finish.", gender: 'female' },
        { title: "Mahadev Divine Embrace", prompt: "A young Indian man wearing a grey knitted sweater, smiling and standing outdoors, embraced warmly from behind by a divine figure of Lord Shiva. Lord Shiva is shown with blue skin, closed eyes in a peaceful expression, crescent moon in his hair, snake around his neck, rudraksha beads, and a glowing divine aura behind his head. The background is a dreamy blurred forest scene, with soft golden and mystical light, creating a spiritual and protective atmosphere. Ultra-realistic detail.", gender: 'male' },
        { title: "Giant Statue Construction", prompt: "Create a giant hyper-realistic statue based on the given photo, keeping the original face exactly the same without changes. The statue stands tall in the middle of a roundabout in Dhaka, near a famous historical landmark. The statue is still under construction, surrounded by scaffolding, with many construction workers in yellow helmets and orange vests climbing, welding, and working on it. The sky is light blue with gentle clouds.", gender: 'unisex' },
        { title: "Retro Vintage Saree Aesthetic", prompt: "Create a retro vintage grainy but bright image of the reference picture. The subject is draped in a perfect brown Pinterest-style retro saree. It must feel like a 90s movie aesthetic, with a red-haired baddie look, a small flower tucked visibly into her curls, and a romantic windy environment. The girl is standing against a solid wall, deep shadows and dramatic contrast creating a mysterious, artistic atmosphere. Lighting is warm with golden tones, evoking a sunset or golden hour glow.", gender: 'female' },
        { title: "Stylish Man Fashion Portrait", prompt: "A stylish young man (same face as the uploaded image) standing confidently with hands in pockets, one leg crossed over the other, wearing black formal shoes. Studio portrait with soft lighting, elegant dark background, cinematic look, professional photo editing. A large faded background portrait of the same person in black sunglasses is placed behind him. Luxury fashion style, premium magazine photoshoot vibe. Add metallic text in the background reading: YOUR NAME.", gender: 'male' },
    ]
  },
   {
    category: "🖼️ Image Blends",
    prompts: [
      { title: "Spiritual Embrace", prompt: "Create a cinematic, emotional frame featuring the two attached persons together. The setting is a Vrindavan ashram, with soft golden evening light filtering through the foliage. Both subjects are seated near a large tree. The person from the first image sits gracefully upright on a log, appearing calm and wise as they speak gently. The person from the second image sits on the ground with their head resting in the elder’s lap, listening with devotion. The scene should be rendered in 8K quality, with a warm, spiritual atmosphere." },
      { title: "Face Swap", prompt: "Swap the faces of the people in the two images. Keep the background and clothing of the first image." },
      { title: "Ghostly Figure", prompt: "Make the person from the second image appear as a transparent, ghostly figure standing behind the person in the first image. Place them in a spooky, foggy forest at night." },
      { title: "Miniature World", prompt: "Shrink the person from the first image and place them into the scene of the second image, making them look like a tiny figure in a giant world." },
    ]
  },
  {
    category: "🎬 Video & Motion",
    prompts: [
      { title: "Cinematic Text Reveal", prompt: "Create a slow-motion, cinematic video of golden particles shimmering and slowly converging to form the text 'Your Title Here'. The background should be a dark, elegant, and slightly out-of-focus environment. High-quality, 8K, professional." },
      { title: "Vlog Intro Scene", prompt: "A hyper-realistic, 5-second drone shot flying backward through a stunning mountain valley at sunrise. The light is golden and catches the mist rising from the trees." },
      { title: "Informative Transition", prompt: "Create a transition effect. A detailed, 3D map of India zooms in on the state of Rajasthan, which then glows and transforms into the next scene. This should look like a high-quality news broadcast graphic." },
    ]
  },
  {
    category: "✨ Spiritual & Divine",
    prompts: [
      { title: "Radha Prompt 1", prompt: "Create a portrait of a young woman with a serene expression, where the girl looks like Radha with brown long wavy hair flying. Minimal mural art is painted on her forehead. She is wearing a red aesthetic chiffon lehenga with golden shimmer, along with minimal floral jewellery. A peacock feather rests gently in her hand. The background is a solid white wall, lit with a dreamy gradient of warm blue and warm red HD neon light reflecting softly, creating a cinematic feel." },
      { title: "Premanand Maharaj Prompt 1", prompt: "Create a cinematic, emotional frame featuring the two attached persons together. The setting is a Vrindavan ashram, with soft golden evening light filtering through the foliage. Both subjects are seated near a large tree. The elder person, Prem Anand Maharaj Ji, sits gracefully upright on a log, appearing calm and wise as he speaks gently. The younger person sits on the ground with his head resting in the elder’s lap, listening with devotion. The scene should be rendered in 8K quality, with a warm, spiritual atmosphere." },
      { title: "Radha & Krishna Prompt", prompt: "Generate a photo of the Hindu deities Krishna and Radha in a modern, artistic interpretation. Krishna is portrayed with blue body paint, wearing a crown adorned with a peacock feather. Radha is dressed in a pink sari with flowers in her hair. They are embracing affectionately, radiating devotion and eternal love. The lighting is soft and warm, casting a golden glow over the scene, creating a gentle and serene mood in 8K quality." },
    ]
  },
  {
    category: "😏 Sarcastic Twists",
    prompts: [
        { title: "My 'Enthusiastic' Work Face", prompt: "Edit my photo to look like I'm absolutely thrilled to be in this meeting. Add a subtle, barely noticeable eye-roll and a coffee cup that says 'World's Okayest Employee'. The lighting should be as dim as my will to live. Corporate-core aesthetic." },
        { title: "Peak Physical Condition", prompt: "Please give me the body of a Greek god, but one who has recently discovered pizza and Netflix. A soft, gentle belly, but with abs faintly drawn on with a marker. Make it look like I tried, for like, a minute." },
    ]
  },
];

const videoPresets: VideoPreset[] = [
  { id: 'cinematic', name: 'Cinematic', description: 'Widescreen, dramatic lighting, and high dynamic range.', prompt: 'A cinematic, wide-angle shot with dramatic lighting and a shallow depth of field. High dynamic range, 8K resolution.' },
  { id: 'vintage', name: 'Vintage', description: '8mm film grain, faded colors, and light leaks.', prompt: 'Vintage look, 8mm film grain, faded colors, light leaks, and a slightly shaky camera effect. Aspect ratio 4:3.' },
  { id: 'fast', name: 'Fast-paced', description: 'Quick cuts, motion blur, and dynamic movements.', prompt: 'A high-energy, fast-paced sequence with quick cuts, motion blur, and dynamic camera movements. Upbeat and exciting.' },
  { id: 'dreamy', name: 'Dreamy Slow-mo', description: 'Ethereal glow, soft focus, and floating particles.', prompt: 'Dreamy slow-motion footage, ethereal glow, soft focus, floating particles in the air. Serene and magical.' },
];

const getFriendlyErrorMessage = (error: unknown): string => {
  const defaultMessage = "An unexpected error occurred. Please check the console for details.";
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Specific API key issues (from backend)
    if (message.includes("api key") || message.includes("api_key")) {
      return "There's an issue with the server's API Key configuration. Please contact the site administrator.";
    }

    // Content policy / safety violations
    if (message.includes("blocked") || message.includes("safety policies") || message.includes("violates content policies") || message.includes("prompt was rejected")) {
      return "Your request was blocked for safety reasons. Please adjust your prompt or image and try again.";
    }
    
    // Model can't handle the request
    if (message.includes("did not generate a response") || message.includes("did not include an image")) {
        return "The AI model couldn't process this request. It might be too complex or unusual. Please try a different prompt.";
    }

    // Network or server timeout issues
    if (message.includes("timed out") || message.includes("network error")) {
        return "The request timed out. This could be a network issue or the server is busy. Please try again in a moment.";
    }
    
    // Generic server error
    if (message.includes("server responded with status 500") || message.includes("server error")) {
        return "A server error occurred. We've been notified and are looking into it. Please try again later.";
    }

    // Return the original message if it's short and potentially useful
    if (error.message.length < 150) { 
        return error.message;
    }
  }

  return defaultMessage;
};


const disclaimerContent = {
    en: {
        title: "Responsible Use Policy",
        intro: "Welcome to Magic Editor! By using this tool, you agree to the following:",
        points: [
            "<strong>Be Creative & Respectful:</strong> Do not generate content that is hateful, harassing, violent, sexually explicit, or promotes illegal acts.",
            "<strong>No Harmful Content:</strong> You will not upload images or create prompts that are abusive, deceptive, or violate the privacy of others.",
            "<strong>AI is Imperfect:</strong> The AI can make mistakes and may generate unexpected or inaccurate content. Please review all results carefully before use.",
            "<strong>Ownership:</strong> You are responsible for the content you create. By generating content, you affirm that you have the rights to the original media.",
            "<strong>For Educational Purposes:</strong> This application is a personal project created for study and demonstration by Ashish Kumar Shaw. It is not intended for commercial use."
        ],
        warning: "Violation of these terms may result in being blocked from the service. Let's create amazing things, responsibly.",
        button: "I Understand and Agree"
    },
    hi: {
        title: "जिम्मेदार उपयोग नीति",
        intro: "मैजिक एडिटर में आपका स्वागत है! इस टूल का उपयोग करके, आप निम्नलिखित बातों से सहमत हैं:",
        points: [
            "<strong>रचनात्मक और सम्मानजनक बनें:</strong> ऐसी सामग्री न बनाएं जो घृणित, परेशान करने वाली, हिंसक, यौन रूप से स्पष्ट हो, या अवैध कार्यों को बढ़ावा देती हो।",
            "<strong>कोई हानिकारक सामग्री नहीं:</strong> आप ऐसी छवियां अपलोड नहीं करेंगे या ऐसे प्रॉम्प्ट नहीं बनाएंगे जो अपमानजनक, भ्रामक हों, या दूसरों की गोपनीयता का उल्लंघन करते हों।",
            "<strong>AI अपूर्ण है:</strong> AI गलतियाँ कर सकता है और अप्रत्याशित या गलत सामग्री उत्पन्न कर सकता है। कृपया उपयोग से पहले सभी परिणामों की सावधानीपूर्वक समीक्षा करें।",
            "<strong>स्वामित्व:</strong> आपके द्वारा बनाई गई सामग्री के लिए आप जिम्मेदार हैं। सामग्री बनाकर, आप पुष्टि करते हैं कि आपके पास मूल मीडिया के अधिकार हैं।",
            "<strong>शैक्षणिक उद्देश्य:</strong> यह एप्लिकेशन आशीष कुमार शॉ द्वारा अध्ययन और प्रदर्शन के लिए बनाया गया एक व्यक्तिगत प्रोजेक्ट है। यह व्यावसायिक उपयोग के लिए अभिप्रेत नहीं है।"
        ],
        warning: "इन शर्तों का उल्लंघन करने पर आपको सेवा से अवरुद्ध किया जा सकता है। आइए जिम्मेदारी से अद्भुत चीजें बनाएं।",
        button: "मैं समझता हूं और सहमत हूं"
    }
};


// --- Sub-Components ---

const ErrorDisplay: React.FC<{ error: string | null }> = ({ error }) => {
  if (!error) return null;
  return (
    <div className="mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
      <div className="flex">
        <div className="py-1"><AlertTriangleIcon className="h-5 w-5 text-red-500 mr-3" /></div>
        <div>
          <p className="font-bold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    </div>
  );
};

interface PromptInputProps {
    prompt: string;
    onPromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onImprovePrompt: () => void;
    isLoading: boolean;
    promptInputRef: React.RefObject<HTMLTextAreaElement>;
    id: string;
    label: string;
    placeholder: string;
    rows?: number;
}

const PromptInput: React.FC<PromptInputProps> = ({ prompt, onPromptChange, onImprovePrompt, isLoading, promptInputRef, id, label, placeholder, rows = 3 }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-[var(--text-color-strong)] mb-2">{label}</label>
        <div className="relative">
            <textarea
                ref={promptInputRef}
                id={id}
                value={prompt}
                onChange={onPromptChange}
                placeholder={placeholder}
                className="w-full p-3 pr-24 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg-color)] focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] transition-shadow resize-none overflow-hidden"
                rows={rows}
                disabled={isLoading}
            />
            <button
                onClick={onImprovePrompt}
                disabled={isLoading || !prompt.trim()}
                className="absolute top-2 right-2 flex items-center px-3 py-1.5 bg-[var(--accent-color)]/10 text-[var(--accent-color)] text-xs font-semibold rounded-full hover:bg-[var(--accent-color)]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Improve prompt with AI"
            >
                <SparklesIcon className="w-4 h-4 mr-1"/>
                Improve
            </button>
        </div>
    </div>
);

const DisclaimerModal: React.FC<{ onAgree: () => void; language: Language; setLanguage: (lang: Language) => void; }> = ({ onAgree, language, setLanguage }) => {
    const content = disclaimerContent[language];

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-[var(--card-bg-color)] rounded-xl shadow-2xl w-full max-w-lg p-6 md:p-8 border border-[var(--border-color)] animate-slide-up">
                <div className="flex justify-between items-center mb-4">
                    <div className="text-center flex-grow">
                        <AlertTriangleIcon className="w-12 h-12 mx-auto text-yellow-500" />
                        <h2 className="text-2xl font-bold text-[var(--text-color-strong)] mt-2">{content.title}</h2>
                    </div>
                    <div className="flex flex-col space-y-1 self-start">
                        <button onClick={() => setLanguage('en')} className={`px-2 py-1 text-xs rounded ${language === 'en' ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--border-color)]/50'}`}>EN</button>
                        <button onClick={() => setLanguage('hi')} className={`px-2 py-1 text-xs rounded ${language === 'hi' ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--border-color)]/50'}`}>HI</button>
                    </div>
                </div>

                <div className="space-y-3 text-sm text-[var(--text-color)] max-h-60 overflow-y-auto pr-2">
                    <p>{content.intro}</p>
                    <ul className="list-disc list-inside space-y-2 pl-2">
                        {content.points.map((point, index) => (
                            <li key={index} dangerouslySetInnerHTML={{ __html: point }} />
                        ))}
                    </ul>
                    <p className="font-semibold text-[var(--text-color-strong)] pt-2">{content.warning}</p>
                </div>
                <div className="mt-6">
                    <button
                        onClick={onAgree}
                        className="w-full flex items-center justify-center bg-[var(--accent-color)] text-white font-bold py-3 px-4 rounded-lg hover:bg-[var(--accent-color-hover)] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        {content.button}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ResultDisplayProps {
  result: EditedResult | null;
  isLoading: boolean;
  loadingMessage: string;
  prompt: string;
  onDownload: (url: string, isVideo: boolean) => void;
  onCopyPrompt: (prompt: string) => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, isLoading, loadingMessage, prompt, onDownload, onCopyPrompt }) => {
  if (isLoading) {
    return (
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 bg-[var(--bg-color)] rounded-lg border-2 border-dashed border-[var(--border-color)] aspect-video lg:aspect-square">
        <div className="animate-pulse">
          <SparklesIcon className="w-16 h-16 text-[var(--text-color)]/20 mb-4" />
        </div>
        <p className="text-[var(--text-color)]/70 font-semibold">{loadingMessage.includes('...') ? 'Generating your masterpiece...' : 'Please wait...'}</p>
        <p className="text-[var(--text-color)]/50 mt-2 text-sm text-center px-4">{loadingMessage}</p>
      </div>
    );
  }

  if (!result || (!result.imageUrl && !result.videoUrl)) {
    return (
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 bg-[var(--bg-color)] rounded-lg border-2 border-dashed border-[var(--border-color)] aspect-video lg:aspect-square">
        <SparklesIcon className="w-16 h-16 text-[var(--text-color)]/20 mb-4" />
        <p className="text-[var(--text-color)]/50 text-center">Your generated content will appear here.</p>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-1/2">
      <label className="block text-sm font-medium text-[var(--text-color-strong)] mb-2">Result</label>
      <div className="relative group bg-[var(--card-bg-color)] p-2 border border-[var(--border-color)] rounded-lg">
        {result.imageUrl && <img src={result.imageUrl} alt="Generated result" className="w-full h-auto object-contain rounded-md" />}
        {result.videoUrl && <video src={result.videoUrl} controls autoPlay loop muted className="w-full h-auto object-contain rounded-md" />}

        <div className="absolute top-2 right-2 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onDownload(result.imageUrl || result.videoUrl!, !!result.videoUrl)} className="p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors" title="Download">
            <DownloadIcon className="w-5 h-5" />
          </button>
          <button onClick={() => onCopyPrompt(prompt)} className="p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors" title="Copy Prompt">
            <CopyIcon className="w-5 h-5" />
          </button>
        </div>
        {result.text && (
          <p className="text-xs text-[var(--text-color)]/80 p-2 bg-[var(--bg-color)] rounded-b-md mt-2">{result.text}</p>
        )}
      </div>
    </div>
  );
};

interface EditorViewProps {
  originalImage: OriginalImage | null;
  isLoading: boolean;
  error: string | null;
  prompt: string;
  editedResult: EditedResult | null;
  loadingMessage: string;
  promptInputRef: React.RefObject<HTMLTextAreaElement>;
  onImageUpload: (image: OriginalImage | null) => void;
  onPromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onImprovePrompt: () => void;
  onGenerate: () => void;
  onDownload: (url: string, isVideo: boolean) => void;
  onCopyPrompt: (text: string) => void;
}

const EditorView: React.FC<EditorViewProps> = ({
  originalImage, isLoading, error, prompt, editedResult, loadingMessage, promptInputRef,
  onImageUpload, onPromptChange, onImprovePrompt, onGenerate, onDownload, onCopyPrompt
}) => (
  <div className="flex flex-col lg:flex-row gap-8">
    <div className="w-full lg:w-1/2 flex flex-col gap-4">
      <ImageUploader onImageUpload={onImageUpload} originalImage={originalImage} isLoading={isLoading} />
      <PromptInput 
        prompt={prompt}
        onPromptChange={onPromptChange}
        onImprovePrompt={onImprovePrompt}
        isLoading={isLoading}
        promptInputRef={promptInputRef}
        id="prompt-editor"
        label="2. Describe Your Edit"
        placeholder="e.g., 'Change my hair to pink' or 'Make it look like a vintage photograph'"
      />
      <button
        onClick={onGenerate}
        disabled={!originalImage || !prompt.trim() || isLoading}
        className="w-full flex items-center justify-center bg-[var(--accent-color)] text-white font-bold py-3 px-4 rounded-lg hover:bg-[var(--accent-color-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        {isLoading ? (
          <>
            <Spinner className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
            Generating...
          </>
        ) : (
          <>
            <WandIcon className="w-5 h-5 mr-2" />
            Generate Image
          </>
        )}
      </button>
      <ErrorDisplay error={error} />
    </div>
    <ResultDisplay result={editedResult} isLoading={isLoading} loadingMessage={loadingMessage} prompt={prompt} onDownload={onDownload} onCopyPrompt={onCopyPrompt} />
  </div>
);

interface CombineViewProps {
  originalImage: OriginalImage | null;
  originalImage2: OriginalImage | null;
  isLoading: boolean;
  error: string | null;
  prompt: string;
  editedResult: EditedResult | null;
  loadingMessage: string;
  promptInputRef: React.RefObject<HTMLTextAreaElement>;
  onImageUpload: (image: OriginalImage | null) => void;
  onImage2Upload: (image: OriginalImage | null) => void;
  onPromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onImprovePrompt: () => void;
  onGenerate: () => void;
  onDownload: (url: string, isVideo: boolean) => void;
  onCopyPrompt: (text: string) => void;
}

const CombineView: React.FC<CombineViewProps> = ({
  originalImage, originalImage2, isLoading, error, prompt, editedResult, loadingMessage, promptInputRef,
  onImageUpload, onImage2Upload, onPromptChange, onImprovePrompt, onGenerate, onDownload, onCopyPrompt
}) => (
  <div className="flex flex-col lg:flex-row gap-8">
    <div className="w-full lg:w-1/2 flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ImageUploader onImageUpload={onImageUpload} originalImage={originalImage} isLoading={isLoading} />
        <ImageUploader onImageUpload={onImage2Upload} originalImage={originalImage2} isLoading={isLoading} />
      </div>
       <PromptInput
          prompt={prompt}
          onPromptChange={onPromptChange}
          onImprovePrompt={onImprovePrompt}
          isLoading={isLoading}
          promptInputRef={promptInputRef}
          id="prompt-combine"
          label="Describe How to Combine Them"
          placeholder="e.g., 'Place the person from image 1 into the background of image 2.'"
       />
       <button
        onClick={onGenerate}
        disabled={!originalImage || !originalImage2 || !prompt.trim() || isLoading}
        className="w-full flex items-center justify-center bg-[var(--accent-color)] text-white font-bold py-3 px-4 rounded-lg hover:bg-[var(--accent-color-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        {isLoading ? (
          <>
            <Spinner className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
            Generating...
          </>
        ) : (
          <>
            <PhotoStackIcon className="w-5 h-5 mr-2" />
            Generate Combined Image
          </>
        )}
      </button>
      <ErrorDisplay error={error} />
    </div>
    <ResultDisplay result={editedResult} isLoading={isLoading} loadingMessage={loadingMessage} prompt={prompt} onDownload={onDownload} onCopyPrompt={onCopyPrompt} />
  </div>
);

interface VideoUploaderProps {
  onVideoUpload: (video: OriginalVideo | null) => void;
  originalVideo: OriginalVideo | null;
  isLoading: boolean;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoUpload, originalVideo, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (files: FileList | null) => {
    if (isLoading || !files || !files[0]) return;
    const file = files[0];
    const url = URL.createObjectURL(file);
    onVideoUpload({ file, url });
  };

  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (isLoading) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, [isLoading]);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (isLoading) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, [isLoading]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (isLoading) return;
    e.preventDefault();
    e.stopPropagation();
  }, [isLoading]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (isLoading) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  }, [isLoading, handleFileChange]);

  const onButtonClick = () => {
    if (originalVideo || isLoading) return;
    fileInputRef.current?.click();
  };
  
  const handleRemoveVideo = (e: React.MouseEvent) => {
    if (isLoading) return;
    e.stopPropagation();
    if (originalVideo) {
      URL.revokeObjectURL(originalVideo.url);
    }
    onVideoUpload(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-[var(--text-color-strong)] mb-2">1. Upload Video to Edit (Optional)</label>
      <div
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={onButtonClick}
        className={`relative flex justify-center items-center w-full h-64 px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors duration-200
          ${isDragging ? 'border-[var(--accent-color)] bg-[var(--bg-color)]' : 'border-[var(--border-color)] hover:border-[var(--accent-color)]'}
          ${originalVideo ? 'border-solid p-0 cursor-default' : 'cursor-pointer'}
          ${isLoading ? '!border-[var(--border-color)] cursor-not-allowed' : ''}`}
        role="button"
        tabIndex={isLoading ? -1 : 0}
      >
        {isLoading && (
            <div className="absolute inset-0 bg-[var(--card-bg-color)]/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10">
                <Spinner className="w-8 h-8 text-[var(--accent-color)]" />
                <p className="mt-2 text-sm text-[var(--text-color-strong)]">Working my magic...</p>
            </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={(e) => handleFileChange(e.target.files)}
          aria-hidden="true"
          disabled={isLoading}
        />
        {originalVideo ? (
          <>
            <video src={originalVideo.url} controls muted loop className={`h-full w-full object-contain rounded-md ${isLoading ? 'opacity-50' : ''}`} />
            <button 
                onClick={handleRemoveVideo} 
                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors disabled:cursor-not-allowed disabled:opacity-50" 
                aria-label="Remove video"
                disabled={isLoading}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </>
        ) : (
          <div className="space-y-1 text-center">
            <VideoIcon className="mx-auto h-12 w-12 text-[var(--text-color)]/50" />
            <p className="text-sm text-[var(--text-color)]">
              <span className="font-semibold text-[var(--accent-color)]">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-[var(--text-color)]/70">MP4, WEBM, MOV</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface UserInfoFormProps {
    onUserInfoSubmit: (userInfo: UserInfo) => void;
}

const UserInfoForm: React.FC<UserInfoFormProps> = ({ onUserInfoSubmit }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [formError, setFormError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !phone.trim()) {
            setFormError("All fields are required.");
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setFormError("Please enter a valid email address.");
            return;
        }
        setFormError('');
        onUserInfoSubmit({ name, email, phone });
    }

    return (
        <div className="w-full max-w-md mx-auto p-8 bg-[var(--card-bg-color)] rounded-xl shadow-lg border border-[var(--border-color)]">
            <div className="text-center mb-6">
                <UserIcon className="w-12 h-12 mx-auto text-[var(--accent-color)] mb-2" />
                <h2 className="text-xl font-bold text-[var(--text-color-strong)]">Creator Information</h2>
                <p className="text-sm text-[var(--text-color)]">Please provide your details to use the video service.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-[var(--text-color-strong)]">Full Name</label>
                    <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-[var(--input-bg-color)] border border-[var(--border-color)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[var(--text-color-strong)]">Email Address</label>
                    <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-[var(--input-bg-color)] border border-[var(--border-color)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-[var(--text-color-strong)]">Phone Number</label>
                    <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-[var(--input-bg-color)] border border-[var(--border-color)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm" />
                </div>
                 {formError && <p className="text-sm text-red-600">{formError}</p>}
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--accent-color)] hover:bg-[var(--accent-color-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-color)]">
                    Submit & Continue to Editor
                </button>
                <p className="text-xs text-center text-[var(--text-color)]/70 pt-2">
                    By clicking "Submit", your default email client will open with your details pre-filled to be sent to the developer for service usage tracking.
                </p>
            </form>
        </div>
    );
};

interface VideoPresetsSelectorProps {
    presets: VideoPreset[];
    selectedPreset: VideoPreset | null;
    onSelectPreset: (preset: VideoPreset) => void;
    isLoading: boolean;
}

const VideoPresetsSelector: React.FC<VideoPresetsSelectorProps> = ({ presets, selectedPreset, onSelectPreset, isLoading }) => (
    <div>
        <label className="block text-sm font-medium text-[var(--text-color-strong)] mb-2">2. Choose an Editing Style (Optional)</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {presets.map(preset => (
                <button
                    key={preset.id}
                    onClick={() => onSelectPreset(preset)}
                    disabled={isLoading}
                    className={`p-3 text-left rounded-lg border transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed
                        ${selectedPreset?.id === preset.id
                            ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)] shadow-lg'
                            : 'bg-[var(--card-bg-color)] border-[var(--border-color)] hover:border-[var(--accent-color)]'
                        }`}
                >
                    <p className="font-bold text-sm">{preset.name}</p>
                    <p className="text-xs opacity-80 mt-1">{preset.description}</p>
                </button>
            ))}
        </div>
    </div>
);


interface VideoViewProps {
  originalImage: OriginalImage | null;
  originalVideo: OriginalVideo | null;
  userInfo: UserInfo | null;
  isLoading: boolean;
  error: string | null;
  prompt: string;
  editedResult: EditedResult | null;
  loadingMessage: string;
  promptInputRef: React.RefObject<HTMLTextAreaElement>;
  videoPresets: VideoPreset[];
  selectedPreset: VideoPreset | null;
  onImageUpload: (image: OriginalImage | null) => void;
  onVideoUpload: (video: OriginalVideo | null) => void;
  onUserInfoSubmit: (userInfo: UserInfo) => void;
  onSelectPreset: (preset: VideoPreset) => void;
  onPromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onGenerate: () => void;
  onDownload: (url: string, isVideo: boolean) => void;
  onCopyPrompt: (text: string) => void;
}

const VideoView: React.FC<VideoViewProps> = ({
  originalVideo, userInfo, isLoading, error, prompt, editedResult, loadingMessage, promptInputRef,
  videoPresets, selectedPreset, onVideoUpload, onUserInfoSubmit, onSelectPreset, onPromptChange, onGenerate, onDownload, onCopyPrompt
}) => {
    if (!userInfo) {
        return <UserInfoForm onUserInfoSubmit={onUserInfoSubmit} />;
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
                <VideoUploader onVideoUpload={onVideoUpload} originalVideo={originalVideo} isLoading={isLoading} />
                <VideoPresetsSelector
                    presets={videoPresets}
                    selectedPreset={selectedPreset}
                    onSelectPreset={onSelectPreset}
                    isLoading={isLoading}
                />
                <div>
                    <label htmlFor="prompt-video" className="block text-sm font-medium text-[var(--text-color-strong)] mb-2">3. Describe the New Scene</label>
                    <div className="relative">
                    <textarea
                        ref={promptInputRef}
                        id="prompt-video"
                        value={prompt}
                        onChange={onPromptChange}
                        placeholder="e.g., 'A cinematic drone shot of a car driving on a mountain road at sunset.'"
                        className="w-full p-3 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg-color)] focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] transition-shadow resize-none overflow-hidden"
                        rows={4}
                        disabled={isLoading}
                        />
                    </div>
                    <p className="text-xs text-[var(--text-color)]/70 mt-2">
                        <strong>Note:</strong> Uploaded video's first frame will be used as a reference. Generation can take several minutes. Do not upload or request content that is sexually explicit, hateful, or harassing.
                    </p>
                </div>
                <button
                    onClick={onGenerate}
                    disabled={!prompt.trim() || isLoading}
                    className="w-full flex items-center justify-center bg-[var(--accent-color)] text-white font-bold py-3 px-4 rounded-lg hover:bg-[var(--accent-color-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                    {isLoading ? (
                    <>
                        <Spinner className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                        Generating Video...
                    </>
                    ) : (
                    <>
                        <VideoIcon className="w-5 h-5 mr-2" />
                        Generate Video
                    </>
                    )}
                </button>
                <ErrorDisplay error={error} />
            </div>
            <ResultDisplay result={editedResult} isLoading={isLoading} loadingMessage={loadingMessage} prompt={prompt} onDownload={onDownload} onCopyPrompt={onCopyPrompt} />
        </div>
    );
}


interface TrendingViewProps {
  sortedPromptIdeas: PromptCategory[];
  imageGender: 'male' | 'female' | 'unknown';
  onUsePrompt: (prompt: string, targetTab: Tab) => void;
}

const TrendingView: React.FC<TrendingViewProps> = ({ sortedPromptIdeas, onUsePrompt }) => (
  <div>
      <h2 className="text-2xl font-bold text-[var(--text-color-strong)] mb-1">Trending Prompts</h2>
      <p className="text-[var(--text-color)] mb-6">Get inspired by these popular editing ideas. Click any card to use the prompt!</p>
      <div className="space-y-8">
          {sortedPromptIdeas.map(category => (
              <div key={category.category}>
                  <h3 className="text-xl font-semibold text-[var(--text-color-strong)] mb-4 border-b-2 border-[var(--accent-color)]/50 pb-2">{category.category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.prompts.map((idea, index) => (
                          <div 
                              key={index} 
                              className="bg-[var(--card-bg-color)] p-4 rounded-lg border border-[var(--border-color)] shadow-sm hover:shadow-lg hover:border-[var(--accent-color)] transition-all cursor-pointer transform hover:-translate-y-1"
                              onClick={() => {
                                let targetTab: Tab = 'Editor';
                                if (category.category === "🖼️ Image Blends") targetTab = 'Combine';
                                if (category.category === "🎬 Video & Motion") targetTab = 'Video';
                                onUsePrompt(idea.prompt, targetTab);
                              }}
                              role="button"
                              tabIndex={0}
                          >
                              <p className="font-semibold text-sm text-[var(--text-color-strong)] mb-2">{idea.title}</p>
                              <p className="text-xs text-[var(--text-color)] opacity-80">{idea.prompt}</p>
                          </div>
                      ))}
                  </div>
              </div>
          ))}
      </div>
  </div>
);

interface HistoryViewProps {
  history: HistoryItem[];
  onShowDetail: (item: HistoryItem) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ history, onShowDetail }) => (
  <div>
    <h2 className="text-2xl font-bold text-[var(--text-color-strong)] mb-1">Your Creation History</h2>
    <p className="text-[var(--text-color)] mb-6">Review your past creations from this session. Click on any item to see details.</p>
    {history.length === 0 ? (
      <p className="text-center py-10 text-[var(--text-color)]/70">You haven't generated any content yet.</p>
    ) : (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {history.map(item => (
              <div 
                  key={item.id} 
                  className="relative group cursor-pointer aspect-square"
                  onClick={() => onShowDetail(item)}
              >
                  {item.type === 'video' ? (
                     <>
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-lg z-10">
                            <VideoIcon className="w-10 h-10 text-white opacity-80"/>
                        </div>
                        <img src={item.originalImage.base64} alt="Video thumbnail" className="w-full h-full object-cover rounded-lg shadow-md" />
                     </>
                  ) : (
                     <img src={item.result.imageUrl || ''} alt={item.prompt} className="w-full h-full object-cover rounded-lg shadow-md" />
                  )}

                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                      <EyeIcon className="w-10 h-10 text-white" />
                  </div>
              </div>
          ))}
      </div>
    )}
  </div>
);

interface HistoryDetailModalProps {
  item: HistoryItem;
  onClose: () => void;
  onUseEdit: (item: HistoryItem) => void;
  onDownload: (url: string, isVideo: boolean) => void;
}

const HistoryDetailModal: React.FC<HistoryDetailModalProps> = ({ item, onClose, onUseEdit, onDownload }) => {
  return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
          <div className="bg-[var(--card-bg-color)] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="w-full md:w-1/2 p-4">
                  <h3 className="font-bold text-lg text-[var(--text-color-strong)] mb-2">Original(s)</h3>
                  <div className={`grid ${item.type === 'combine' ? 'grid-cols-2 gap-2' : 'grid-cols-1'}`}>
                    {item.type === 'video' && item.originalVideo ? (
                        <video src={item.originalVideo.url} controls muted loop className="w-full rounded-lg border border-[var(--border-color)]" />
                    ) : (
                        <img src={item.originalImage.base64} alt="Original" className="w-full rounded-lg border border-[var(--border-color)]" />
                    )}
                    {item.type === 'combine' && item.originalImage2 && (
                         <img src={item.originalImage2.base64} alt="Original 2" className="w-full rounded-lg border border-[var(--border-color)]" />
                    )}
                  </div>
                   <h3 className="font-bold text-lg text-[var(--text-color-strong)] mt-4 mb-2">Prompt</h3>
                  <p className="text-sm bg-[var(--bg-color)] p-3 rounded-md border border-[var(--border-color)]">{item.prompt}</p>
              </div>
              <div className="w-full md:w-1/2 p-4 bg-[var(--bg-color)] md:rounded-r-xl">
                  <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-lg text-[var(--text-color-strong)]">Generated Result</h3>
                      <button onClick={onClose} className="p-1 rounded-full hover:bg-[var(--border-color)]">
                          <XMarkIcon className="w-5 h-5"/>
                      </button>
                  </div>
                  {item.result.imageUrl && <img src={item.result.imageUrl} alt="Result" className="w-full rounded-lg border border-[var(--border-color)]" />}
                  {item.result.videoUrl && <video src={item.result.videoUrl} controls autoPlay loop muted className="w-full rounded-lg border border-[var(--border-color)]" />}

                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <button onClick={() => onUseEdit(item)} className="flex-1 bg-[var(--accent-color)] text-white font-bold py-2 px-4 rounded-lg hover:bg-[var(--accent-color-hover)] transition-colors">
                          Use this Setup
                      </button>
                      <button onClick={() => onDownload(item.result.imageUrl || item.result.videoUrl!, !!item.result.videoUrl)} className="flex-1 bg-[var(--border-color)]/50 text-[var(--text-color-strong)] font-bold py-2 px-4 rounded-lg hover:bg-[var(--border-color)] transition-colors">
                          Download
                      </button>
                  </div>
              </div>
          </div>
      </div>
  );
};

interface CommunityViewProps {
  prompts: CommunityPrompt[];
  isLoading: boolean;
  onRefresh: () => void;
  onUsePrompt: (prompt: string, targetTab: Tab) => void;
}

const CommunityView: React.FC<CommunityViewProps> = ({ prompts, isLoading, onRefresh, onUsePrompt }) => {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', title: '', prompt: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.phone || !formData.title || !formData.prompt) {
            setSubmitStatus({ type: 'error', message: "All fields are required." });
            return;
        }
        setIsSubmitting(true);
        setSubmitStatus(null);
        try {
            const result = await shareCommunityPrompt(formData);
            setSubmitStatus({ type: 'success', message: result.message });
            setFormData({ name: '', email: '', phone: '', title: '', prompt: '' });
            setShowForm(false);
            onRefresh(); // Refresh the list of prompts
        } catch (error) {
            setSubmitStatus({ type: 'error', message: getFriendlyErrorMessage(error) });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div>
            <h2 className="text-2xl font-bold text-[var(--text-color-strong)] mb-1">Community Prompts</h2>
            <p className="text-[var(--text-color)] mb-6">Get inspired by prompts shared by other creators. Share your own masterpiece!</p>

            <div className="mb-8 p-4 bg-[var(--card-bg-color)] border border-[var(--border-color)] rounded-lg shadow-sm">
                {!showForm && (
                    <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-center bg-[var(--accent-color)] text-white font-bold py-3 px-4 rounded-lg hover:bg-[var(--accent-color-hover)] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        Share Your Own Prompt
                    </button>
                )}
                
                {showForm && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <h3 className="text-lg font-semibold text-[var(--text-color-strong)]">Share Your Prompt</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-[var(--text-color-strong)]">Name</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required className="mt-1 w-full p-2 bg-[var(--input-bg-color)] border border-[var(--border-color)] rounded-md focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]" />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-[var(--text-color-strong)]">Email</label>
                                <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} required className="mt-1 w-full p-2 bg-[var(--input-bg-color)] border border-[var(--border-color)] rounded-md focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]" />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-[var(--text-color-strong)]">Phone</label>
                                <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} required className="mt-1 w-full p-2 bg-[var(--input-bg-color)] border border-[var(--border-color)] rounded-md focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]" />
                            </div>
                        </div>
                        <div>
                             <label htmlFor="title" className="block text-sm font-medium text-[var(--text-color-strong)]">Prompt Title</label>
                             <input type="text" name="title" id="title" value={formData.title} onChange={handleInputChange} placeholder="e.g., 'Cyberpunk Warrior Princess'" required className="mt-1 w-full p-2 bg-[var(--input-bg-color)] border border-[var(--border-color)] rounded-md focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]" />
                        </div>
                        <div>
                            <label htmlFor="prompt" className="block text-sm font-medium text-[var(--text-color-strong)]">The Prompt</label>
                            <textarea name="prompt" id="prompt" value={formData.prompt} onChange={handleInputChange} rows={3} required className="mt-1 w-full p-2 bg-[var(--input-bg-color)] border border-[var(--border-color)] rounded-md focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]"></textarea>
                        </div>
                        <div className="text-xs text-[var(--text-color)]/70 p-2 bg-[var(--bg-color)] rounded-md border border-[var(--border-color)]">
                          <strong>Disclaimer:</strong> By submitting, you agree to make your prompt and name public. Your submission will be automatically reviewed for inappropriate content before being published.
                        </div>
                        {submitStatus && (
                            <div className={`p-3 rounded-md text-sm ${submitStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {submitStatus.message}
                            </div>
                        )}
                        <div className="flex items-center gap-4">
                            <button type="submit" disabled={isSubmitting} className="flex items-center justify-center bg-[var(--accent-color)] text-white font-bold py-2 px-4 rounded-lg hover:bg-[var(--accent-color-hover)] disabled:opacity-50 transition-colors">
                                {isSubmitting ? <><Spinner className="mr-2" />Submitting...</> : "Submit for Review"}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="py-2 px-4 rounded-lg text-sm font-medium text-[var(--text-color)] hover:bg-[var(--border-color)]/50 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {isLoading ? (
                <div className="text-center py-10"><Spinner className="w-8 h-8 mx-auto text-[var(--accent-color)]" /></div>
            ) : prompts.length === 0 ? (
                <p className="text-center py-10 text-[var(--text-color)]/70">No community prompts yet. Be the first to share one!</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {prompts.map(p => (
                        <div key={p.id} className="bg-[var(--card-bg-color)] p-4 rounded-lg border border-[var(--border-color)] shadow-sm flex flex-col justify-between">
                            <div>
                                <p className="font-semibold text-sm text-[var(--text-color-strong)] mb-2">{p.title}</p>
                                <p className="text-xs text-[var(--text-color)] opacity-80 mb-3">{p.prompt}</p>
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-[var(--border-color)]">
                                <p className="text-xs text-[var(--text-color)]/70">by {p.name}</p>
                                <button onClick={() => onUsePrompt(p.prompt, 'Editor')} className="px-2 py-1 bg-[var(--accent-color)]/10 text-[var(--accent-color)] text-xs font-semibold rounded-full hover:bg-[var(--accent-color)]/20 transition-colors">
                                    Use
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const extractFrameFromVideo = (videoFile: File, time: number = 0): Promise<File> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
            return reject(new Error("Could not get canvas context."));
        }
        video.onloadeddata = () => {
            video.currentTime = time;
        };
        video.onseeked = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                if (!blob) {
                    return reject(new Error("Canvas to Blob conversion failed."));
                }
                const frameFile = new File([blob], `frame-from-${videoFile.name}.png`, { type: 'image/png' });
                resolve(frameFile);
                URL.revokeObjectURL(video.src);
            }, 'image/png');
        };
        video.onerror = () => {
            reject(new Error("Error loading video file."));
            URL.revokeObjectURL(video.src);
        };
        video.src = URL.createObjectURL(videoFile);
        video.load();
    });
};


// --- Main App Component ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Editor');
  const [theme, setTheme] = useState<Theme>(localStorage.getItem('theme') as Theme || 'light');
  const [originalImage, setOriginalImage] = useState<OriginalImage | null>(null);
  const [originalImage2, setOriginalImage2] = useState<OriginalImage | null>(null);
  const [originalVideo, setOriginalVideo] = useState<OriginalVideo | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [editedResult, setEditedResult] = useState<EditedResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [imageGender, setImageGender] = useState<'male' | 'female' | 'unknown'>('unknown');
  const [showHistoryDetail, setShowHistoryDetail] = useState<HistoryItem | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(true);
  const [selectedPreset, setSelectedPreset] = useState<VideoPreset | null>(null);
  const [communityPrompts, setCommunityPrompts] = useState<CommunityPrompt[]>([]);
  const [isCommunityLoading, setIsCommunityLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  useEffect(() => {
    // FIX: Changed type of interval to be compatible with setInterval return type in different environments (browser vs. node).
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isLoading) {
      // Don't start the witty messages interval if a specific, non-witty message is already set.
      if (wittyLoadingMessages.includes(loadingMessage) || videoLoadingMessages.includes(loadingMessage) || loadingMessage === '') {
        const messages = activeTab === 'Video' ? videoLoadingMessages : wittyLoadingMessages;
        // Set initial message immediately
        if (loadingMessage === '') {
            setLoadingMessage(messages[0]);
        }
        interval = setInterval(() => {
          setLoadingMessage(prev => {
            const currentIndex = messages.indexOf(prev);
            const nextIndex = (currentIndex + 1) % messages.length;
            return messages[nextIndex];
          });
        }, 2500);
      }
    }
    return () => {
        if (interval) clearInterval(interval);
    };
  }, [isLoading, activeTab, loadingMessage]);


  const fetchCommunityPrompts = useCallback(async () => {
    setIsCommunityLoading(true);
    try {
        const prompts = await getCommunityPrompts();
        setCommunityPrompts(prompts);
    } catch(err) {
        setError(getFriendlyErrorMessage(err));
    } finally {
        setIsCommunityLoading(false);
    }
  }, []);

  useEffect(() => {
      if (activeTab === 'Community') {
          fetchCommunityPrompts();
      }
  }, [activeTab, fetchCommunityPrompts]);
  
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const handleImageUpload = async (image: OriginalImage | null) => {
    setOriginalImage(image);
    setOriginalVideo(null);
    setImageGender('unknown'); // Reset on new image

    if (image) {
        if (isLoading) return; // Safeguard against uploads during an ongoing operation

        setIsLoading(true);
        setLoadingMessage("Analyzing image...");
        setError(null);
        
        try {
            const isMale = await classifyImageForMale(image.file);
            setImageGender(isMale ? 'male' : 'female');
        } catch (e) {
            console.error("Gender classification failed:", e);
            // Non-critical error, so we don't show a blocking message to the user
            setImageGender('unknown');
        } finally {
            setIsLoading(false);
            setLoadingMessage(""); // Clear specific message
        }
    }
  };
  
  const handleImage2Upload = (image: OriginalImage | null) => {
    setOriginalImage2(image);
  };

  const handleVideoUpload = (video: OriginalVideo | null) => {
    setOriginalVideo(video);
    setOriginalImage(null); // Clear image if video is uploaded
    setImageGender('unknown'); // Reset for consistency
  };

  const handleUserInfoSubmit = (info: UserInfo) => {
    sendUserInfoToDeveloper(info);
    setUserInfo(info);
  };
  
  const handleGenerate = async () => {
    if (!originalImage || !prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setEditedResult(null);

    try {
      const result = await editImageWithNanoBanana(originalImage.file, prompt);
      setEditedResult(result);
      const newHistoryItem: HistoryItem = {
        id: new Date().toISOString(),
        originalImage,
        prompt,
        result,
        type: 'edit',
      };
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 19)]);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCombineGenerate = async () => {
    if (!originalImage || !originalImage2 || !prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setEditedResult(null);

    try {
      const result = await combineImagesWithNanoBanana(originalImage.file, originalImage2.file, prompt);
      setEditedResult(result);
      const newHistoryItem: HistoryItem = {
        id: new Date().toISOString(),
        originalImage,
        originalImage2,
        prompt,
        result,
        type: 'combine',
      };
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 19)]);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVideoGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setEditedResult(null);

    let referenceImageFile: File | null = null;

    try {
        if (originalVideo) {
            setLoadingMessage("Extracting reference frame from video...");
            referenceImageFile = await extractFrameFromVideo(originalVideo.file);
        } else if (originalImage) {
            referenceImageFile = originalImage.file;
        }

        const result = await generateVideoWithVeo(prompt, referenceImageFile, (progressMessage) => {
            setLoadingMessage(progressMessage);
        });
        setEditedResult(result);

        // Create a thumbnail for history
        let thumbnailFile = referenceImageFile;
        if (!thumbnailFile && originalVideo) {
            thumbnailFile = await extractFrameFromVideo(originalVideo.file);
        }
        
        if (thumbnailFile) {
            const reader = new FileReader();
            reader.readAsDataURL(thumbnailFile);
            reader.onloadend = () => {
                const base64data = reader.result as string;
                const historyImage: OriginalImage = { file: thumbnailFile!, base64: base64data };
                const newHistoryItem: HistoryItem = {
                    id: new Date().toISOString(),
                    originalImage: historyImage, // Thumbnail
                    originalVideo: originalVideo || undefined,
                    prompt,
                    result,
                    type: 'video',
                };
                setHistory(prev => [newHistoryItem, ...prev.slice(0, 19)]);
            }
        }
    } catch (err) {
        setError(getFriendlyErrorMessage(err));
    } finally {
        setIsLoading(false);
    }
  }
  
  const handleImprovePrompt = async () => {
    if(!prompt.trim() || isLoading) return;
    const originalLoading = isLoading;
    setIsLoading(true);
    setError(null);
    try {
        const improved = await improvePrompt(prompt);
        setPrompt(improved);
    } catch (err) {
        setError(getFriendlyErrorMessage(err));
    } finally {
        setIsLoading(originalLoading);
    }
  }

  const handleUsePrompt = (newPrompt: string, targetTab: Tab) => {
    setPrompt(newPrompt);
    setActiveTab(targetTab);
    setTimeout(() => {
        const textarea = promptInputRef.current;
        if (textarea) {
            textarea.focus();
            textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, 100);
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };
  
  const handleUseHistoryItem = (item: HistoryItem) => {
    handleImageUpload(item.originalImage);
    setPrompt(item.prompt);
    setEditedResult(item.result);
    if (item.type === 'combine' && item.originalImage2) {
      setOriginalImage2(item.originalImage2);
      setActiveTab('Combine');
    } else if (item.type === 'video') {
      setOriginalVideo(item.originalVideo || null);
      setOriginalImage2(null);
      setActiveTab('Video');
    } else {
      setOriginalImage2(null);
      setOriginalVideo(null);
      setActiveTab('Editor');
    }
    setShowHistoryDetail(null);
  };

  const downloadContent = (url: string, isVideo: boolean) => {
    const link = document.createElement('a');
    link.href = url;
    const extension = isVideo ? 'mp4' : 'png';
    link.download = `magic-creation-${Date.now()}.${extension}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  const handleFeedbackClick = () => {
    const subject = "Feedback for Magic Editor";
    const body = "Hi Ashish,\n\nI have some feedback about the Magic Editor application:\n\n";
    window.location.href = `mailto:ashishkumr.shaw@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  
  const handleSelectPreset = (preset: VideoPreset) => {
    if (selectedPreset?.id === preset.id) {
        setPrompt(currentPrompt => currentPrompt.replace(preset.prompt, '').trim());
        setSelectedPreset(null);
    } else {
        let newPrompt = prompt;
        if (selectedPreset) {
            newPrompt = newPrompt.replace(selectedPreset.prompt, '').trim();
        }
        setPrompt(`${preset.prompt} ${newPrompt}`.trim());
        setSelectedPreset(preset);
    }
  };

  const sortedPromptIdeas = useMemo(() => {
    const defaultOrder = ['For Boys', 'For Girls', '🔥 Top Trending', '🖼️ Image Blends', '🎬 Video & Motion', '✨ Spiritual & Divine', '😏 Sarcastic Twists'];
    const categoryOrder = {
      'female': ['For Girls', '🔥 Top Trending', 'For Boys', '🖼️ Image Blends', '🎬 Video & Motion', '✨ Spiritual & Divine', '😏 Sarcastic Twists'],
      'male':   ['For Boys', '🔥 Top Trending', 'For Girls', '🖼️ Image Blends', '🎬 Video & Motion', '✨ Spiritual & Divine', '😏 Sarcastic Twists'],
      'unknown': defaultOrder,
    };

    const currentOrder = categoryOrder[imageGender] || defaultOrder;

    const reorderedCategories = [...promptIdeas].sort((a, b) => {
      return currentOrder.indexOf(a.category) - currentOrder.indexOf(b.category);
    });

    return reorderedCategories;
  }, [imageGender]);

  const renderContent = () => {
    switch (activeTab) {
      case 'Editor':
        return <EditorView 
          originalImage={originalImage}
          isLoading={isLoading}
          error={error}
          prompt={prompt}
          editedResult={editedResult}
          loadingMessage={loadingMessage}
          promptInputRef={promptInputRef}
          onImageUpload={handleImageUpload}
          onPromptChange={handlePromptChange}
          onImprovePrompt={handleImprovePrompt}
          onGenerate={handleGenerate}
          onDownload={downloadContent}
          onCopyPrompt={copyToClipboard}
        />;
      case 'Combine':
        return <CombineView
          originalImage={originalImage}
          originalImage2={originalImage2}
          isLoading={isLoading}
          error={error}
          prompt={prompt}
          editedResult={editedResult}
          loadingMessage={loadingMessage}
          promptInputRef={promptInputRef}
          onImageUpload={handleImageUpload}
          onImage2Upload={handleImage2Upload}
          onPromptChange={handlePromptChange}
          onImprovePrompt={handleImprovePrompt}
          onGenerate={handleCombineGenerate}
          onDownload={downloadContent}
          onCopyPrompt={copyToClipboard}
        />;
      case 'Video':
        return <VideoView
            originalImage={originalImage}
            originalVideo={originalVideo}
            userInfo={userInfo}
            isLoading={isLoading}
            error={error}
            prompt={prompt}
            editedResult={editedResult}
            loadingMessage={loadingMessage}
            promptInputRef={promptInputRef}
            videoPresets={videoPresets}
            selectedPreset={selectedPreset}
            onImageUpload={handleImageUpload}
            onVideoUpload={handleVideoUpload}
            onUserInfoSubmit={handleUserInfoSubmit}
            onSelectPreset={handleSelectPreset}
            onPromptChange={handlePromptChange}
            onGenerate={handleVideoGenerate}
            onDownload={downloadContent}
            onCopyPrompt={copyToClipboard}
        />;
      case 'Trending':
        return <TrendingView 
          sortedPromptIdeas={sortedPromptIdeas}
          imageGender={imageGender}
          onUsePrompt={handleUsePrompt}
        />;
      case 'Community':
        return <CommunityView
            prompts={communityPrompts}
            isLoading={isCommunityLoading}
            onRefresh={fetchCommunityPrompts}
            onUsePrompt={handleUsePrompt}
        />;
      case 'History':
        return <HistoryView 
          history={history}
          onShowDetail={setShowHistoryDetail}
        />;
      default:
        return null;
    }
  };
  
  return (
    <>
      {showDisclaimer && <DisclaimerModal onAgree={() => setShowDisclaimer(false)} language={language} setLanguage={setLanguage} />}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        onFeedbackClick={handleFeedbackClick}
      />
      <main className="container mx-auto p-4 sm:p-6">
        {renderContent()}
      </main>
      <footer className="text-center p-4 text-xs text-[var(--text-color)]/60 border-t border-[var(--border-color)] mt-8">
        <p>&copy; {new Date().getFullYear()} Magic Editor. All Rights Reserved. Created by Ashish Kumar Shaw.</p>
      </footer>

      {showHistoryDetail && 
        <HistoryDetailModal 
          item={showHistoryDetail}
          onClose={() => setShowHistoryDetail(null)}
          onUseEdit={handleUseHistoryItem}
          onDownload={downloadContent}
        />
      }
    </>
  );
};

export default App;
