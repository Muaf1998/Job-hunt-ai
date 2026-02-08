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

async function testExperience() {
    if (!ASSISTANT_ID) {
        console.error('❌ Missing OPENAI_ASSISTANT_ID');
        process.exit(1);
    }

    console.log(`🧪 Testing Experience Question for Assistant ${ASSISTANT_ID}...`);

    try {
        const thread = await openai.beta.threads.create();
        console.log(`🧵 Thread created: ${thread.id}`);

        await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: "Where have I worked previously? Please list my experience."
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
                if (text.includes('iquanti') && text.includes('successworks')) {
                    console.log('✅ SUCCESS: Mentioned correct companies.');
                } else {
                    console.log('⚠️ WARNING: Did not mention expected companies (iQuanti, SuccessWorks).');
                }

                if (text.includes('cognizant')) {
                    console.log('❌ FAILED: Still mentioning Cognizant (Hallucination).');
                } else {
                    console.log('✅ SUCCESS: No Cognizant hallucination detected.');
                }
            }
        } else {
            console.log(`❌ Run status: ${run.status}`);
        }

    } catch (error) {
        console.error('❌ Error during test:', error);
    }
}

testExperience();
