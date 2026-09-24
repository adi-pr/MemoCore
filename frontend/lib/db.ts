import Database from "better-sqlite3";

export const db = new Database("./sqlite.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL
  );
`);
