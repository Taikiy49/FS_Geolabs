# build_inverted_index_sqlite.py

import sqlite3
import re
from collections import defaultdict

def tokenize(text):
    return re.findall(r'\b\w+\b', text.lower())

def build_inverted_index(db_path: str):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Read from chunks table
    cur.execute("SELECT file, chunk FROM chunks")
    rows = cur.fetchall()

    # Build inverted index in memory
    inverted_index = defaultdict(set)
    for file_name, chunk_text in rows:
        for token in tokenize(chunk_text):
            inverted_index[token].add(file_name)

    # Save to inverted_index table in same DB
    cur.execute("DROP TABLE IF EXISTS inverted_index")
    cur.execute("CREATE TABLE inverted_index (keyword TEXT, file TEXT)")

    for keyword, files in inverted_index.items():
        cur.executemany(
            "INSERT INTO inverted_index (keyword, file) VALUES (?, ?)",
            [(keyword, file) for file in files]
        )

    conn.commit()
    conn.close()
    print(f"✅ Inverted index built with {len(inverted_index)} unique keywords in {db_path}")

if __name__ == "__main__":
    build_inverted_index("geolabs.db")  # ✅ Use single DB
