# My Cursor AI Assistant

Interactive Node.js CLI supporting either Google's Gemini or local Ollama models with a structured tool/workflow protocol.

## Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Environment Configuration (Recommended for Gemini):**

   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Get your Gemini API key from [Google AI Studio](https://ai.google.dev/)
   - Replace `your_gemini_api_key_here` in `.env` with your actual API key

   **Note:** If you don't set up the `.env` file, the CLI will prompt you to enter your Gemini API key manually when you select the Gemini option.

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

- **Dual provider support**: Gemini API or local Ollama models
- **Flexible API key management**: Auto-loads from `.env` or prompts for manual entry
- **Structured workflow**: START → THINK → ACTION → OBSERVE → OUTPUT loop
- **No timeout restrictions**: Unlimited processing time for complex tasks
- **Robust JSON parsing**: Auto-repair attempts for malformed responses
- **Safe tool abstraction**: File and directory creation with proper organization
- **Automatic project structure**: Creates organized folders for generated projects
- **Persistent configuration**: Remembers your provider choice and settings

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

## API Key Configuration

### Gemini API Key Setup

**Option 1: Environment File (Recommended)**

1. Create a `.env` file from the template
2. Add your API key: `GEMINI_API_KEY=your_actual_key_here`
3. Run `pnpm run dev` - CLI will auto-detect and use the key

**Option 2: Manual Entry**

1. Run `pnpm run dev` without setting up `.env`
2. Select "Configure Gemini API Key"
3. Enter your API key when prompted
4. CLI will test and save the key for future sessions

**Getting your API key:**

- Visit [Google AI Studio](https://ai.google.dev/)
- Create an account and generate an API key
- Copy the key to your `.env` file or use it when prompted

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
