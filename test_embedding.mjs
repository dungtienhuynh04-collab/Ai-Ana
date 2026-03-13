// Test Embedding Generation inside project
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'http://127.0.0.1:11434/v1',
  apiKey: 'lm-studio'
});

async function test() {
  const model = 'text-embedding-nomic-embed-text-v1.5';
  const text = 'Hôm nay trời đẹp';
  
  console.log(`Testing embedding with model: ${model}`);
  try {
    const res = await client.embeddings.create({
      model,
      input: text
    });
    
    if (!res.data || res.data.length === 0) {
      console.error('ERROR: No data returned from embedding API');
      return;
    }

    const vec = res.data[0].embedding;
    if (!vec) {
      console.error('ERROR: No embedding vector found in response');
      return;
    }

    console.log(`Success! Vector length: ${vec.length}`);
    console.log(`First 5 values: ${vec.slice(0, 5).join(', ')}`);
    
    // Check if it's all zeros
    const sum = vec.reduce((a, b) => a + Math.abs(b), 0);
    console.log(`Vector sum of absolute values: ${sum}`);
    if (sum === 0) {
      console.error('ERROR: Vector is all zeros!');
    }
  } catch (e) {
    console.error('Embedding failed:', e.message);
  }
}

test();
