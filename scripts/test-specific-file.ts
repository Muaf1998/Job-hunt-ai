import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: fs.existsSync(envPath) ? envPath : undefined });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

async function testSpecificFile() {
    console.log(`🧪 Testing Aflah_Muhammed.pdf...`);
    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: "What are the exact contents of the file Aflah_Muhammed.pdf? Give me a list of all jobs mentioned in that specific file."
    });

    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
        assistant_id: ASSISTANT_ID as string,
    });

    if (run.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(run.thread_id);
        console.log('\n💬 Assistant Response:\n-----------------------------------');
        console.log((messages.data[0].content[0] as any).text.value);
        console.log('-----------------------------------');
    }
}
testSpecificFile();
