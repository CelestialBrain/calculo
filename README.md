<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Calculo - AI Math Tutor

An intelligent mathematics problem generator and tutor powered by Google's Gemini AI. Calculo helps students learn by generating rigorous problems, providing step-by-step solutions, and offering progressive hints.

View your app in AI Studio: https://ai.studio/apps/drive/1d8jivbNyLhgDARGDmQJPJGljTIfg2I42

## Features

### 🎯 Core Features
- **Problem Generation**: Create custom math problems across multiple domains (calculus, algebra, geometry, etc.)
- **Difficulty Scaling**: Topic-aware difficulty levels from review (1x) to Olympiad-level (max)
- **Multiple Modes**: Problems, Flashcards, and Quiz modes
- **Step-by-Step Solutions**: Detailed explanations with LaTeX-rendered equations
- **Visual Confirmation**: Generate geometric diagrams with AI

### 💡 Learning Features
- **Progressive Hints**: Get nudges, partial hints, or full explanations for each solution step
- **Interactive Step Explanations**: Click any step to get a detailed explanation from the AI tutor
- **Similar Problems**: Generate variations of problems to practice the same concepts
- **Flashcard Generation**: Auto-generate concept flashcards from problems
- **Quiz Mode**: Multiple-choice quizzes with explanations

### 🎨 UX Enhancements
- **Smart Loading States**: Skeleton loaders show while content generates
- **Toast Notifications**: Real-time feedback for actions
- **Keyboard Shortcuts**: Efficient navigation and control
- **History Tracking**: Save and restore previous sessions
- **PDF Export**: Export problems and solutions

### 🔧 Technical Features
- **Retry Logic**: Automatic retry with exponential backoff for API failures
- **Caching**: Store generated problems to reduce redundant API calls
- **Chain-of-Thought Prompting**: Enhanced AI reasoning for better problem quality
- **Hybrid Architecture**: Cost-optimized with Flash model for analysis, Pro model for generation

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + .` | Toggle debug panel |
| `Ctrl/Cmd + H` | Toggle history view |
| `Ctrl/Cmd + Enter` | Generate problem (when idle) |

## Run Locally

**Prerequisites:**  Node.js 16+

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file and add your Gemini API key:
   ```
   API_KEY=your_gemini_api_key_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Architecture

### Service Layer (`services/gemini.ts`)
- **Analyst Pass**: Uses Gemini Flash to analyze context and extract key concepts
- **Architect Mode**: Uses Gemini Pro to generate rigorous problems
- **Hint Generation**: Progressive hint system with multiple detail levels
- **Verification**: Optional verification pass to ensure problem correctness

### Component Structure
- `App.tsx`: Main application with routing and state management
- `InputForm.tsx`: Problem generation interface with difficulty slider
- `ProblemDisplay.tsx`: Interactive problem viewer with hints and explanations
- `Toast.tsx`: Notification system
- `ProblemSkeleton.tsx`: Loading state component
- `HintButton.tsx`: Progressive hint interface

### Utilities
- `utils/retry.ts`: Exponential backoff retry logic
- `utils/cache.ts`: In-memory caching for generated problems

## Usage Tips

1. **Getting Started**: Enter a topic (e.g., "derivatives of trigonometric functions") and select difficulty
2. **Using Hints**: Hover over solution steps to reveal progressive hint buttons (nudge → partial → full)
3. **Similar Problems**: After completing a problem, generate variations to practice
4. **History**: All generated content is saved locally and can be restored from the history panel
5. **Debug Mode**: Use Ctrl/Cmd+. to view detailed generation metrics and prompts

## Contributing

This project uses:
- React 19 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Google Gemini AI for content generation

## License

See LICENSE file for details.
