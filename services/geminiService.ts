
import { GoogleGenAI, Type } from "@google/genai";
import { PromptType, FileAttachment } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a single image from a text prompt and returns the data URL.
 */
export const generateImageFromPrompt = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    const textPart = parts.find(p => p.text);
    if (textPart) {
        throw new Error(`Model tidak menghasilkan gambar. Alasan: ${textPart.text}`);
    }
    
    throw new Error("No image data returned from model (likely blocked or safety triggered).");
  } catch (error: any) {
    console.error("Gemini Image API Error:", error);
    
    let userMessage = error.message || "Failed to generate image.";
    const errStr = typeof error === 'string' ? error : JSON.stringify(error);
    
    if (errStr.includes("429") || errStr.toLowerCase().includes("quota")) {
      userMessage = "Kuota API harian telah habis atau batas kecepatan terlampaui. Silakan tunggu beberapa menit atau coba lagi nanti.";
    } else if (errStr.includes("block") || errStr.includes("safety")) {
      userMessage = "Permintaan gambar ditolak oleh sistem keamanan AI karena mengandung konten sensitif.";
    }
    
    throw new Error(userMessage);
  }
};

/**
 * Generates high-quality audio from text.
 */
export const generateVoiceOver = async (
  text: string, 
  voiceName: string, 
  style: string, 
  language: string
): Promise<string> => {
  try {
    const fullPrompt = `Style: ${style}. Language: ${language}. Script: ${text}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: fullPrompt }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned.");
    
    return base64Audio;
  } catch (error: any) {
    console.error("Gemini TTS Error:", error);
    let userMessage = error.message || "Failed to generate voice over.";
    const errStr = typeof error === 'string' ? error : JSON.stringify(error);
    
    if (errStr.includes("429") || errStr.toLowerCase().includes("quota")) {
      userMessage = "Kuota Voice Over harian habis. Silakan coba lagi nanti.";
    }
    throw new Error(userMessage);
  }
};

export const generatePromptResponse = async (
  instruction: string,
  attachments: FileAttachment[],
  type: PromptType,
  options?: {
    duration?: number;
    hasVoiceOver?: boolean;
    ratio?: string;
    language?: string;
  }
) => {
  let modelName = 'gemini-3-pro-preview';
  let config: any = {
    temperature: 0.8,
  };

  const ratioMapping: Record<string, string> = {
    "4:4": "1:1",
    "1:1": "1:1",
    "16:9": "16:9",
    "9:16": "9:16",
    "4:3": "4:3",
    "3:4": "3:4"
  };

  const selectedRatio = ratioMapping[options?.ratio || "1:1"] || "1:1";
  const selectedLang = options?.language || "Bahasa Indonesia";

  if (type === 'UGC_CONTENT') {
    modelName = 'gemini-2.5-flash-image';
    config.imageConfig = {
      aspectRatio: selectedRatio
    };
  }
  
  const fileParts = attachments.map(att => ({
    inlineData: {
      mimeType: att.file.type,
      data: att.base64
    }
  }));

  let systemInstruction = "";

  switch (type) {
    case 'SORA_2':
      systemInstruction = `You are a world-class Sora 2 Prompt Engineer. Transform user instructions into highly detailed, cinematic prompts. Output ONLY the refined prompt text.`;
      break;
    
    case 'VEO_3_JSON':
      systemInstruction = `You are a Google Veo 3.1 JSON Prompt Architect. Create valid JSON ONLY.`;
      config.responseMimeType = "application/json";
      config.responseSchema = {
        type: Type.OBJECT,
        properties: {
          prompt: { type: Type.STRING },
          negative_prompt: { type: Type.STRING },
          aspect_ratio: { type: Type.STRING },
          resolution: { type: Type.STRING },
          scene_dynamics: { type: Type.STRING },
        },
        required: ['prompt', 'negative_prompt', 'aspect_ratio', 'resolution', 'scene_dynamics'],
      };
      break;

    case 'STORYBOARD':
      const duration = options?.duration || 15;
      const sceneCount = duration === 15 ? 3 : duration === 30 ? 6 : 12;
      const hasVoiceOver = !!options?.hasVoiceOver;
      
      systemInstruction = `You are a Master Storyboard Artist specializing in cinematic visual storytelling. 
      Output valid JSON ONLY.
      
      TASK: Create ${sceneCount} scenes for a ${duration}s video in ${selectedLang}.
      ASPECT RATIO: ${selectedRatio}.

      DIALOG/NARRATION BEHAVIOR (Dialog Toggle is ${hasVoiceOver ? 'ON' : 'OFF'}):
      - If Dialog is ON: Characters MUST speak. Embed character dialogue/scripts directly into the 'video_animation_prompt.prompt' as part of the action (e.g., "The character looks at the camera and says: '...'"). Leave the root 'narration' field as an EMPTY STRING ("").
      - If Dialog is OFF: No character speech. Provide a rich background narration in the root 'narration' field that describes the scene's emotional weight or context.

      VISUAL VARIATION (CAMERA ANGLES):
      Intelligently apply diverse camera angles to the 'image_prompt' to prevent monotony. Use:
      1. Long Shot (LS)
      2. Medium Shot (MS)
      3. Close Up (CU)
      4. Extreme Close Up (ECU)
      5. Front View (Tampak Depan)
      6. Side View (Tampak Samping)
      7. Back View (Tampak Belakang)
      8. Low Angle (Tampak Bawah)
      9. High Angle (Tampak Atas)
      
      Select the angle that best enhances the specific narrative moment and provides a professional cinematic flow.`;
      
      config.responseMimeType = "application/json";
      config.responseSchema = {
        type: Type.OBJECT,
        properties: {
          story_summary: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                scene_number: { type: Type.INTEGER },
                title: { type: Type.STRING },
                narration: { type: Type.STRING },
                image_prompt: { type: Type.STRING },
                video_animation_prompt: {
                  type: Type.OBJECT,
                  properties: {
                    prompt: { type: Type.STRING },
                    negative_prompt: { type: Type.STRING },
                    camera_motion: { type: Type.STRING },
                    scene_vibe: { type: Type.STRING }
                  },
                  required: ['prompt', 'negative_prompt', 'camera_motion', 'scene_vibe']
                }
              },
              required: ['scene_number', 'title', 'narration', 'image_prompt', 'video_animation_prompt']
            }
          }
        },
        required: ['story_summary', 'scenes']
      };
      break;

    case 'UGC_CONTENT':
      const ugcHasScript = !!options?.hasVoiceOver;
      const ugcLang = options?.language || "Bahasa Indonesia";

      systemInstruction = `You are a professional UGC Content Specialist and Product Marketing Expert. 
      
      STRICT REQUIREMENT: 
      - THE VIDEO MUST BE A SINGLE CONTINUOUS SHOT (ONE ROLL). 
      - NO TRANSITIONS, NO CUTS, NO MULTIPLE SCENES.
      
      TASK:
      1. GENERATE a high-fidelity product marketing image.
      2. PRODUCE a "JSONPROMT" (structured JSON) for video generation that is ONE CONTINUOUS TAKE.
      3. SCRIPT BEHAVIOR (Script Toggle is ${ugcHasScript ? 'ON' : 'OFF'}):
         - If ON: Create a promotional video where a character speaks directly to the camera in ${ugcLang} for exactly 5 seconds, followed by 3 seconds of posing or modeling without transitions. The prompt MUST state: "One continuous roll: The character speaks to the camera for 5s: '...' then immediately poses stylishly for 3s."
         - If OFF: The video is one continuous roll of the character modeling or promoting the product visually.
      4. CINEMATOGRAPHY: Stable camera, single take, no editing cuts.
      5. WRITE a persuasive social media CAPTION in Indonesian.

      JSON STRUCTURE:
      {
        "video_prompt": {
          "prompt": "One continuous roll, no cuts: Cinematic product showcase matching the image. ${ugcHasScript ? 'Character speaks for 5s then poses for 3s.' : ''}",
          "negative_prompt": "cuts, transitions, multiple scenes, fast cuts, shaky camera, low quality, slideshow style",
          "aspect_ratio": "${selectedRatio}",
          "resolution": "1080p",
          "scene_dynamics": "Single take, stable cinematic movement"
        },
        "caption": "Copy persuasive... #HastagTerbaik #ProductViral"
      }
      
      Return TWO parts: One Image Part and One Text Part containing only the JSON.`;
      break;
  }

  const promptParts = [
    ...fileParts,
    { text: instruction || "Generate content based on your instructions." }
  ];

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: promptParts },
      config: {
        ...config,
        systemInstruction,
      },
    });

    if (type === 'UGC_CONTENT') {
      let imageData = "";
      let textData = "";
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        } else if (part.text) {
          textData = part.text;
        }
      }
      
      if (!imageData && !textData) {
          throw new Error("Sistem gagal menghasilkan konten UGC (Batas kuota atau alasan keamanan).");
      }
      
      return JSON.stringify({ image: imageData, data: textData });
    }

    return response.text || "";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    let userMessage = error.message || "Failed to generate content.";
    const errStr = typeof error === 'string' ? error : JSON.stringify(error);
    
    if (errStr.includes("429") || errStr.toLowerCase().includes("quota")) {
      userMessage = "Maaf, kuota harian sistem sedang penuh atau batas kecepatan terlampaui. Silakan coba kembali dalam beberapa saat.";
    }
    throw new Error(userMessage);
  }
};
