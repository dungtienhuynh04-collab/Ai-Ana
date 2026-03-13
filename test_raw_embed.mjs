// Raw Fetch test for Embeddings
async function test() {
  const url = 'http://127.0.0.1:11434/v1/embeddings';
  const body = {
    model: 'text-embedding-nomic-embed-text-v1.5',
    input: 'Hello world'
  };

  console.log(`Sending raw fetch to ${url}...`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer lm-studio'
      },
      body: JSON.stringify(body)
    });
    
    const json = await res.json();
    console.log('Response status:', res.status);
    
    if (json.data && json.data[0]) {
      const vec = json.data[0].embedding;
      console.log('Vector length:', vec.length);
      const sum = vec.reduce((a, b) => a + Math.abs(b), 0);
      console.log('Sum of absolute values:', sum);
      console.log('Sample (first 10):', vec.slice(0, 10));
    } else {
      console.log('Unexpected response structure:', JSON.stringify(json));
    }
  } catch (e) {
    console.error('Fetch failed:', e.message);
  }
}

test();
