# init_chat_db.py

import sqlite3

conn = sqlite3.connect("chat_history.db")
cur = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    question TEXT,
    answer TEXT,
    sources TEXT,  -- comma-separated filenames
    timestamp TEXT
)
""")

conn.commit()
conn.close()
print("✅ chat_history.db initialized.")
