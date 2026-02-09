import { openai, ASSISTANT_ID } from '@/lib/openai';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pump = promisify(pipeline);

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!ASSISTANT_ID) {
            return NextResponse.json({ error: 'Assistant ID not configured' }, { status: 500 });
        }

        // save file temporarily
        const buffer = Buffer.from(await file.arrayBuffer());
        const tempFilePath = path.join(os.tmpdir(), file.name);
        await fs.promises.writeFile(tempFilePath, buffer);

        // 1. Upload file to OpenAI
        const fileStream = fs.createReadStream(tempFilePath);
        const openaiFile = await openai.files.create({
            file: fileStream,
            purpose: 'assistants',
        });

        // 2. Create Vector Store (or get existing one embedded in assistant)
        // For simplicity, we'll create a new vector store attached to the assistant if one doesn't exist, 
        // or we just find the vector store attached to the assistant.

        const assistant = await openai.beta.assistants.retrieve(ASSISTANT_ID);
        let vectorStoreId = assistant.tool_resources?.file_search?.vector_store_ids?.[0];

        if (!vectorStoreId) {
            const vectorStore = await openai.beta.vectorStores.create({
                name: "Job Hunt Knowledge Base",
            });
            vectorStoreId = vectorStore.id;
            await openai.beta.assistants.update(ASSISTANT_ID, {
                tool_resources: {
                    file_search: {
                        vector_store_ids: [vectorStoreId],
                    },
                },
            });
        }

        // 3. Add file to Vector Store
        await openai.beta.vectorStores.files.create(vectorStoreId, {
            file_id: openaiFile.id
        });

        // Cleanup
        await fs.promises.unlink(tempFilePath);

        return NextResponse.json({ success: true, fileId: openaiFile.id });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
