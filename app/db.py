# app/db.py
import sqlite3
import numpy as np

# Updated Schema for Phase 1.5
SCHEMA = """
CREATE TABLE IF NOT EXISTS memories (
    file_id TEXT PRIMARY KEY,
    path TEXT,
    hash TEXT,
    created_at TEXT,
    modified_at TEXT,
    exif_date TEXT,
    ocr_text TEXT,
    caption TEXT,
    memory_summary TEXT,
    tags TEXT,
    vision_json TEXT,
    vision_status TEXT,
    embedding BLOB,
    thumbnail BLOB,
    schema_version INTEGER DEFAULT 2
);
CREATE INDEX IF NOT EXISTS idx_hash ON memories(hash);
CREATE INDEX IF NOT EXISTS idx_path ON memories(path);

CREATE TABLE IF NOT EXISTS vision_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    endpoint_url TEXT,
    model_name TEXT,
    api_key TEXT
);
"""

def init_db(db_path: str):
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL;")

    # Check for existing schema and migrate if needed
    try:
        cur = conn.cursor()
        cur.execute("SELECT vision_json FROM memories LIMIT 1")
    except sqlite3.OperationalError:
        # Columns missing, run migration
        _migrate_to_phase_1_5(conn)

    cur = conn.cursor()
    cur.executescript(SCHEMA)
    conn.commit()
    return conn

def _migrate_to_phase_1_5(conn):
    print("Migrating DB to Phase 1.5...")
    try:
        conn.execute("ALTER TABLE memories ADD COLUMN vision_json TEXT")
    except sqlite3.OperationalError: pass

    try:
        conn.execute("ALTER TABLE memories ADD COLUMN vision_status TEXT")
    except sqlite3.OperationalError: pass

    try:
        conn.execute("ALTER TABLE memories ADD COLUMN schema_version INTEGER DEFAULT 2")
    except sqlite3.OperationalError: pass

    conn.commit()

def row_to_dict(row):
    # row expected: file_id, path, hash, created_at, modified_at, exif_date, ocr_text, caption, memory_summary, tags, vision_json, vision_status, embedding, thumbnail, schema_version...
    if not row:
        return None

    # Note: This is legacy and assumes a specific column order if used with SELECT *.
    # We map what we know for backward compatibility, but callers should prefer explicit selects.
    d = {
        "file_id": row[0],
        "path": row[1],
        "hash": row[2],
        "created_at": row[3],
        "modified_at": row[4],
        "exif_date": row[5],
        "ocr_text": row[6],
        "caption": row[7],
        "memory_summary": row[8],
        "tags": row[9],
    }

    # Check for extended columns if row is long enough
    if len(row) > 10:
        d["vision_json"] = row[10]
    if len(row) > 11:
        d["vision_status"] = row[11]
    if len(row) > 12:
        d["embedding"] = np.frombuffer(row[12], dtype=np.float32) if row[12] else None
    if len(row) > 13:
        d["thumbnail"] = row[13]

    return d
