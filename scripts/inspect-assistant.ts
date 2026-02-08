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

async function inspectAssistant() {
    if (!ASSISTANT_ID) {
        console.error('❌ Missing OPENAI_ASSISTANT_ID');
        process.exit(1);
    }

    console.log(`🕵️‍♀️ Inspecting Assistant: ${ASSISTANT_ID}`);

    try {
        const assistant = await openai.beta.assistants.retrieve(ASSISTANT_ID);

        console.log(`Name: ${assistant.name}`);
        console.log(`Tools: ${assistant.tools.map(t => t.type).join(', ')}`);

        const fileSearchTool = assistant.tools.find(t => t.type === 'file_search');
        if (!fileSearchTool) {
            console.log('❌ file_search tool is NOT enabled!');
        } else {
            console.log('✅ file_search tool is enabled.');
        }

        const vectorStoreIds = assistant.tool_resources?.file_search?.vector_store_ids;

        if (!vectorStoreIds || vectorStoreIds.length === 0) {
            console.log('❌ No vector stores attached to file_search.');
        } else {
            console.log(`✅ Found ${vectorStoreIds.length} vector store(s): ${vectorStoreIds.join(', ')}`);

            for (const vsId of vectorStoreIds) {
                console.log(`\n📂 Checking Vector Store: ${vsId}`);
                const vs = await openai.beta.vectorStores.retrieve(vsId);
                console.log(`   Name: ${vs.name}`);
                console.log(`   File Count: ${vs.file_counts.total}`);

                const files = await openai.beta.vectorStores.files.list(vsId);
                console.log('   Files:');
                for (const file of files.data) {
                    const fileDetails = await openai.files.retrieve(file.id);
                    console.log(`   - ${fileDetails.filename} (${file.id})`);
                }
            }
        }

    } catch (error) {
        console.error('❌ Error inspecting assistant:', error);
    }
}

inspectAssistant();
