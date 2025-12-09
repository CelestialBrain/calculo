import { GoogleGenAI, GenerateContentResponse, Type, Schema } from "@google/genai";
import { FileData, DebugMetrics, Flashcard, GenerationMode, QuizQuestion, MathProblemState } from "../types";

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

export interface DebugUpdate {
    analystReport?: string;
    debugPrompt?: string;
    model?: string;
}

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

const runArchitectMode = async (
    ai: GoogleGenAI, 
    analystSummary: string, 
    topic: string, 
    files: FileData[], 
    difficulty: number
) => {
    let instructionOverride = "";
    if (difficulty === 1) instructionOverride = "Create a problem of EQUAL difficulty. Focus on reinforcement and conceptual clarity.";
    else if (difficulty === 2) instructionOverride = "Create a problem slightly harder (1.2x). Introduce one new constraint or minor twist.";
    else if (difficulty === 3) instructionOverride = "Create a problem 1.5x HARDER. Combine concepts from different areas.";
    else if (difficulty === 4) instructionOverride = "Create a significantly harder problem (2.0x). Require deep insight and multiple solution stages.";
    else if (difficulty === 5) instructionOverride = "Create an OLYMPIAD-LEVEL problem. Require abstract proof, novel application, or exceptional problem-solving creativity.";
    else instructionOverride = "Create a problem 1.5x HARDER."; 

    const debugPrompt = `
      ### ANALYST REPORT
      ${analystSummary}
  
      ### USER REQUEST
      TOPIC: ${topic || "See Analyst Report"}
      DIFFICULTY LEVEL: ${difficulty}/5
      INSTRUCTION: ${instructionOverride}
      TASK: Based on the instruction above, create a rigorous math problem.
      Ensure the problem is solvable and academically sound.
    `;
    
    const parts: any[] = [{ text: debugPrompt }];
    files.forEach(file => {
        parts.unshift({ inlineData: { data: file.base64, mimeType: file.mimeType } });
    });

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: { parts },
        config: { systemInstruction: ARCHITECT_INSTRUCTION, temperature: 0.7 },
    });

    return { text: response.text, prompt: debugPrompt, usage: response.usageMetadata };
};

const runFlashcardMode = async (ai: GoogleGenAI, analystSummary: string, topic: string) => {
    const prompt = `
    Based on the provided analysis, generate 5-8 "Deep Concept" flashcards.
    DO NOT generate generic definitions (e.g., "What is a derivative?").
    INSTEAD, generate specific application rules, "Gotchas", or conditions for using theorems.

    Examples of Good Cards:
    - Front: "Condition for using L'Hopital's Rule" -> Back: "Limit must be in indeterminate form 0/0 or infinity/infinity."
    - Front: "Derivative of sin(2x) (Chain Rule)" -> Back: "cos(2x) * 2"

    ANALYST REPORT:
    ${analystSummary}
    
    TOPIC FOCUS: ${topic}
    `;

    const schema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.INTEGER },
                front: { type: Type.STRING, description: "The concept name or term" },
                back: { type: Type.STRING, description: "The definition, formula, or concise explanation. Use LaTeX for math." },
                category: { type: Type.STRING, description: "The sub-topic (e.g. 'Calculus')" }
            },
            required: ["id", "front", "back", "category"]
        }
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.3
        }
    });

    return { text: response.text, prompt, usage: response.usageMetadata };
};

const runQuizMode = async (ai: GoogleGenAI, analystSummary: string, topic: string, difficulty: number) => {
    const prompt = `
    Generate a ${difficulty >= 4 ? 'challenging' : 'standard'} multiple-choice quiz (5 questions).

    CRITICAL FORMATTING RULES:
    1. **Use LaTeX for ALL Math:** Every variable, number, or equation MUST be wrapped in '$' delimiters.
       - Bad: "Find x where x^2 = 4"
       - Good: "Find $x$ where $x^2 = 4$"
    2. **Options:** The 4 options must also use LaTeX for math values.

    ANALYST REPORT:
    ${analystSummary}
    
    TOPIC: ${topic}
    DIFFICULTY: ${difficulty}/5
    `;

    const schema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.INTEGER },
                question: { type: Type.STRING, description: "Question text with LaTeX math" },
                options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of 4 possible answers with LaTeX" },
                correctAnswer: { type: Type.INTEGER, description: "Index of the correct answer (0-3)" },
                explanation: { type: Type.STRING, description: "Explanation with LaTeX math" }
            },
            required: ["id", "question", "options", "correctAnswer", "explanation"]
        }
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.4
        }
    });

    return { text: response.text, prompt, usage: response.usageMetadata };
};

// --- MAIN EXPORT ---

export const generateMathContent = async (
  topic: string,
  files: FileData[],
  difficulty: number,
  mode: GenerationMode,
  onProgress?: (update: DebugUpdate) => void
): Promise<Partial<MathProblemState>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const startTime = Date.now();
  
  // 1. Analyst Pass
  if (onProgress) onProgress({ model: 'gemini-2.5-flash (Analyst)' });
  const analystSummary = await getAnalystSummary(topic, files, ai);
  
  if (onProgress) {
      onProgress({ 
          analystReport: analystSummary,
          model: mode === 'PROBLEM' ? 'gemini-3-pro-preview' : 'gemini-2.5-flash'
      });
  }

  // 2. Branch based on Mode
  let result;
  let resultData: Partial<MathProblemState> = { mode, analystReport: analystSummary };

  try {
      if (mode === 'PROBLEM') {
          result = await runArchitectMode(ai, analystSummary, topic, files, difficulty);
          resultData.rawResponse = result.text;
          resultData.debugPrompt = result.prompt;
          // Note: Parsing logic handled in App.tsx
      } else if (mode === 'FLASHCARDS') {
          result = await runFlashcardMode(ai, analystSummary, topic);
          resultData.flashcards = JSON.parse(result.text || "[]");
          resultData.debugPrompt = result.prompt;
      } else if (mode === 'QUIZ') {
          result = await runQuizMode(ai, analystSummary, topic, difficulty);
          resultData.quiz = JSON.parse(result.text || "[]");
          resultData.debugPrompt = result.prompt;
      }
  } catch (error) {
      console.error("Generation failed:", error);
      throw error;
  }

  // Metrics
  if (result) {
      const endTime = Date.now();
      resultData.debugMetrics = {
          latencyMs: endTime - startTime,
          inputTokens: result.usage?.promptTokenCount || 0,
          outputTokens: result.usage?.candidatesTokenCount || 0,
          model: mode === 'PROBLEM' ? 'gemini-3-pro-preview' : 'gemini-2.5-flash'
      };
  }

  return resultData;
};

// ... existing helper functions (image gen, tutor) ...

export const generateProblemImage = async (problemDescription: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
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

export const explainMathStep = async (stepText: string, problemContext: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
    CONTEXT (Full Problem & Solution):
    ${problemContext}

    CURRENT STEP TO EXPLAIN:
    ${stepText}

    TASK: Act as a friendly, expert math tutor. Explain the specific logic of the "Current Step" above in 1-2 simple, clear sentences.
    - Focus on "Why" we performed this operation.
    - Identify any specific rule or theorem used (e.g., Chain Rule, Pythagorean Identity).
    - Do not re-derive the whole answer, just explain this specific transition.
    `;

    try {
        // Use flash model for low latency tutor response
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: { temperature: 0.5 }
        });
        return response.text || "I couldn't generate an explanation for this step.";
    } catch (error) {
        console.error("Tutor Error:", error);
        return "Sorry, I'm having trouble explaining this right now.";
    }
}

// Keeping this for backward compatibility if needed, though runFlashcardMode replaces it generally
export const generateFlashcards = async (problemContext: string): Promise<Flashcard[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
    Analyze the following math problem and solution.
    Identify 4-6 key concepts, theorems, formulas, or definitions that are critical to understanding this problem.
    Create a flashcard for each.
    
    RULES:
    1. **Math:** ALWAYS use LaTeX for math expressions (e.g. $f(x) = x^2$).
    2. **Clarity:** Keep definitions concise but rigorous.
    
    PROBLEM CONTEXT:
    ${problemContext}
    `;

    const schema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.INTEGER },
                front: { type: Type.STRING, description: "The concept name or term (e.g. 'Chain Rule')" },
                back: { type: Type.STRING, description: "The definition or formula (e.g. 'd/dx f(g(x)) = ...')" },
                category: { type: Type.STRING, description: "The branch of math (e.g. 'Calculus', 'Algebra')" }
            },
            required: ["id", "front", "back", "category"]
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.3
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as Flashcard[];
        }
        return [];
    } catch (e) {
        console.error("Flashcard Gen Error:", e);
        return [];
    }
}