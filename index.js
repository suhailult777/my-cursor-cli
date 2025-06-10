import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = "AIzaSyBzp6o16Qb_BqNN_NhLbr26AFJrHyvfa_0";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
        responseMimeType: "application/json"
    }
});

function addTwoNumbers(x, y) {
    return x + y;
}

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

   Available Tools:
   - getWheatherInfo(city: string): string

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
    try {
        // Prepare the conversation history for Gemini
        const conversationHistory = [
            {
                role: "user",
                parts: [{ text: SYSTEM_PROMPT }]
            },
            {
                role: "model",
                parts: [{ text: "I understand. I will follow the START, THINK, ACTION, OBSERVE, OUTPUT workflow and respond in JSON format only." }]
            },
            {
                role: "user",
                parts: [{ text: "What is wheather of Delhi?" }]
            },
            {
                role: "model",
                parts: [{ text: '{ "step": "think", "content": "The user is asking for the wheather of Delhi." }' }]
            },
            {
                role: "user",
                parts: [{ text: "Continue to the next step." }]
            }
        ];

        const result = await model.generateContent({
            contents: conversationHistory
        });
        
        const response = await result.response;
        console.log(response.text());
    } catch (error) {
        console.error('Error generating content:', error);
    }
}

init();
