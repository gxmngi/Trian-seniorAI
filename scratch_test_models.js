const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { generateText } = require('ai');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

async function testModel(modelName) {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Missing API key');
    return false;
  }
  const google = createGoogleGenerativeAI({ apiKey });
  try {
    console.log(`Testing model: ${modelName}...`);
    const response = await generateText({
      model: google(modelName),
      prompt: 'Hello, respond with exactly "OK" if you receive this.',
    });
    console.log(`Model ${modelName} SUCCESS: "${response.text.trim()}"`);
    return true;
  } catch (err) {
    console.error(`Model ${modelName} FAILED: ${err.message}`);
    return false;
  }
}

async function run() {
  const models = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-1.5-flash-8b',
    'gemini-2.0-flash-exp'
  ];
  for (const model of models) {
    await testModel(model);
    console.log('------------------------------------');
  }
}

run();
