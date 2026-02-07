import sqlite3
import os

DB_PATH = r"g:\Projects\Memora\.memory_index.db"

def check_db():
    if not os.path.exists(DB_PATH):
        print(f"DB not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT count(*) FROM memories")
    count = c.fetchone()[0]
    print(f"Total memories: {count}")
    
    if count > 0:
        c.execute("SELECT file_id, path, memory_summary FROM memories LIMIT 5")
        rows = c.fetchall()
        for r in rows:
            print(f" - {r}")
    
    conn.close()

if __name__ == "__main__":
    check_db()
