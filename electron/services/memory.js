import Database from "better-sqlite3";
import { app } from "electron";
import path from "path";

let db = null;

function getDbPath() {
  const userData = app.getPath("userData");
  return path.join(userData, "memory.db");
}

export const memoryService = {
  init() {
    if (db) return;
    db = new Database(getDbPath());
    db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user TEXT NOT NULL DEFAULT 'User',
        content TEXT NOT NULL,
        time TEXT NOT NULL,
        score REAL DEFAULT 0.5,
        created_at TEXT DEFAULT (datetime('now')),
        vector TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_memories_content ON memories(content);
      CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user);
    `);

    // Migration: Add vector column if it doesn't exist
    const columns = db.prepare("PRAGMA table_info(memories)").all();
    const hasVector = columns.some(col => col.name === 'vector');
    if (!hasVector) {
      db.exec("ALTER TABLE memories ADD COLUMN vector TEXT");
    }
  },

  close() {
    if (db) {
      db.close();
      db = null;
    }
  },

  getAll() {
    if (!db) return [];
    const rows = db.prepare("SELECT id, user, content, time, score FROM memories ORDER BY id DESC").all();
    return rows.map((r) => ({
      id: r.id,
      user: r.user,
      content: r.content,
      time: r.time,
      score: r.score,
    }));
  },

  search(query) {
    if (!db) return [];
    const q = `%${query}%`;
    const rows = db
      .prepare("SELECT id, user, content, time, score FROM memories WHERE content LIKE ? OR user LIKE ? ORDER BY id DESC")
      .all(q, q);
    return rows.map((r) => ({
      id: r.id,
      user: r.user,
      content: r.content,
      time: r.time,
      score: r.score,
    }));
  },

  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  },

  searchVector(queryVector, limit = 3, minScore = 0.5) {
    if (!db || !queryVector) return [];
    
    // Fetch all memories that have a vector
    const rows = db.prepare("SELECT id, user, content, time, score, vector FROM memories WHERE vector IS NOT NULL").all();
    
    const results = [];
    for (const row of rows) {
      try {
        const vec = JSON.parse(row.vector);
        const similarity = this.cosineSimilarity(queryVector, vec);
        if (similarity >= minScore) {
          results.push({ ...row, similarity });
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }
    
    // Sort by similarity descending
    results.sort((a, b) => b.similarity - a.similarity);
    
    return results.slice(0, limit);
  },

  add(record, limit = null) {
    if (!db) return null;

    if (limit && limit > 0) {
      const countRow = db.prepare("SELECT COUNT(*) as count FROM memories").get();
      if (countRow.count >= limit) {
        // Find the memory with the lowest score (if tied, get the oldest one)
        const lowest = db.prepare("SELECT id, score FROM memories ORDER BY score ASC, id ASC LIMIT 1").get();
        const newScore = record.score ?? 0.5;
        
        if (lowest && newScore >= lowest.score) {
          // Delete the lowest scoring memory to make room
          db.prepare("DELETE FROM memories WHERE id = ?").run(lowest.id);
        } else if (lowest && newScore < lowest.score) {
          // New memory has a lower score than everything in the database, discard it
          return null;
        }
      }
    }

    const stmt = db.prepare(
      "INSERT INTO memories (user, content, time, score, vector) VALUES (?, ?, ?, ?, ?)"
    );
    const result = stmt.run(
      record.user || "User",
      record.content || "",
      record.time || new Date().toISOString().slice(0, 16).replace("T", " "),
      record.score ?? 0.5,
      record.vector || null
    );
    return result.lastInsertRowid;
  },

  update(id, content, vector = null) {
    if (!db) return false;
    if (vector) {
      const stmt = db.prepare("UPDATE memories SET content = ?, vector = ? WHERE id = ?");
      const result = stmt.run(content, vector, id);
      return result.changes > 0;
    } else {
      const stmt = db.prepare("UPDATE memories SET content = ? WHERE id = ?");
      const result = stmt.run(content, id);
      return result.changes > 0;
    }
  },

  delete(id) {
    if (!db) return false;
    const stmt = db.prepare("DELETE FROM memories WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  },

  deleteMany(ids) {
    if (!db || !ids?.length) return 0;
    const placeholders = ids.map(() => "?").join(",");
    const stmt = db.prepare(`DELETE FROM memories WHERE id IN (${placeholders})`);
    const result = stmt.run(...ids);
    return result.changes;
  },
};
