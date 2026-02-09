import OpenAI from 'openai';

// Allow build to pass without key, but fail at runtime if missing
const apiKey = process.env.OPENAI_API_KEY || '';

if (!apiKey && process.env.NODE_ENV !== 'production') {
  console.warn('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey: apiKey,
});

export const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;
