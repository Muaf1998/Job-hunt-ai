import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({ apiKey: 'sk-placeholder' });

console.log('OpenAI Version Debug:');
console.log('openai.beta keys:', Object.keys(openai.beta));
if (openai.beta.vectorStores) {
    console.log('openai.beta.vectorStores exists');
} else {
    console.log('openai.beta.vectorStores is UNDEFINED');
}
