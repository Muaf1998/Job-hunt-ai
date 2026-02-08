import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: fs.existsSync(envPath) ? envPath : undefined });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;
const DOCS_DIR = path.resolve(process.cwd(), 'documents');

async function uploadDocuments() {
    if (!process.env.OPENAI_API_KEY || !ASSISTANT_ID) {
        console.error('❌ Missing credentials. Please check .env.local');
        process.exit(1);
    }

    // 1. Check for files
    if (!fs.existsSync(DOCS_DIR)) {
        console.error('❌ Documents directory not found.');
        process.exit(1);
    }

    const files = fs.readdirSync(DOCS_DIR).filter(file => 
        ['.pdf', '.txt', '.docx', '.md'].includes(path.extname(file).toLowerCase())
    );

    if (files.length === 0) {
        console.log('⚠️ No supported files found in documents/ folder. Please add some files first.');
        return;
    }

    console.log(`Found ${files.length} files. Starting upload...`);

    try {
        // 2. Upload files to OpenAI
        const fileStreams = files.map(file => ({
            name: file,
            stream: fs.createReadStream(path.join(DOCS_DIR, file))
        }));

        const uploadedFiles = [];
        for (const fileItem of fileStreams) {
            console.log(`uploading ${fileItem.name}...`);
            const file = await openai.files.create({
                file: fileItem.stream,
                purpose: 'assistants',
            });
            uploadedFiles.push(file);
        }

        console.log(`✅ Uploaded ${uploadedFiles.length} files.`);

        // 3. Create Vector Store
        console.log('Creating Vector Store...');
        const vectorStore = await openai.beta.vectorStores.create({
            name: "Job Hunt Context",
        });

        // 4. Add files to Vector Store
        console.log('Adding files to Vector Store...');
        await openai.beta.vectorStores.fileBatches.createAndPoll(
            vectorStore.id,
            { file_ids: uploadedFiles.map(f => f.id) }
        );

        // 5. Update Assistant
        console.log('Linking Vector Store to Assistant...');
        await openai.beta.assistants.update(ASSISTANT_ID, {
            tool_resources: {
                file_search: {
                    vector_store_ids: [vectorStore.id],
                },
            },
        });

        console.log('\n🎉 Success! Your assistant now has access to your documents.');
        console.log('You can restart your chat server and verify functionality.');

    } catch (error) {
        console.error('❌ Error during upload process:', error);
    }
}

uploadDocuments();
