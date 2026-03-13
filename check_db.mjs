// Check DB vectors safely
import Database from 'better-sqlite3';

const dbPath = 'C:/Users/peta GamePC/AppData/Roaming/nova-bot/memory.db';
const db = new Database(dbPath);

try {
  const rows = db.prepare('SELECT id, content, vector FROM memories WHERE vector IS NOT NULL LIMIT 10').all();
  console.log(`Checking ${rows.length} memories with vectors...`);
  
  rows.forEach(row => {
    try {
      const vec = JSON.parse(row.vector);
      const sum = vec.reduce((a, b) => a + Math.abs(b), 0);
      console.log(`ID: ${row.id}, Content: "${row.content.substring(0, 30)}...", Vec Length: ${vec.length}, Abs Sum: ${sum}`);
    } catch (e) {
      console.log(`ID: ${row.id}, Error parsing vector: ${e.message}`);
    }
  });
} catch (e) {
  console.error('DB Error:', e.message);
} finally {
  db.close();
}
