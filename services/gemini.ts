import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { FileData } from "../types";

const SYSTEM_INSTRUCTION = `
### ROLE
You are the "Math Architect," an advanced pedagogical engine designed to construct high-level, rigorous, and solvable mathematics problems.

### INPUT DATA
1. TOPIC
2. CONTEXT MATERIAL
3. REQUEST

### OPERATIONAL WORKFLOW
1. **Analysis:** Determine Base Difficulty and Concepts.
2. **Synthesis:** Create a problem 1.5x harder.
3. **Verification:** Ensure solvability.

### OUTPUT FORMATTING RULES (STRICT)
You must structure your response to be "scannable." Avoid long paragraphs. Use lists and spacing.

1.  **Structure:** Use the EXACT headers defined in the template below for the parsing engine.
2.  **No \`**\` Delimiters:** Do NOT use double asterisks for bolding headers. Use Markdown headers (###) for subsections like "Problem Statement" or "Step 1".
3.  **The "Given" Section:** Always list known variables as a bulleted list.
4.  **Display Math:** Use \`$$\` delimiters for ALL major equations so they appear centered and distinct. Do not squash complex math inline.
5.  **Final Answer:** Must be enclosed in \`\\boxed{}\` within display math block.

### RESPONSE TEMPLATE
You must strictly follow this Markdown structure:

---
## Generated Problem
### Problem Statement
[Brief intro sentence]
* $variable_1 = value$
* $variable_2 = value$

**Goal:** [Brief objective]

## Difficulty Analysis
[Brief explanation of concepts combined]

## Step-by-Step Solution
### Step 1: [Name of Step]
[Short explanation]
$$
[Equation]
$$

### Step 2: [Name of Step]
[Short explanation]
$$
[Equation]
$$

### Final Answer
$$
\\boxed{[Result]}
$$

## Visualization Code (Python)
[Python code if applicable]
---
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
    Remember to use lists for given variables and display math ($$) for equations.
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
