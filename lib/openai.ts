import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable. Please set it in your .env.local file or in your environment.');
}

console.log('OpenAI API Key:', process.env.OPENAI_API_KEY.slice(0, 5) + '...'); // Log the first 5 characters of the API key

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});