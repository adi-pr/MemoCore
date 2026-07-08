import { db } from "./db";

const SETUP_COMPLETE_KEY = "setup_complete";

export function isSetupComplete(): boolean {
  const row = db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(SETUP_COMPLETE_KEY) as { value: string } | undefined;

  return row?.value === "true";
}

export function markSetupComplete(): void {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(SETUP_COMPLETE_KEY, "true");
}
