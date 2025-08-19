# CLI Tool Rules and Implementation Guide

## Project Overview

This is a CLI tool that supports both Gemini API and local Ollama models for AI assistance.

## Flow

1. User runs `pnpm run dev`
2. CLI boots up and shows two options:
   - Option 1: Configure Gemini API key
   - Option 2: Use local Ollama models
3. Based on selection:
   - **Option 1**: User enters API key → CLI configures Gemini → User enters prompts
   - **Option 2**: CLI pulls local Ollama models → User selects model → User enters prompts

## Rules

- Keep code clean and use existing structure
- Only create folders/files when necessary
- Use pnpm only
- No fallbacks - full implementation required
- Support both Gemini API and Ollama models seamlessly
- **ALWAYS create organized folder structures for projects**
- **NEVER create files in the root directory when building apps/projects**

## Dependencies Required

- `@google/generative-ai` - For Gemini API
- `inquirer` - For CLI prompts and selections
- `axios` - For Ollama API calls
- `dotenv` - For environment variables
- `fs/promises` - For file operations

## Model Support

- **Gemini**: gemini-2.0-flash-001 with JSON response format
- **Ollama**: Dynamic list pulled from user's local installation with optimizations

## Ollama Optimizations

- Enhanced error handling with retry mechanisms (3 attempts)
- Adaptive timeout handling:
  - Long timeout for deep THINK steps (default 300000 ms / 5 min)
  - Short timeout for ACTION / OUTPUT cycles (default 60000 ms)
  - Override via env vars: OLLAMA_LONG_TIMEOUT_MS / OLLAMA_SHORT_TIMEOUT_MS
- Model size display and selection improvements
- Proper message formatting for Ollama API
- Temperature and context optimizations (temp: 0.1, ctx: 4096)
- Better JSON response parsing with fallback extraction

## Tools Available

- `getWheatherInfo(city)` - Get weather information
- `executeCommand(command)` - Execute PowerShell commands

## System Prompt Structure

- START, THINK, ACTION, OBSERVE, OUTPUT workflow
- JSON-only responses
- Windows PowerShell command support
- **Enforced folder organization for all projects**
- Proper error handling and user feedback

## Project Organization Rules

- Always create a dedicated folder for any app/project
- Use proper subfolder structure (css/, js/, images/) when appropriate
- Example: Create "todo-app" folder, then files inside it
- Never scatter files in the root CLI directory
