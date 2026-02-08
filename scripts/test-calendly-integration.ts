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

async function testCalendlyIntegration() {
    if (!ASSISTANT_ID) {
        console.error('❌ Missing OPENAI_ASSISTANT_ID');
        process.exit(1);
    }

    console.log(`🧪 Testing Assistant ${ASSISTANT_ID} for meeting tool...`);

    try {
        // Create Thread
        const thread = await openai.beta.threads.create();
        console.log(`🧵 Thread created: ${thread.id}`);

        // Add Message
        await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: "I'd like to schedule an interview with you."
        });
        console.log('💬 User message sent: "I\'d like to schedule an interview with you."');

        // Run Assistant
        const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
            assistant_id: ASSISTANT_ID,
        });

        if (run.status === 'requires_action') {
            const toolCalls = run.required_action?.submit_tool_outputs.tool_calls;
            const bookMeetingCall = toolCalls?.find(tc => tc.function.name === 'book_meeting');

            if (bookMeetingCall) {
                console.log('✅ SUCCESS: Assistant triggered "book_meeting" tool!');
                console.log('Args:', bookMeetingCall.function.arguments);
            } else {
                console.log('❌ FAILED: Assistant required action but NOT "book_meeting".');
                console.log('Tool calls:', JSON.stringify(toolCalls, null, 2));
            }
        } else {
            console.log(`❌ FAILED: Run status is "${run.status}", expected "requires_action".`);
            if (run.status === 'completed') {
                const messages = await openai.beta.threads.messages.list(run.thread_id);
                console.log('Assistant response:', messages.data[0].content[0]);
            }
        }

    } catch (error) {
        console.error('❌ Error during test:', error);
    }
}

testCalendlyIntegration();
