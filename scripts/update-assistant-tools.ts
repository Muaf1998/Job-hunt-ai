import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: fs.existsSync(envPath) ? envPath : undefined });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

async function updateAssistantTools() {
    if (!process.env.OPENAI_API_KEY || !ASSISTANT_ID) {
        console.error('❌ Missing credentials. Please check .env.local');
        process.exit(1);
    }

    console.log(`Updating Assistant ${ASSISTANT_ID} with book_meeting tool...`);

    try {
        const assistant = await openai.beta.assistants.update(ASSISTANT_ID, {
            tools: [
                { type: "file_search" }, // Keep existing file search
                {
                    type: "function",
                    function: {
                        name: "book_meeting",
                        description: "Propose a meeting or interview booking to the user. Use this when the user asks to schedule a call, interview, or meeting.",
                        parameters: {
                            type: "object",
                            properties: {
                                reason: {
                                    type: "string",
                                    description: "The reason for the meeting (e.g., 'Interview', 'Introductory Call').",
                                },
                            },
                            required: [],
                        },
                    },
                },
            ],
        });

        console.log(`✅ Assistant updated!`);
        console.log(`Tools: ${assistant.tools.map(t => t.type).join(', ')}`);

    } catch (error) {
        console.error('❌ Error updating assistant:', error);
    }
}

updateAssistantTools();
