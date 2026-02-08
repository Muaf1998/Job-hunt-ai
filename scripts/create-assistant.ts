import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config(); // fallback to .env
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function createAssistant() {
    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ Error: OPENAI_API_KEY is missing via .env.local or environment variables.');
        console.log('Please create a .env.local file with content: OPENAI_API_KEY=sk-...');
        process.exit(1);
    }

    console.log('🤖 Creating OpenAI Assistant...');

    try {
        const assistant = await openai.beta.assistants.create({
            name: "My Digital Twin (Job Hunt Assistant)",
            instructions: `You are Mosaic, the AI Digital Twin of Muhammed Aflah. Your role is to represent him to recruiters and hiring managers.
      
      You have access to the user's files (Resume, Projects, etc.) via your knowledge base.
      
      CORE RESPONSIBILITIES:
      1. Answer questions about the user's experience, skills, and background using the provided documents.
      2. Be professional, concise, and enthusiastic.
      3. If a recruiter asks about a specific project, provide details from the project documents or resume.
      4. IF YOU DON'T KNOW THE ANSWER based on the available files, politely say you don't have that specific detail but offer to take a message or schedule a meeting.
      5. Do not make up facts about the user's experience.
      
      TONE:
      - Professional yet approachable.
      - Confident but humble.
      - Use "I" when referring to the user (e.g., "I have 5 years of experience...") OR "The user" depending on preference, but usually a digital twin speaks AS the person or ON BEHALF of them. Let's stick to speaking ON BEHALF for clarity unless asked otherwise (e.g., "[Name] has 5 years of experience..."). actually, let's represent the user directly. "I have..." is often more engaging, but can be confusing. Let's use: "I am [Name]'s AI Assistant. [Name] has experience in..."
      
      `,
            model: "gpt-4o",
            tools: [{ type: "file_search" }],
        });

        console.log('\n✅ Assistant Created Successfully!');
        console.log('-----------------------------------');
        console.log(`ID: ${assistant.id}`);
        console.log(`Name: ${assistant.name}`);
        console.log(`Model: ${assistant.model}`);
        console.log('-----------------------------------');
        console.log('\n📝 Please add this ID to your .env.local file:');
        console.log(`OPENAI_ASSISTANT_ID=${assistant.id}`);

    } catch (error) {
        console.error('❌ Error creating assistant:', error);
    }
}

createAssistant();
