import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { FileData } from "../types";

// --- SYSTEM INSTRUCTIONS ---

const ANALYST_INSTRUCTION = `
You are a Senior Mathematical Analyst. 
Your task is to analyze the provided input material (files, images, text) and extract the core mathematical concepts, identify the base difficulty level, and list any specific constraints or variables found. 
Output a concise summary.
`;

const ARCHITECT_INSTRUCTION = `
### ROLE
You are the "Math Architect," designed to construct high-level, rigorous, and solvable mathematics problems based on an analyst's report.

### OUTPUT FORMATTING RULES (STRICT)
1. **Structure:** Use the EXACT headers defined in the template below.
2. **Formatting:** Use lists for 'Given' variables.
3. **Math:** Use \`$$\` delimiters for ALL major equations (display math).
4. **Final Answer:** Must be enclosed in \`\\boxed{}\` within a display math block.

### RESPONSE TEMPLATE
---
## Generated Problem
### Problem Statement
[Intro sentence]
* $var = val$

**Goal:** [Objective]

## Difficulty Analysis
[Brief explanation]

## Step-by-Step Solution
### Step 1: [Name]
[Text]
$$
[Equation]
$$

### Step 2: [Name]
[Text]
$$
[Equation]
$$

### Final Answer
$$
\\boxed{[Result]}
$$

## Visualization Code (Python)
[Python code if applicable, otherwise omit]
---
`;

// --- HELPER FUNCTIONS ---

const getAnalystSummary = async (topic: string, files: FileData[], ai: GoogleGenAI): Promise<string> => {
    // Step 1: The Analyst (Cost-Optimized via Flash model)
    // Uses gemini-2.5-flash to read heavy context/files cheaply.
    
    if (files.length === 0 && !topic) return "No specific context provided. Generate a general problem.";

    const prompt = `
    TOPIC: ${topic || "Not specified"}
    TASK: Analyze the attached materials. Identify:
    1. Core Mathematical Topic & Concepts
    2. Base Difficulty Level
    3. Key Constraints / Variables
    `;

    const parts: any[] = [{ text: prompt }];
    files.forEach(file => {
        parts.unshift({
            inlineData: { data: file.base64, mimeType: file.mimeType },
        });
    });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: { 
                systemInstruction: ANALYST_INSTRUCTION,
                temperature: 0.5 
            }
        });
        return response.text || "Analysis failed.";
    } catch (e) {
        console.warn("Analyst pass failed, proceeding with raw prompt.", e);
        return "Analyst could not extract context. Proceed with raw user topic.";
    }
};

// --- MAIN EXPORT ---

export const generateProblem = async (
  topic: string,
  files: FileData[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 1. Run Analyst Pass
  const analystSummary = await getAnalystSummary(topic, files, ai);

  // 2. Run Architect Pass
  // Using gemini-3-pro-preview for complex text synthesis.
  // Note: Thinking budget is removed to optimize costs.
  
  const userPrompt = `
    ### ANALYST REPORT
    ${analystSummary}

    ### USER REQUEST
    TOPIC: ${topic || "See Analyst Report"}
    TASK: Create a rigorous problem ~1.5x harder than the base difficulty identified in the report.
    Ensure the problem is solvable and academically sound.
  `;

  const parts: any[] = [{ text: userPrompt }];
  
  // We re-attach files to the Architect for deep reference if needed, 
  // but the Analyst report guides the generation.
  files.forEach(file => {
      parts.unshift({
          inlineData: {
            data: file.base64,
            mimeType: file.mimeType,
          },
      });
  });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview", 
      contents: {
        parts: parts,
      },
      config: {
        systemInstruction: ARCHITECT_INSTRUCTION,
        temperature: 0.7,
        // thinkingConfig removed for cost optimization
      },
    });

    return response.text || "Error: No text generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateProblemImage = async (problemDescription: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        // Only called when user explicitly requests visualization
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [
                    { text: `Create a precise, academic, and clear mathematical visualization for this problem: ${problemDescription}. The style should be like a high-quality textbook diagram. Clean lines, white background, distinct geometric shapes, black ink.` }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: "16:9",
                    imageSize: "1K"
                }
            }
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image data found in response");
    } catch (error) {
        console.error("Image Gen Error:", error);
        throw error;
    }
}
