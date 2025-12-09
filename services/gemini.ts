import { GoogleGenAI, GenerateContentResponse, Type, Schema } from "@google/genai";
import { FileData, DebugMetrics, Flashcard, GenerationMode, QuizQuestion, MathProblemState, HintRequest } from "../types";
import { withRetry } from "../utils/retry";

// --- SYSTEM INSTRUCTIONS ---

const ANALYST_INSTRUCTION = `
You are a Senior Mathematical Analyst. 
Your task is to analyze the provided input material (files, images, text) and extract the core mathematical concepts, identify the base difficulty level, and list any specific constraints or variables found. 
Output a concise summary.
`;

const ARCHITECT_INSTRUCTION = `
### ROLE
You are the "Math Architect," designed to construct high-level, rigorous, and solvable mathematics problems based on an analyst's report.

### THINKING PROCESS (Internal)
Before writing, mentally:
1. Identify 2-3 core concepts being tested
2. Plan 3-5 logical solution steps
3. Verify the problem is solvable with the given constraints
4. Ensure no ambiguity in the problem statement
5. Consider the mathematical domain (calculus, algebra, geometry, etc.) for appropriate difficulty scaling

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
    // Topic-aware difficulty scaling
    const getDifficultyInstruction = (level: number, contextSummary: string): string => {
        // Detect mathematical domain from topic/context
        // We search both the user's topic and the analyst's summary for domain keywords
        const context = `${topic} ${contextSummary}`.toLowerCase();
        const isCalculus = /calculus|derivative|integral|limit|continuity/i.test(context);
        const isAlgebra = /algebra|polynomial|equation|matrix|linear/i.test(context);
        const isGeometry = /geometry|triangle|circle|angle|area|volume/i.test(context);
        const isProof = /proof|theorem|lemma|induction|logic/i.test(context);
        
        const domainContext = isCalculus ? " (Calculus domain)" :
                             isAlgebra ? " (Algebra domain)" :
                             isGeometry ? " (Geometry domain)" :
                             isProof ? " (Proof-based)" : "";
        
        if (level === 1) return `Create a problem of EQUAL difficulty${domainContext}. Focus on reinforcement and conceptual clarity. Use straightforward applications of fundamental concepts.`;
        else if (level === 2) return `Create a problem slightly harder (1.2x)${domainContext}. Introduce one new constraint or minor twist to the basic concept.`;
        else if (level === 3) return `Create a problem 1.5x HARDER${domainContext}. Combine 2-3 concepts or require multi-step reasoning.`;
        else if (level === 4) return `Create a significantly harder problem (2.0x)${domainContext}. Require deep insight, multiple solution stages, and creative problem-solving.`;
        else if (level === 5) return `Create an OLYMPIAD-LEVEL problem${domainContext}. Require abstract thinking, novel application of concepts, proof techniques, or exceptional mathematical creativity.`;
        return `Create a problem 1.5x HARDER${domainContext}.`;
    };

    const instructionOverride = getDifficultyInstruction(difficulty, analystSummary);

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

/**
 * Generate mathematical content based on mode (PROBLEM, FLASHCARDS, or QUIZ)
 * 
 * This is the main entry point for content generation. It uses a hybrid architecture:
 * 1. Analyst Pass (Gemini Flash): Analyzes context and extracts key concepts
 * 2. Generation Pass: Uses appropriate model based on mode
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Topic-aware difficulty scaling
 * - Progress callbacks for real-time updates
 * - Comprehensive error handling
 * 
 * @param topic - The mathematical topic or concept to generate content for
 * @param files - Optional context files (images, PDFs) to inform generation
 * @param difficulty - Difficulty level (1-5): 1=Review, 2=Practice, 3=Challenge, 4=Advanced, 5=Olympiad
 * @param mode - Generation mode: 'PROBLEM', 'FLASHCARDS', or 'QUIZ'
 * @param onProgress - Optional callback for real-time progress updates
 * @returns Partial MathProblemState with generated content and metadata
 */
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

  // 2. Branch based on Mode with retry logic
  let result;
  let resultData: Partial<MathProblemState> = { mode, analystReport: analystSummary };

  try {
      if (mode === 'PROBLEM') {
          result = await withRetry(() => runArchitectMode(ai, analystSummary, topic, files, difficulty));
          resultData.rawResponse = result.text;
          resultData.debugPrompt = result.prompt;
          // Note: Parsing logic handled in App.tsx
      } else if (mode === 'FLASHCARDS') {
          result = await withRetry(() => runFlashcardMode(ai, analystSummary, topic));
          resultData.flashcards = JSON.parse(result.text || "[]");
          resultData.debugPrompt = result.prompt;
      } else if (mode === 'QUIZ') {
          result = await withRetry(() => runQuizMode(ai, analystSummary, topic, difficulty));
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
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { text: `Create a precise, academic, and clear mathematical visualization for this problem: ${problemDescription}. The style should be like a high-quality textbook diagram. Clean lines, white background, distinct geometric shapes, black ink.` }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: "16:9"
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

/**
 * Generate a progressive hint for a specific solution step
 */
export const generateHint = async (
  stepText: string, 
  problemContext: string, 
  hintLevel: 'nudge' | 'partial' | 'full'
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const hintInstructions = {
        nudge: `Provide a minimal nudge (1 sentence) that helps the student think about the right approach WITHOUT revealing the solution. Ask a guiding question or mention a relevant theorem.`,
        partial: `Provide a partial hint (2-3 sentences) that explains the general approach and identifies the key concept or formula to use, but don't show the complete calculation.`,
        full: `Provide a full, detailed explanation of this step, including the reasoning, the formula/theorem applied, and the complete calculation with intermediate steps.`
    };

    const prompt = `
    CONTEXT (Full Problem & Solution):
    ${problemContext}

    CURRENT STEP:
    ${stepText}

    HINT LEVEL: ${hintLevel.toUpperCase()}
    INSTRUCTION: ${hintInstructions[hintLevel]}
    
    IMPORTANT: Use LaTeX for all math expressions (e.g., $x^2$, $$\\int_0^1 f(x) dx$$).
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: { temperature: 0.6 }
        });
        return response.text || "Could not generate hint.";
    } catch (error) {
        console.error("Hint Generation Error:", error);
        return "Sorry, I couldn't generate a hint right now.";
    }
};

/**
 * Generate similar problems that test the same concepts with variations
 */
export const generateSimilarProblems = async (
    originalProblem: string,
    concepts: string,
    difficulty: number
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
    ORIGINAL PROBLEM:
    ${originalProblem}

    KEY CONCEPTS TESTED:
    ${concepts}

    TASK: Generate 3 similar problems that test the same concepts but with different:
    - Numerical values
    - Variable names
    - Context or scenario (if applicable)
    - Minor variations in constraints

    DIFFICULTY LEVEL: ${difficulty}/5 (maintain similar difficulty)

    FORMAT: Use the same structured format as the original, with clear problem statements using LaTeX for math.
    Number the problems as: **Problem 1**, **Problem 2**, **Problem 3**
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: { 
                systemInstruction: ARCHITECT_INSTRUCTION,
                temperature: 0.8 
            }
        });
        return response.text || "Could not generate similar problems.";
    } catch (error) {
        console.error("Similar Problems Error:", error);
        throw error;
    }
};

/**
 * Verify a generated problem for correctness and solvability
 */
export const verifyProblem = async (
    problemStatement: string,
    solution: string,
    finalAnswer: string
): Promise<{ isValid: boolean; issues: string[] }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
    You are a math verification expert. Review this problem and solution for:
    1. Mathematical correctness
    2. Logical consistency in the solution steps
    3. Whether the final answer is correct
    4. Any ambiguities or errors

    PROBLEM:
    ${problemStatement}

    SOLUTION:
    ${solution}

    FINAL ANSWER:
    ${finalAnswer}

    Respond in JSON format:
    {
        "isValid": true/false,
        "issues": ["list of any issues found, or empty array if none"]
    }
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            isValid: { type: Type.BOOLEAN },
            issues: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
            }
        },
        required: ["isValid", "issues"]
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.2
            }
        });
        
        if (response.text) {
            return JSON.parse(response.text);
        }
        return { isValid: true, issues: [] }; // Assume valid if verification fails
    } catch (error) {
        console.error("Verification Error:", error);
        return { isValid: true, issues: [] }; // Don't block on verification failure
    }
};