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

// Use your own email for testing or a throwaway
const TEST_EMAIL = "aflahofficialmail@gmail.com";

async function testEmail() {
    if (!ASSISTANT_ID) {
        console.error('❌ Missing OPENAI_ASSISTANT_ID');
        process.exit(1);
    }

    console.log(`🧪 Testing Email Resume for Assistant ${ASSISTANT_ID}...`);

    try {
        const thread = await openai.beta.threads.create();
        console.log(`🧵 Thread created: ${thread.id}`);

        await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: `Please email my resume to ${TEST_EMAIL}`
        });

        const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
            assistant_id: ASSISTANT_ID,
        });

        if (run.status === 'requires_action') {
            const toolCalls = run.required_action?.submit_tool_outputs.tool_calls;
            if (toolCalls) {
                for (const toolCall of toolCalls) {
                    if (toolCall.function.name === 'email_resume') {
                        const args = JSON.parse(toolCall.function.arguments);
                        console.log('✅ SUCCESS: Assistant triggered email_resume tool.');
                        console.log(`   Email Arg: ${args.email}`);

                        if (args.email === TEST_EMAIL) {
                            console.log('✅ SUCCESS: Email argument matches.');
                        } else {
                            console.log('❌ FAILED: Email argument mismatch.');
                        }
                    }
                }
            }
        } else if (run.status === 'completed') {
            // If we implemented the tool execution DIRECTLY in the script (like in `route.ts`), we would see completed.
            // But here we are just testing if the assistant DECIDES to call the tool.
            // Wait, if I run this locally against OpenAI API, the run will PAUSE at 'requires_action' waiting for output.
            // So 'requires_action' is the correct success state for this test script.
            console.log('❌ FAILED: Run completed without requesting tool action. It might have just replied with text.');
            const messages = await openai.beta.threads.messages.list(run.thread_id);
            console.log('Response:', messages.data[0].content[0]);
        } else {
            console.log(`Run status: ${run.status}`);
        }

    } catch (error) {
        console.error('❌ Error during test:', error);
    }
}

testEmail();
