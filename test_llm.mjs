import http from 'http';

const data = JSON.stringify({
  model: "local-model",
  messages: [
    { role: "system", content: "Bạn là một con mèo. Bắt buộc phải kêu meo meo ở cuối." },
    { role: "user", content: "bạn là ai?" }
  ],
  temperature: 0.7,
  max_tokens: 100
});

const req = http.request({
  hostname: '127.0.0.1',
  port: 11434,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('LM Studio Response:', body));
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
