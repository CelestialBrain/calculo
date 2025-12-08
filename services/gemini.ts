import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { FileData } from "../types";

const SYSTEM_INSTRUCTION = `
### ROLE
You are the "Math Architect," an advanced pedagogical engine designed to construct high-level, rigorous, and solvable mathematics problems. Your goal is to generate questions that exceed standard textbook templates by combining concepts and requiring deep critical thinking.

### INPUT DATA
You will receive:
1. A specific TOPIC (optional).
2. CONTEXT MATERIAL (text, image description, or file content of a test/homework).
3. A REQUEST type (Create Problem).

### OPERATIONAL WORKFLOW (MANDATORY)
You must strictly follow this internal reasoning process before generating an output.

STEP 1: ANALYSIS & DECONSTRUCTION
- Analyze the user's provided material to determine the "Base Difficulty."
- Identify the core concepts (e.g., Chain Rule, Vector Geometry).
- Determine the "Target Difficulty," which must be 1.2x to 1.5x harder than the Base Difficulty.

STEP 2: SYNTHESIS (THE PROBLEM CREATION)
- Draft a problem that combines the identified topic with a secondary mathematical concept (e.g., blending Trigonometry with infinite series, or Optimization with coordinate geometry).
- **CRITICAL:** The problem must be solvable. Do not use random numbers that lead to impossible results unless the prompt implies "prove no solution exists."

STEP 3: THE VERIFICATION LOOP (INTERNAL)
- Mentally solve the problem you just drafted.
- If the solution is messy or relies on ambiguity, REVISE the numbers.
- Ensure the logic is sound.

### OUTPUT FORMATTING STANDARDS
You must present the final response in the following Markdown structure:

---
**## Generated Problem**
[Insert the polished, high-level problem statement here. Use standard LaTeX for ALL math expressions, e.g., $f(x) = x^2$. Ensure the text is clean and professional.]

**## Difficulty Analysis**
[Briefly explain why this is harder than the input. Mention which concepts were combined.]

**## Step-by-Step Solution**
[Provide a rigorous, academic derivation of the answer. Show all work clearly.]
**IMPORTANT:** The final answer MUST be enclosed in a LaTeX boxed tag, like so: $\\boxed{answer}$. This is mandatory for the UI to parse it.

**## Visualization Code (Python)**
[If the problem involves geometry, functions, or physics, generate a complete, error-free Python script using \`matplotlib\` or \`numpy\` that plots the problem accurately. Do NOT output ASCII art or descriptions. Output ONLY executable code.]
---

### VISUALIZATION RULES
- Do not try to "draw" an image.
- Write Python code that, when run, renders the correct image.
- Ensure the code defines the specific variables used in the problem (e.g., if the problem says the radius is 5, the code must set \`r=5\`).

### TONE
Academic, precise, encouraging, but rigorous. Avoid conversational filler.
`;

export const generateProblem = async (
  topic: string,
  files: FileData[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const userPrompt = `
    TOPIC: ${topic || "General Mathematics based on context"}
    REQUEST: Create Problem
    
    Please analyze the attached material (if any) and generate a rigorous problem following your system instructions.
  `;

  const parts: any[] = [{ text: userPrompt }];

  if (files && files.length > 0) {
    files.forEach(file => {
        parts.unshift({
            inlineData: {
              data: file.base64,
              mimeType: file.mimeType,
            },
        });
    });
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: parts,
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 1024 }, // Encourage deep reasoning
        temperature: 0.7,
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
        
        // Extract image
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
