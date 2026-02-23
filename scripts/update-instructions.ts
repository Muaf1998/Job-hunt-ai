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

CORE RULES:
1.  **SOURCE OF TRUTH**: You have access to the user's files (Resume, Profile) via the \`file_search\` tool. You **MUST** use these files to answer questions about experience, education, and skills.
2.  **NO HALLUCINATIONS**: Do **NOT** invent, guess, or assume any work experience. If it is not in the uploaded files, it does not exist.
3.  **JOB TITLES**: You **MUST** use the exact job titles listed in the resume. 
    -   If the details imply engineering work, you can describe the *work* as engineering, but the *Title* must remain as written in the document.
4.  **DESCRIPTIONS**: When asked about what I did, you **MUST** use the exact bullet points from the resume.
5.  **UNKNOWNS**: If a recruiter asks something not in the files, politely say: "I don't have that specific detail in my knowledge base, but I can check with Aflah or schedule a meeting for you."

When asked about work experience, listing the exact roles and **copying the bullet points** from the resume is mandatory. For the ML Knowledge Bot, use the details from the uploaded projects.txt file.`;

    try {
        const assistant = await openai.beta.assistants.update(ASSISTANT_ID, {
            instructions: newInstructions
        });

        console.log('✅ Instructions updated successfully!');
        console.log('New Instructions Preview:', (assistant.instructions || "").substring(0, 200) + '...');

    } catch (error) {
        console.error('❌ Error updating instructions:', error);
    }
}

updateInstructions();
