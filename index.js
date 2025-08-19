import { GoogleGenerativeAI } from "@google/generative-ai";
import { exec } from 'node:child_process';
import dotenv from 'dotenv';
import inquirer from 'inquirer';
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Configuration file path
const CONFIG_FILE = path.join(process.cwd(), '.cli-config.json');

// Tool functions
function getWheatherInfo(city) {
    return `${city} has 43 Degree C`;
}

function executeCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, { shell: 'powershell.exe' }, function (err, stdout, stderr) {
            if (err) {
                return reject(err);
            }
            resolve(`stdout: ${stdout}\nstderr: ${stderr}`);
        });
    });
}

async function writeFileTool(input) {
    // input expected: { path: string, content: string }
    try {
        if (typeof input === 'string') {
            // attempt JSON parse
            try { input = JSON.parse(input); } catch (_) { /* leave */ }
        }
        if (!input || typeof input !== 'object') throw new Error('writeFile input must be an object { path, content }');
        const { path: filePath, content } = input;
        if (!filePath) throw new Error('Missing path');
        const fullPath = path.join(process.cwd(), filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content ?? '', 'utf-8');
        return `file_written:${filePath}`;
    } catch (e) {
        return `error:${e.message}`;
    }
}

async function createDirectoryTool(input) {
    try {
        if (typeof input === 'string') {
            // could be just path or JSON
            try { input = JSON.parse(input); } catch (_) { input = { path: input }; }
        }
        if (!input || typeof input !== 'object') throw new Error('createDirectory input must be an object or path string');
        const dirPath = input.path || input.dir || input.directory || input.name;
        if (!dirPath) throw new Error('Missing path');
        const fullPath = path.join(process.cwd(), dirPath);
        await fs.mkdir(fullPath, { recursive: true });
        return `directory_created:${dirPath}`;
    } catch (e) {
        return `error:${e.message}`;
    }
}

const TOOLS_MAP = {
    getWheatherInfo,
    executeCommand,
    writeFile: writeFileTool,
    createDirectory: createDirectoryTool,
};

const SYSTEM_PROMPT = `
You are an helpful AI Assistant who is designed to resolve user query. If you think, user query needs a tool invocation, just tell me the tool name with parameters.
You work on START, THINK, ACTION, OBSERVE and OUTPUT Mode.

In the start phase, user gives a query to you.
Then, you THINK how to resolve that query atleast 3-4 times and make sure that all inputs is here
If there is a need to call a tool, you call an ACTION event with tool and input parameters.
If there is an action call, wait for the OBSERVE that is output of the tool.
Based on the OBSERVE from prev step, you either output or repeat the loop.

CRITICAL FORMATTING RULES:
- ALWAYS respond with COMPLETE and VALID JSON only
- NEVER send incomplete JSON like just "{" or partial objects
- Each response must be ONE complete JSON object
- NO explanatory text outside of JSON
- NO markdown formatting, NO code blocks
- Start with { and end with }
 - If you realize mid-way you made a mistake, DO NOT start over mid response; instead finish a valid JSON with an "output" step explaining the issue, or (preferred) a valid JSON action step continuing the plan.
 - If previous response was invalid JSON you will be shown it and MUST respond with ONLY a corrected JSON object.

IMPORTANT RULES:
- Always wait for next step and wait for the next step.
- Always output a single step and wait for the next step.
- Output must be strictly JSON
- Only call tool action from Available Tools only.
- Strictly follow the output format in JSON
- You are running on Windows, use Windows PowerShell commands (like 'type' instead of 'cat', 'dir' instead of 'ls')
- ALWAYS create projects in organized folder structures - NEVER create files in the root directory
- When creating apps/projects, ALWAYS start by creating a dedicated folder with the project name
- Use proper folder organization: create the main folder first, then create files inside it
- For web projects, organize with proper structure (css/, js/, images/ subfolders if needed)
- Example folder creation: New-Item -Path "project-name" -ItemType Directory -Force
- Then create files inside: New-Item -Path "project-name/index.html" -ItemType File -Force
- For multi-line file content, use: @'
<content>
'@ | Out-File -FilePath "project-name/filename.ext" -Encoding UTF8
- Use double quotes around file paths to handle spaces properly
- Use -Force parameter to overwrite existing files/folders if needed
- Make sure HTML, CSS, JS code is properly formatted with line breaks
- Always think about proper project structure before creating files
 - You CANNOT directly run PowerShell commands yourself. To run ANY command (including New-Item, Out-File, etc.) you MUST call the executeCommand tool with the full PowerShell command string as input.
 - NEVER invent new tool names (like New-Item). Only use the tools listed below.

 AVAILABLE TOOLS (use these exact names):
 1. getWheatherInfo - Get weather information for a city
     Usage: { "step": "action", "tool": "getWheatherInfo", "input": "city_name" }

 2. executeCommand - Execute PowerShell commands on Windows (ONLY for commands, not writing multi-line files)
     Usage: { "step": "action", "tool": "executeCommand", "input": "powershell_command" }

 3. createDirectory - Create a directory (recursive)
     Usage: { "step": "action", "tool": "createDirectory", "input": { "path": "todo-app" } }

 4. writeFile - Create or overwrite a file with content (preferred over executeCommand for file writes)
     Usage: { "step": "action", "tool": "writeFile", "input": { "path": "todo-app/index.html", "content": "<html>...</html>" } }

 TOOL SELECTION GUIDE:
 - Weather queries: getWheatherInfo
 - Create folder(s): createDirectory
 - Create/write ANY file content: writeFile (always prefer this)
 - Run a shell / PowerShell command (no file content embedding): executeCommand
 - NEVER use executeCommand with here-strings for file generation; ALWAYS use writeFile with structured JSON.

 OUTPUT FORMAT (must be valid JSON):
 { "step": "think", "content": "your thinking process" }
 { "step": "action", "tool": "tool_name", "input": "tool_input (string OR object)" }
 { "step": "observe", "content": "tool_output" }
 { "step": "output", "content": "final_response" }

 EXAMPLE WORKFLOW:
 User: "Create a todo app"
 1 { "step": "think", "content": "Need folder and three files (index.html, styles.css, script.js)." }
 2 { "step": "action", "tool": "createDirectory", "input": { "path": "todo-app" } }
 3 { "step": "observe", "content": "directory_created:todo-app" }
 4 { "step": "action", "tool": "writeFile", "input": { "path": "todo-app/index.html", "content": "<!DOCTYPE html><html>...</html>" } }
 5 { "step": "observe", "content": "file_written:todo-app/index.html" }
 6 { "step": "action", "tool": "writeFile", "input": { "path": "todo-app/styles.css", "content": "body { font-family: Arial; }" } }
 7 { "step": "observe", "content": "file_written:todo-app/styles.css" }
 8 { "step": "action", "tool": "writeFile", "input": { "path": "todo-app/script.js", "content": "console.log('ready')" } }
 9 { "step": "observe", "content": "file_written:todo-app/script.js" }
 10 { "step": "output", "content": "Todo app created successfully in the todo-app folder!" }

REMEMBER: Always respond with COMPLETE JSON objects only!
`;

// Configuration management
async function saveConfig(config) {
    try {
        await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('❌ Error saving configuration:', error.message);
    }
}

async function loadConfig() {
    try {
        const data = await fs.readFile(CONFIG_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return null;
    }
}

// Ollama functions
async function getOllamaModels() {
    try {
        const response = await axios.get('http://localhost:11434/api/tags', {
            timeout: 5000
        });
        return response.data.models || [];
    } catch (error) {
        console.error('❌ Error connecting to Ollama. Make sure Ollama is running on localhost:11434');
        console.log('💡 To start Ollama: run "ollama serve" in another terminal');
        return [];
    }
}

async function callOllamaModel(model, messages) {
    try {
        // Prepare messages for Ollama with better structure
        const ollamaMessages = [];

        for (const msg of messages) {
            if (msg.role === 'system') {
                ollamaMessages.push({
                    role: 'system',
                    content: msg.content
                });
            } else if (msg.role === 'assistant') {
                ollamaMessages.push({
                    role: 'assistant',
                    content: msg.content
                });
            } else {
                ollamaMessages.push({
                    role: 'user',
                    content: msg.content
                });
            }
        }

        const response = await axios.post('http://localhost:11434/api/chat', {
            model: model,
            messages: ollamaMessages,
            stream: false,
            format: 'json',
            options: {
                temperature: 0.1,
                top_k: 40,
                top_p: 0.9,
                repeat_penalty: 1.1,
                num_ctx: 8192,
                num_predict: 1024,
                // Removed "\n\n" stop which caused premature truncation producing just '{'
                stop: ["User:", "Human:", "```"],
                mirostat: 2,
                mirostat_tau: 5.0,
                mirostat_eta: 0.1
            }
        });

        return response.data.message.content;
    } catch (error) {
        if (error.response?.status === 404) {
            console.error(`❌ Model "${model}" not found. Please pull the model first: ollama pull ${model}`);
        } else {
            console.error('❌ Error calling Ollama model:', error.message);
        }
        throw error;
    }
}

// Attempt to repair invalid / partial JSON by asking model explicitly to fix format
async function repairModelJSON(config, originalBadText) {
    const repairInstruction = `Your previous response was INVALID JSON. Here is what you produced:
<<<BAD_JSON_START>>>
${originalBadText}
<<<BAD_JSON_END>>>
RESPOND AGAIN with ONLY a single valid JSON object matching this TypeScript type exactly (no markdown):
type Step = { step: "think", content: string } | { step: "action", tool: "getWheatherInfo" | "executeCommand", input: string } | { step: "observe", content: string } | { step: "output", content: string };
Rules: No commentary, no explanations, no code fences. Output ONLY the JSON object.`;

    // We wrap as a standalone minimal conversation to maximize compliance
    if (config.provider === 'gemini') {
        return await callGeminiModel(config.apiKey, [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: repairInstruction }
        ]);
    } else {
        return await callOllamaModel(config.model, [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: repairInstruction }
        ]);
    }
}

// Gemini functions
async function callGeminiModel(apiKey, messages) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-001",
        generationConfig: {
            responseMimeType: "application/json"
        }
    });

    // Convert messages to Gemini format
    let conversationHistory = [];

    // Add system prompt as the first user message
    conversationHistory.push({
        role: 'user',
        parts: [{ text: messages[0].content }]
    });
    conversationHistory.push({
        role: 'model',
        parts: [{ text: 'I understand. I will follow the workflow and respond in JSON format.' }]
    });

    // Add conversation messages
    for (let i = 1; i < messages.length; i++) {
        const msg = messages[i];
        if (msg.role === 'user') {
            conversationHistory.push({
                role: 'user',
                parts: [{ text: msg.content }]
            });
        } else if (msg.role === 'assistant') {
            conversationHistory.push({
                role: 'model',
                parts: [{ text: msg.content }]
            });
        }
    }

    const result = await model.generateContent({
        contents: conversationHistory
    });

    const response = await result.response;
    return response.text();
}

// Main CLI interface
async function showMainMenu() {
    console.clear();
    console.log('🚀 AI CLI Tool');
    console.log('================\n');

    const { choice } = await inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: 'Choose your AI model configuration:',
            choices: [
                { name: '🌟 Configure Gemini API Key', value: 'gemini' },
                { name: '🖥️  Use Local Ollama Models', value: 'ollama' }
            ]
        }
    ]);

    return choice;
}

async function configureGemini() {
    console.log('\n🌟 Gemini API Configuration');
    console.log('============================\n');

    // First check if API key exists in .env file
    let apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
        console.log('✅ Found Gemini API key in .env file');
        console.log('🔄 Testing API key...');
    } else {
        console.log('💡 No API key found in .env file');

        const { inputApiKey } = await inquirer.prompt([
            {
                type: 'password',
                name: 'inputApiKey',
                message: 'Enter your Gemini API key:',
                mask: '*'
            }
        ]);

        apiKey = inputApiKey;
    }

    // Test the API key
    try {
        console.log('🔄 Testing API key...');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
        await model.generateContent("test");

        console.log('✅ API key is valid!');
        await saveConfig({ provider: 'gemini', apiKey });
        return { provider: 'gemini', apiKey };
    } catch (error) {
        console.error('❌ Invalid API key. Please try again.');
        return await configureGemini();
    }
}

async function configureOllama() {
    console.log('\n🖥️  Ollama Configuration');
    console.log('========================\n');

    console.log('🔄 Fetching available Ollama models...');
    const models = await getOllamaModels();

    if (models.length === 0) {
        console.log('❌ No Ollama models found. Please install Ollama and pull some models first.');
        console.log('\n📖 Quick setup guide:');
        console.log('1. Install Ollama: https://ollama.com/');
        console.log('2. Pull a model: ollama pull llama3.2');
        console.log('3. Start Ollama: ollama serve');
        console.log('4. Run this CLI again');
        process.exit(1);
    }

    // Display model information
    console.log(`\n✅ Found ${models.length} model(s):`);
    models.forEach((model, index) => {
        const size = model.size ? `(${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB)` : '';
        console.log(`   ${index + 1}. ${model.name} ${size}`);
    });

    const modelChoices = models.map(model => {
        const size = model.size ? `(${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB)` : '';
        return {
            name: `${model.name} ${size}`,
            value: model.name
        };
    });

    const { selectedModel } = await inquirer.prompt([
        {
            type: 'list',
            name: 'selectedModel',
            message: 'Select an Ollama model:',
            choices: modelChoices,
            pageSize: 10
        }
    ]);

    // Test the selected model
    console.log(`\n🔄 Testing model: ${selectedModel}...`);
    try {
        await axios.post('http://localhost:11434/api/chat', {
            model: selectedModel,
            messages: [{ role: 'user', content: 'Hello' }],
            stream: false
        }, { timeout: 10000 });

        console.log(`✅ Model ${selectedModel} is working!`);
    } catch (error) {
        console.log(`⚠️  Warning: Could not test model ${selectedModel}, but continuing anyway.`);
    }

    await saveConfig({ provider: 'ollama', model: selectedModel });
    return { provider: 'ollama', model: selectedModel };
}

async function runConversation(config) {
    console.clear();
    console.log(`🤖 AI Assistant (${config.provider === 'gemini' ? 'Gemini' : 'Ollama: ' + config.model})`);
    console.log('='.repeat(50));
    console.log('Type your prompts below. Type "exit" to quit.\n');

    const messages = [
        {
            role: 'system',
            content: SYSTEM_PROMPT,
        },
    ];

    while (true) {
        const { userInput } = await inquirer.prompt([
            {
                type: 'input',
                name: 'userInput',
                message: '💬 You:',
            }
        ]);

        if (userInput.toLowerCase() === 'exit') {
            console.log('👋 Goodbye!');
            break;
        }

        messages.push({
            role: 'user',
            content: userInput,
        });

        console.log('\n🔄 Processing...\n');

        try {
            let retryCount = 0;
            const maxRetries = 3;

            let expectingLongThink = true; // First response after user input often a think
            while (true) {
                let responseText;

                try {
                    if (config.provider === 'gemini') {
                        responseText = await callGeminiModel(config.apiKey, messages);
                    } else {
                        responseText = await callOllamaModel(config.model, messages);
                    }
                    retryCount = 0; // Reset retry count on success
                } catch (modelError) {
                    retryCount++;
                    if (retryCount <= maxRetries) {
                        console.log(`⚠️  Model error (attempt ${retryCount}/${maxRetries}): ${modelError.message}`);
                        console.log('🔄 Retrying...\n');
                        continue;
                    } else {
                        console.log(`❌ Model failed after ${maxRetries} attempts: ${modelError.message}`);
                        break;
                    }
                }

                messages.push({ 'role': 'assistant', 'content': responseText });

                let parsed_response;
                let jsonAttemptText = responseText;
                const maxRepairAttempts = 2;
                let repairAttempts = 0;
                while (!parsed_response) {
                    try {
                        parsed_response = JSON.parse(jsonAttemptText);
                    } catch (parseError) {
                        console.log(`🔧 Debug: JSON parse failed (attempt ${repairAttempts + 1}) length=${jsonAttemptText.length}`);
                        // Try to extract first full JSON object heuristically
                        const jsonMatches = jsonAttemptText.match(/\{[\s\S]*\}/g);
                        if (jsonMatches) {
                            for (const m of jsonMatches) {
                                try {
                                    parsed_response = JSON.parse(m);
                                    console.log('🔧 Debug: Extracted JSON via heuristic');
                                    break;
                                } catch (_) { /* continue */ }
                            }
                        }
                        if (parsed_response) break;
                        if (repairAttempts >= maxRepairAttempts) {
                            console.log('❌ Could not obtain valid JSON after repair attempts. Aborting this turn. Raw output snippet:');
                            console.log(jsonAttemptText.slice(0, 400));
                            break;
                        }
                        console.log('🛠  Attempting automatic JSON repair...');
                        const repaired = await repairModelJSON(config, jsonAttemptText);
                        jsonAttemptText = repaired;
                        repairAttempts++;
                        continue; // loop again
                    }
                }
                if (!parsed_response) {
                    break; // give control back to user
                }

                // Debug output for Ollama
                if (config.provider === 'ollama') {
                    console.log(`🔧 Debug: Step="${parsed_response.step}", Tool="${parsed_response.tool}"`);
                }

                if (parsed_response.step && parsed_response.step === "think") {
                    console.log(`🧠 Thinking: ${parsed_response.content}`);
                    // remain in long-think mode
                    expectingLongThink = true;
                    continue;
                }

                if (parsed_response.step && parsed_response.step === "output") {
                    console.log(`🤖 Assistant: ${parsed_response.content}\n`);
                    expectingLongThink = false;
                    break;
                }

                if (parsed_response.step && parsed_response.step === "action") {
                    const tool = parsed_response.tool;
                    let input = parsed_response.input;

                    const inputPreview = typeof input === 'string' ? (input.length > 60 ? input.slice(0, 57) + '...' : input) : JSON.stringify(input).slice(0, 60);
                    console.log(`⛏️  Executing: ${tool} -> ${inputPreview}`);

                    // Validate tool exists
                    if (!TOOLS_MAP[tool]) {
                        console.log(`❌ Tool '${tool}' not found. Available tools: ${Object.keys(TOOLS_MAP).join(', ')}`);
                        messages.push({
                            "role": "assistant",
                            "content": JSON.stringify({ "step": "observe", "content": `Error: Tool '${tool}' not found. Available tools: getWheatherInfo, executeCommand` })
                        });
                        continue;
                    }

                    try {
                        const value = await TOOLS_MAP[tool](input);
                        console.log(`📋 Result: ${value}\n`);

                        messages.push({
                            "role": "assistant",
                            "content": JSON.stringify({ "step": "observe", "content": value })
                        });
                        // After an action we expect possibly another think but usually shorter; switch to short timeout for next call.
                        expectingLongThink = false;
                    } catch (toolError) {
                        console.log(`❌ Tool error: ${toolError.message}\n`);
                        messages.push({
                            "role": "assistant",
                            "content": JSON.stringify({ "step": "observe", "content": `Error: ${toolError.message}` })
                        });
                        expectingLongThink = false;
                    }
                    continue;
                }

                // Handle unknown step types
                if (parsed_response.step) {
                    console.log(`⚠️  Unknown step type: ${parsed_response.step}`);
                    console.log(`Response: ${parsed_response.content || JSON.stringify(parsed_response)}\n`);
                    break;
                }
            }
        } catch (error) {
            console.error('❌ Fatal error:', error.message);
            console.log('💡 Try restarting the conversation or check your configuration.\n');
        }
    }
}

async function init() {
    try {
        // Check for existing configuration
        let config = await loadConfig();

        if (config) {
            const { useExisting } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'useExisting',
                    message: `Found existing ${config.provider} configuration. Use it?`,
                    default: true
                }
            ]);

            if (!useExisting) {
                config = null;
            }
        }

        // If no config, show main menu
        if (!config) {
            const choice = await showMainMenu();

            if (choice === 'gemini') {
                config = await configureGemini();
            } else {
                config = await configureOllama();
            }
        }

        // Start conversation
        await runConversation(config);

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

init();
