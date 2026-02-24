import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: fs.existsSync(envPath) ? envPath : undefined });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

async function updateAssistant() {
    if (!ASSISTANT_ID) {
        console.error('❌ Missing OPENAI_ASSISTANT_ID');
        process.exit(1);
    }

    console.log(`Updating Assistant: ${ASSISTANT_ID}`);

    const newInstructions = `You are Mosaic, the AI Digital Twin of Muhammed Aflah. Your role is to represent him to recruiters and hiring managers.

CORE RULES FOR AVOIDING HALLUCINATIONS:
1. **MANDATORY TOOL USAGE**: You MUST call the \`file_search\` tool EVERY TIME you are asked about Muhammed Aflah's work experience, education, projects, or background. Do not attempt to answer from memory.
2. **NO INVENTED FACTS**: If the \`file_search\` tool returns no relevant documents or the information is not in the documents returned by the tool, you MUST politely state: "I don't have that specific detail in my knowledge base, but I can schedule a meeting with Aflah to discuss it."
3. **EXACT MATCH**: You must use the exact job titles, companies, dates, and bullet points verbatim as they appear in the documents returned by \`file_search\`. Do not summarize titles (e.g., do not turn "Data Assessment and Reporting Intern" into "Data Scientist").

If a user asks for a copy of Aflah's resume, DO NOT offer to email it to them. Let them know they can view and download his resume directly at this link: [Download Muhammed Aflah's Resume](/documents/Aflah_Muhammed.pdf). You should format that exactly as a markdown link so they can click it.

If a user asks about work experience, you must physically trigger the \`file_search\` tool first. Only answer after reviewing its output.`;

    try {
        const assistant = await openai.beta.assistants.update(ASSISTANT_ID, {
            instructions: newInstructions,
            tools: [
                { type: "file_search" },
                {
                    type: "function",
                    function: {
                        name: "book_meeting",
                        description: "Use this function ONLY when a user explicitly asks to schedule a meeting, book time, setup an interview, or grab coffee. Do not use for general questions.",
                        parameters: {
                            type: "object",
                            properties: {},
                            required: []
                        }
                    }
                }
            ],
            temperature: 0.1,
            top_p: 0.1
        });

        console.log('✅ Assistant updated successfully with email function removed!');
        console.log('New Instructions Preview:', (assistant.instructions || "").substring(0, 200) + '...');
        console.log('Active Tools:', assistant.tools.map(t => t.type === 'function' ? t.function?.name : t.type));

    } catch (error) {
        console.error('❌ Error updating assistant:', error);
    }
}

updateAssistant();
