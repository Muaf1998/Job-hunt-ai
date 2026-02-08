
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

async function checkModel() {
    if (!ASSISTANT_ID) {
        console.error('❌ Missing OPENAI_ASSISTANT_ID');
        process.exit(1);
    }

    console.log(`Checking model for Assistant: ${ASSISTANT_ID}`);

    try {
        const assistant = await openai.beta.assistants.retrieve(ASSISTANT_ID);
        console.log(`Current Model: ${assistant.model}`);

        // If it's not gpt-4o, suggest updating
        if (!assistant.model.includes('gpt-4o')) {
            console.log('⚠️ Suggestion: Update to "gpt-4o" for faster responses.');
        } else {
            console.log('✅ Already using a fast model (gpt-4o family).');
        }

    } catch (error) {
        console.error('❌ Error checking model:', error);
    }
}

checkModel();
