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
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_memories_content ON memories(content);
      CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user);
    `);
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

  add(record) {
    if (!db) return null;
    const stmt = db.prepare(
      "INSERT INTO memories (user, content, time, score) VALUES (?, ?, ?, ?)"
    );
    const result = stmt.run(
      record.user || "User",
      record.content || "",
      record.time || new Date().toISOString().slice(0, 16).replace("T", " "),
      record.score ?? 0.5
    );
    return result.lastInsertRowid;
  },

  update(id, content) {
    if (!db) return false;
    const stmt = db.prepare("UPDATE memories SET content = ? WHERE id = ?");
    const result = stmt.run(content, id);
    return result.changes > 0;
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
