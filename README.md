# My Cursor AI Assistant

Interactive Node.js CLI supporting either Google's Gemini or local Ollama models with a structured tool/workflow protocol.

## Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Environment Configuration:**

   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Get your Gemini API key from [Google AI Studio](https://ai.google.dev/)
   - Replace `your_gemini_api_key_here` in `.env` with your actual API key

3. **(Optional) Adjust adaptive Ollama timeouts:**

   - Defaults: long think = 300000 ms, short action = 60000 ms
   - To override, uncomment in `.env`:
     ```
     OLLAMA_LONG_TIMEOUT_MS=300000
     OLLAMA_SHORT_TIMEOUT_MS=60000
     ```

4. **Run the application:**
   ```bash
   pnpm run dev
   ```

## Features

- Dual provider support: Gemini API or local Ollama models
- Structured START → THINK → ACTION → OBSERVE → OUTPUT loop
- Adaptive timeouts for Ollama (long think vs short action cycles)
- Robust JSON parsing with auto-repair attempts
- Safe tool abstraction for file and directory creation
- Automatic organized project folder generation
- Secure environment variable management

## Project Structure

```
├── index.js           # Main application file
├── package.json       # Node.js dependencies
├── .env              # Environment variables (not tracked in git)
├── .env.example      # Environment variables template
├── .gitignore        # Git ignore rules
└── todo app/         # Generated todo application
    ├── index.html    # Todo app HTML
    ├── style.css     # Todo app styles
    └── script.js     # Todo app functionality
```

## Available Tools

- `getWheatherInfo(city)` – Dummy weather info
- `executeCommand(command)` – Execute PowerShell commands (non file-write)
- `createDirectory({ path })` – Create a directory (recursive)
- `writeFile({ path, content })` – Create/overwrite a file (preferred for file content)

## Security

- API keys are stored in `.env` file which is excluded from version control
- Never commit your actual API keys to the repository
- Use the `.env.example` file as a template for required environment variables

## Requirements

- Node.js 18+
- pnpm package manager
- Windows (PowerShell environment expected)
- (Optional) Google Gemini API key if using Gemini provider

## Adaptive Timeout Environment Variables

| Variable                | Purpose                         | Default |
| ----------------------- | ------------------------------- | ------- |
| OLLAMA_LONG_TIMEOUT_MS  | Max ms for THINK responses      | 300000  |
| OLLAMA_SHORT_TIMEOUT_MS | Max ms for ACTION/OUTPUT cycles | 60000   |

Leave unset to use defaults. Increase long timeout for heavier reasoning models if needed.
