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

async function testTitles() {
    if (!ASSISTANT_ID) {
        console.error('❌ Missing OPENAI_ASSISTANT_ID');
        process.exit(1);
    }

    console.log(`🧪 Testing Job Titles for Assistant ${ASSISTANT_ID}...`);

    try {
        const thread = await openai.beta.threads.create();

        await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: "What were my specific job titles at iQuanti and SuccessWorks?"
        });

        const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
            assistant_id: ASSISTANT_ID,
        });

        if (run.status === 'completed') {
            const messages = await openai.beta.threads.messages.list(run.thread_id);
            const response = messages.data[0].content[0];

            if (response.type === 'text') {
                console.log('\n💬 Assistant Response:');
                console.log('-----------------------------------');
                console.log(response.text.value);
                console.log('-----------------------------------');

                const text = response.text.value.toLowerCase();

                // Check iQuanti
                if (text.includes('senior analyst')) {
                    console.log('✅ SUCCESS: iQuanti title is "Senior Analyst"');
                } else if (text.includes('software engineer')) {
                    console.log('❌ FAILED: iQuanti title is still "Software Engineer"');
                } else {
                    console.log('⚠️ WARNING: Could not find clear iQuanti title.');
                }

                // Check SuccessWorks
                if (text.includes('intern') || text.includes('data assessment')) {
                    console.log('✅ SUCCESS: SuccessWorks title includes "Intern"');
                } else if (text.includes('web developer')) {
                    console.log('❌ FAILED: SuccessWorks title is still "Web Developer"');
                } else {
                    console.log('⚠️ WARNING: Could not find clear SuccessWorks title.');
                }
            }
        }

    } catch (error) {
        console.error('❌ Error during test:', error);
    }
}

testTitles();
