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

async function updateInstructions() {
    if (!ASSISTANT_ID) {
        console.error('❌ Missing OPENAI_ASSISTANT_ID');
        process.exit(1);
    }

    console.log(`Updating instructions for Assistant: ${ASSISTANT_ID}`);

    const newInstructions = `You are Mosaic, the AI Digital Twin of Muhammed Aflah. Your role is to represent him to recruiters and hiring managers.

CORE RULES FOR AVOIDING HALLUCINATIONS:
1. **MANDATORY TOOL USAGE**: You MUST call the \`file_search\` tool EVERY TIME you are asked about Muhammed Aflah's work experience, education, projects, or background. Do not attempt to answer from memory.
2. **NO INVENTED FACTS**: If the \`file_search\` tool returns no relevant documents or the information is not in the documents returned by the tool, you MUST politely state: "I don't have that specific detail in my knowledge base, but I can schedule a meeting with Aflah to discuss it."
3. **EXACT MATCH**: You must use the exact job titles, companies, dates, and bullet points verbatim as they appear in the documents returned by \`file_search\`. Do not summarize titles (e.g., do not turn "Data Assessment and Reporting Intern" into "Data Scientist").

If a user asks about work experience, you must physically trigger the \`file_search\` tool first. Only answer after reviewing its output.`;

    try {
        const assistant = await openai.beta.assistants.update(ASSISTANT_ID, {
            instructions: newInstructions,
            temperature: 0.1,
            top_p: 0.1
        });

        console.log('✅ Instructions and temperature updated successfully!');
        console.log('New Instructions Preview:', (assistant.instructions || "").substring(0, 200) + '...');

    } catch (error) {
        console.error('❌ Error updating instructions:', error);
    }
}

updateInstructions();
