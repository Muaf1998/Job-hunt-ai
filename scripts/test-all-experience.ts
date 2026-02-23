import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: fs.existsSync(envPath) ? envPath : undefined });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

async function testAllExperience() {
    console.log(`🧪 Testing All Experience...`);
    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        // Force the assistant to list everything
        content: "List ALL of my work experience across all provided documents. Do not summarize, list every single role and company you can find in my files."
    });

    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
        assistant_id: ASSISTANT_ID as string,
    });

    if (run.status === 'completed') {
        const steps = await openai.beta.threads.runs.steps.list(thread.id, run.id);
        console.log('\n🔍 Run Steps:');
        steps.data.forEach(step => {
            if (step.type === 'tool_calls') {
                const calls = (step.step_details as any).tool_calls;
                console.log(`Tool Called: ${calls.map((c: any) => c.type).join(', ')}`);
            } else {
                console.log(`Step Type: ${step.type}`);
            }
        });

        const messages = await openai.beta.threads.messages.list(run.thread_id);
        console.log('\n💬 Assistant Response:\n-----------------------------------');
        console.log((messages.data[0].content[0] as any).text.value);
        console.log('-----------------------------------');
    } else {
        console.log(`Run status: ${run.status}`);
    }
}
testAllExperience();
