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

async function testDescriptions() {
    if (!ASSISTANT_ID) {
        console.error('❌ Missing OPENAI_ASSISTANT_ID');
        process.exit(1);
    }

    console.log(`🧪 Testing Work Descriptions for Assistant ${ASSISTANT_ID}...`);

    try {
        const thread = await openai.beta.threads.create();

        // Ask specifically for descriptions
        await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: "Describe my role and responsibilities at SuccessWorks. What did I actually do there?"
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

                // Check if it mentions key terms from the REAL resume
                // Resume says: "Manage and safeguard sensitive data", "Tableau and Power BI dashboards"
                const hasRealKeywords = text.includes('safeguard') || text.includes('tableau') || text.includes('power bi') || text.includes('40,000');

                // Check if it mentions hallucinated generic web dev terms
                const hasHallucinations = text.includes('website build') || text.includes('html') || text.includes('css');

                if (hasRealKeywords) {
                    console.log('✅ SUCCESS: Mentions valid resume keywords (Tableau, Power BI, Safeguard data).');
                } else {
                    console.log('❌ FAILED: Missing specific keywords from resume.');
                }

                if (hasHallucinations) {
                    console.log('❌ FAILED: Mentions hallucinated "Web Developer" tasks.');
                } else {
                    console.log('✅ SUCCESS: No "Web Developer" hallucinations detected.');
                }
            }
        }

    } catch (error) {
        console.error('❌ Error during test:', error);
    }
}

testDescriptions();
