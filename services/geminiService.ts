
import { GoogleGenAI, Type } from "@google/genai";
import { BotVariable } from "../types";

/**
 * Generates a professional bot description and system prompt using Gemini API.
 * Uses gemini-3-flash-preview for efficient text generation.
 */
export const generateBotPrompt = async (
  name: string, 
  industry: string, 
  existingDesc: string
): Promise<{ description: string; systemPrompt: string }> => {
  // Initialize right before use to ensure the latest API key from environment is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are an expert AI Voice Bot configurator. 
    I need you to generate a professional description and a detailed system prompt (instructions) for a voice bot.
    
    Bot Name: ${name}
    Industry: ${industry}
    Context: ${existingDesc}

    # Voice Interaction Standards (CRITICAL)
    The generated "systemPrompt" MUST adhere to these voice-first rules:
    1. **Strictly Colloquial (去书面化)**: Use spoken Chinese particles (e.g., '啊', '呢', '吧') naturally. Avoid formal connectors like '因此', '然而'. Use '咱们' instead of '我们'.
    2. **Anti-Robotic (拒绝机器味)**: NEVER start sentences with '我理解', '好的', or '我已经记录'. React directly to the intent.
    3. **Short & Linear**: Sentences must be short (speakable in one breath). Break long info into multiple turns.
    4. **Internal Monologue (思维链)**: Instruct the bot to perform a brief <thought> analysis before speaking to ensure it doesn't hallucinate or interrupt wrongly.

    Please output a JSON object with the following structure:
    {
      "description": "A short, professional description of the bot's purpose (max 50 words, in Chinese)",
      "systemPrompt": "A detailed system instruction for the LLM to act as this agent. Include tone, role, and rules. (In Chinese)"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: 'A short, professional description of the bot (in Chinese).',
            },
            systemPrompt: {
              type: Type.STRING,
              description: 'A detailed system instruction for the AI bot (in Chinese).',
            },
          },
          required: ['description', 'systemPrompt'],
        },
      }
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Error generating prompt:", error);
    throw error;
  }
};

/**
 * Advanced Prompt Generator handling Multimodal Input (Text + Images) and Variable Injection.
 * Enhanced with CoT and Noise Filtering logic.
 */
export const generateAdvancedBotPrompt = async (params: {
  industry: string;
  scenario: string;
  userText: string;
  imageBase64?: string; // base64 string without data header
  variables: BotVariable[];
}): Promise<{ description: string; systemPrompt: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 1. Construct Variable Context String
  const variableContext = params.variables
    .map(v => `- ${v.name} (${v.description || 'No desc'})`)
    .join('\n');

  // 2. Construct the Meta-Prompt (The prompt to generate the prompt)
  const metaPrompt = `
    # Role
    You are a Senior Voice Bot Prompt Engineer. Your task is to analyze the user's business requirements and generate a production-ready System Prompt for an AI Voice Bot.

    # Context
    - Industry: ${params.industry}
    - Scenario: ${params.scenario}
    
    # Available Variables
    The system has the following variables defined. You MUST use them in the generated prompt where applicable, using the format {{variable_name}}.
    ${variableContext}

    # Task
    1. Analyze the user's input (Text and Image) to understand the business logic, flow, and tone.
    2. Create a "Description" summarizing the bot's purpose.
    3. Create a comprehensive "System Prompt" following the structure below.

    # Generated System Prompt Requirements (CRITICAL)
    The 'systemPrompt' you output MUST include specific instructions for the AI model to behave like a HUMAN on a phone call.

    ## 1. Voice Style & Tone
    - **Strictly Spoken Chinese**: Use "口语". Use sentence particles (啊, 呢, 吧) to sound friendly. Avoid formal words (e.g., use "说" instead of "表示").
    - **Anti-AI Mannerisms**: NEVER identify as an AI/Robot unless asked. NEVER say "I understand" (我理解) as a filler.
    - **Short Sentence Rule**: Human memory is short in phone calls. Keep responses under 50 words. Break long explanations.
    - **Natural Variable Reading**: Instruct to read numbers/dates naturally (e.g., "5月20号" not "2024-05-20").

    ## 2. Advanced Logic & Noise Filtering (The "Brain")
    You MUST instruct the bot to use an **Internal Monologue** mechanism to handle interruptions and background noise. 
    Add a section in the generated prompt called "### Interaction Protocol":
    
    "Before generating a spoken response, you must perform a **Silent Analysis** wrapped in <thought> tags to decide if you should speak."

    **Analysis Rules:**
    1. **Completeness Check (半句识别)**: Is the user's sentence complete? If they stopped in the middle (e.g., "其实我觉得..."), output <action>WAIT</action> or a filler like "嗯?".
    2. **Context Exclusion (上下文无关识别)**: Is the input relevant to our conversation? If the user is talking to someone else (Bystander Speech) or scolding a pet, output <action>IGNORE</action>.
    3. **Standard Reply**: If valid, output the spoken response directly (without action tags).

    # Input Data
    User Text Requirement: "${params.userText}"
  `;

  // 3. Prepare Contents (Multimodal)
  const parts: any[] = [{ text: metaPrompt }];
  
  if (params.imageBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/png', // Assuming PNG or JPEG
        data: params.imageBase64
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: 'Bot description summary.',
            },
            systemPrompt: {
              type: Type.STRING,
              description: 'The full generated system prompt markdown.',
            },
          },
          required: ['description', 'systemPrompt'],
        },
      }
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Error generating advanced prompt:", error);
    throw error;
  }
};
