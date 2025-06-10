# My Cursor AI Assistant

A Node.js application that uses Google's Gemini AI to create a todo app and perform various tasks.

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

3. **Run the application:**
   ```bash
   node index.js
   ```

## Features

- **AI-powered task execution**: Uses Gemini AI to understand and execute user requests
- **File operations**: Can create folders, files, and execute PowerShell commands
- **Todo app generation**: Automatically creates a functional todo app with HTML, CSS, and JS
- **Environment variable support**: Secure API key management

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

- `getWheatherInfo(city)`: Get weather information for a city
- `executeCommand(command)`: Execute PowerShell commands on Windows

## Security

- API keys are stored in `.env` file which is excluded from version control
- Never commit your actual API keys to the repository
- Use the `.env.example` file as a template for required environment variables

## Requirements

- Node.js 18+
- pnpm package manager
- Windows (for PowerShell command execution)
- Google Gemini API key
