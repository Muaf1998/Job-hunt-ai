
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

async function fastModel() {
    if (!ASSISTANT_ID) {
        console.error('❌ Missing OPENAI_ASSISTANT_ID');
        process.exit(1);
    }

    console.log(`Upgrading Assistant: ${ASSISTANT_ID} to gpt-4o...`);

    try {
        const assistant = await openai.beta.assistants.update(ASSISTANT_ID, {
            model: "gpt-4o"
        });

        console.log(`✅ Success! Assistant is now using model: ${assistant.model}`);

    } catch (error) {
        console.error('❌ Error updating model:', error);
    }
}

fastModel();
