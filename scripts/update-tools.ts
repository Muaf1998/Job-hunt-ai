
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

async function updateTools() {
    if (!ASSISTANT_ID) {
        console.error('❌ Missing OPENAI_ASSISTANT_ID');
        process.exit(1);
    }

    console.log(`Updating tools for Assistant: ${ASSISTANT_ID}`);

    const existingTools: any[] = [
        { type: "file_search" },
        {
            type: "function",
            function: {
                name: "book_meeting",
                description: "Trigger the Calendly widget to allow the user to schedule a meeting.",
                parameters: { type: "object", properties: {}, required: [] },
            },
        },
        {
            type: "function",
            function: {
                name: "email_resume",
                description: "Email the user's resume to a provided email address.",
                parameters: {
                    type: "object",
                    properties: {
                        email: {
                            type: "string",
                            description: "The email address to send the resume to.",
                        },
                    },
                    required: ["email"],
                },
            },
        }
    ];

    try {
        const assistant = await openai.beta.assistants.update(ASSISTANT_ID, {
            tools: existingTools
        });

        console.log('✅ Tools updated successfully!');
        console.log('Tools Preview:', JSON.stringify(assistant.tools, null, 2));

    } catch (error) {
        console.error('❌ Error updating tools:', error);
    }
}

updateTools();
