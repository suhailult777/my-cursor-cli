import { GoogleGenerativeAI } from "@google/generative-ai";
import { exec } from 'node:child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables. Please check your .env file.');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-001",
    generationConfig: {
        responseMimeType: "application/json"
    }
});

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

const TOOLS_MAP = {
    getWheatherInfo: getWheatherInfo,
    executeCommand: executeCommand,
};

const SYSTEM_PROMPT = `
    You are an helpful AI Assistant who is designed to resolve user query. If you think, user query needs a tool invocation, just tell me the tool name with parameters.
    You work on START, THINK, ACTION, OBSERVE and OUTPUT Mode.

    In the start phase, user gives a query to you.
    Then, you THINK how to resolve that query atleast 3-4 times and make sure that all inputs is here
    If there is a need to call a tool, you call an ACTION event with tool and input parameters.
    If there is an action call, wait for the OBSERVE that is output of the tool.
    Based on the OBSERVE from prev step, you either output or repeat the loop.

    rules:
    - Always wait for next step and wait for the next step.
    - Always output a single step and wait for the next step.
    - Output must be strictly JSON
    - Only call tool action from Available Tools only.
    -Strictly follow the output format in JSON
    - You are running on Windows, use Windows PowerShell commands (like 'type' instead of 'cat', 'dir' instead of 'ls')
    - To create files with content, use: @'
<content>
'@ | Out-File -FilePath "filename" -Encoding UTF8
    - For simple files, use: New-Item -Path "filename" -ItemType File -Force
    - For directories, use: New-Item -Path "foldername" -ItemType Directory -Force
    - Use double quotes around file paths to handle spaces properly
    - Use -Force parameter to overwrite existing files/folders if needed
    - For multi-line content, use proper here-string syntax with @' and '@ on separate lines
    - Make sure HTML, CSS, JS code is properly formatted with line breaks

   Available Tools:
   - getWheatherInfo(city: string): string
   - executeCommand(command): string Executes a given powershell command on user's device and returns the STDOUT and STDERR.

    Example:
    START: What is wheather of Patiala?
    THINK: The user is asking for the wheather of Patiala.
    THINK: From the available tools, I must call getWheatherInfo tool for patiala as input.
    ACTION: Call Tool getWheatherInfo(patiala)
    OBSERVE: 32 Degree C
    THINK: The output of getWheatherInfo for patiala is 32 Degree C
    OUTPUT: The wheather of Patiala is 32 Degree C which is quiet hot.

    Output Example:
    { "role": "user", "content": "what is wheather of Patiala?" }
    { "step": "think", "content": "The user is asking for the wheather of Patiala." }
    { "step": "think", "content": "From the available tools, I must call getWheatherInfo tool." }
    { "step": "action", "tool": "getWheatherInfo", "input": "patiala" }
    { "step": "observe", "content": "32 Degree C" }
    { "step": "think", "content": "The output of getWheatherInfo for patiala is 32 Degree C" }
    { "step": "output", "content": "The wheather of Patiala is 32 Degree C which is quiet hot." }



    Output Format:
    { "step": "string", "tool": "string", "input": "string", "content": "string" }
`;



async function init() {
    const messages = [
        {
            role: 'system',
            content: SYSTEM_PROMPT,
        },
    ];

    const userQuery = 'Create a folder todo app and create a todo app with HTML CSS AND JS fully working';
    messages.push({
        role: 'user',
        content: userQuery,
    });

    while (true) {
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
        const responseText = response.text();

        messages.push({ 'role': 'assistant', 'content': responseText });
        const parsed_response = JSON.parse(responseText);

        if (parsed_response.step && parsed_response.step === "think") {
            console.log(`🧠: ${parsed_response.content}`);
            continue;
        }
        if (parsed_response.step && parsed_response.step === "output") {
            console.log(`🤖: ${parsed_response.content}`);
            break;

        }
        if (parsed_response.step && parsed_response.step === "action") {
            const tool = parsed_response.tool
            const input = parsed_response.input

            const value = await TOOLS_MAP[tool](input);
            console.log(`⛏️: Tool Call ${tool}: (${input}) ${value}`);

            messages.push({
                "role": "assistant",
                "content": JSON.stringify({ "step": "observe", "content": value })
            });
            continue;
        }
    }
}

init();
