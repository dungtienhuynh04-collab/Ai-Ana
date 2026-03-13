import http from 'http';

function fetchJSON(path) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: '127.0.0.1', port: 11434, path, method: 'GET',
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode, raw: body }); }
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.end();
  });
}

(async () => {
  const v0 = await fetchJSON('/api/v0/models');
  if (v0.data) {
    const models = v0.data.data || v0.data || [];
    console.log("=== All Models (V0) ===");
    models.forEach(m => {
      console.log(`- ID: ${m.id}`);
      console.log(`  Type: ${m.type}, State: ${m.state}`);
      console.log(`  Context: loaded=${m.loaded_context_length}, max=${m.max_context_length}`);
    });
  } else {
    console.log("V0 Error:", v0);
  }
})();
