# chunk_reports_sqlite.py

import os
import sqlite3
from typing import List

def chunk_text(text: str, max_words: int = 200) -> List[str]:
    words = text.split()
    return [" ".join(words[i:i + max_words]) for i in range(0, len(words), max_words)]

def chunk_reports_to_sqlite(input_dir: str, db_path: str):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Ensure table name matches what Flask expects
    cur.execute("DROP TABLE IF EXISTS chunks")
    cur.execute("CREATE TABLE chunks (file TEXT, chunk TEXT)")

    for filename in os.listdir(input_dir):
        if filename.endswith(".txt"):
            filepath = os.path.join(input_dir, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                text = f.read()

            chunks = chunk_text(text)
            cur.executemany(
                "INSERT INTO chunks (file, chunk) VALUES (?, ?)",
                [(filename, chunk) for chunk in chunks]
            )

    conn.commit()
    conn.close()
    print(f"✅ Chunked {input_dir} into {db_path}")

if __name__ == "__main__":
    # IMPORTANT: use 'geolabs.db' to match what Flask app.py uses
    chunk_reports_to_sqlite("cleaned_reports", "geolabs.db")
