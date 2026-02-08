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
// The specific file the user confirmed is correct
const CORRECT_FILENAME = "Aflah,Muhammed_AI.pdf";

async function fixVectorStore() {
    if (!ASSISTANT_ID) {
        console.error('❌ Missing OPENAI_ASSISTANT_ID');
        process.exit(1);
    }

    console.log(`🧹 Cleaning up knowledge base for Assistant: ${ASSISTANT_ID}`);

    try {
        // 1. Find the correct file ID from the uploaded files (or re-upload if needed)
        const docsDir = path.resolve(process.cwd(), 'documents');
        const filePath = path.join(docsDir, CORRECT_FILENAME);

        if (!fs.existsSync(filePath)) {
            console.error(`❌ Could not find reliable source file: ${filePath}`);
            process.exit(1);
        }

        console.log(`\n📄 Uploading FRESH copy of ${CORRECT_FILENAME}...`);
        const fileStream = fs.createReadStream(filePath);
        const file = await openai.files.create({
            file: fileStream,
            purpose: 'assistants',
        });
        console.log(`   File ID: ${file.id}`);

        // 2. Create a NEW Vector Store
        console.log('\nZE Creating NEW, CLEAN Vector Store...');
        const vectorStore = await openai.beta.vectorStores.create({
            name: "Job Hunt Context (CLEAN)",
        });
        console.log(`   Vector Store ID: ${vectorStore.id}`);

        // 3. Add ONLY the correct file
        console.log(`\n🔗 Adding ${CORRECT_FILENAME} to Vector Store...`);
        await openai.beta.vectorStores.fileBatches.createAndPoll(
            vectorStore.id,
            { file_ids: [file.id] }
        );

        // 4. Update Assistant to use ONLY this new vector store
        console.log('\n🤖 Updating Assistant to use ONLY the new Vector Store...');
        await openai.beta.assistants.update(ASSISTANT_ID, {
            tool_resources: {
                file_search: {
                    vector_store_ids: [vectorStore.id],
                }
            }
        });

        console.log('\n✅ Knowledge Base Fixed!');
        console.log(`The assistant is now explicitly using ONLY "${CORRECT_FILENAME}".`);
        console.log('Conflicting files (like Profile.pdf) have been detached.');

    } catch (error) {
        console.error('❌ Error fixing vector store:', error);
    }
}

fixVectorStore();
