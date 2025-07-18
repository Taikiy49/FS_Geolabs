import os
import re
import sqlite3
from collections import defaultdict, Counter
from concurrent.futures import ProcessPoolExecutor, as_completed

import numpy as np
from sentence_transformers import SentenceTransformer
import faiss

# Constants
INPUT_DIR = "cleaned_reports"
DB_PATH = "geolabs.db"
INDEX_PATH = "geolab_faiss.index"
EMBEDDING_MODEL = "BAAI/bge-base-en-v1.5"
CHUNK_WORD_LIMIT = 200

def extract_metadata(text):
    title_match = re.search(r"(?i)^title:\s*(.+)", text)
    wo_match = re.search(r"(?i)work\s*order\s*(?:no)?[:.]?\s*(\d{3,6})", text)
    title = title_match.group(1).strip() if title_match else None
    work_order = wo_match.group(1).strip() if wo_match else None
    return title, work_order

def chunk_text(text, max_words=200):
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks = []
    buffer = []
    count = 0

    for para in paragraphs:
        words = para.split()
        if count + len(words) > max_words:
            if buffer:
                chunks.append(" ".join(buffer))
            buffer = words
            count = len(words)
        else:
            buffer += words
            count += len(words)

    if buffer:
        chunks.append(" ".join(buffer))
    return chunks

def build_inverted_index(chunks_data):
    inverted = defaultdict(list)
    for row_id, (file, chunk, chunk_id, _, _) in enumerate(chunks_data):
        words = re.findall(r'\b\w+\b', chunk.lower())
        freq = Counter(words)
        for word, count in freq.items():
            inverted[word].append((file, chunk_id, count))
    return inverted

def save_to_sqlite(chunks_data, inverted_index):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("DROP TABLE IF EXISTS chunks")
    cur.execute("DROP TABLE IF EXISTS inverted_index")

    cur.execute("""
        CREATE TABLE chunks (
            file TEXT,
            chunk TEXT,
            chunk_id INTEGER,
            title TEXT,
            work_order TEXT
        )
    """)

    cur.execute("""
        CREATE TABLE inverted_index (
            keyword TEXT,
            file TEXT,
            chunk_id INTEGER,
            term_freq INTEGER
        )
    """)

    cur.executemany(
        "INSERT INTO chunks (file, chunk, chunk_id, title, work_order) VALUES (?, ?, ?, ?, ?)",
        chunks_data
    )

    index_rows = []
    for word, entries in inverted_index.items():
        for file, chunk_id, tf in entries:
            index_rows.append((word, file, chunk_id, tf))

    cur.executemany(
        "INSERT INTO inverted_index (keyword, file, chunk_id, term_freq) VALUES (?, ?, ?, ?)",
        index_rows
    )

    conn.commit()
    conn.close()
    print(f"📚 Saved {len(chunks_data)} chunks and inverted index to {DB_PATH}")

def generate_embeddings_parallel(chunks, model_name):
    print(f"⚙️ Loading embedding model: {model_name}")
    model = SentenceTransformer(model_name)
    print("⚙️ Generating embeddings in parallel...")
    embeddings = model.encode(chunks, batch_size=32, show_progress_bar=True)
    return embeddings

def save_faiss_index(embeddings, index_path):
    print("💾 Saving FAISS index...")
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(np.array(embeddings).astype("float32"))
    faiss.write_index(index, index_path)
    print(f"✅ FAISS index saved to {index_path}")

def main():
    print("📂 Starting index build from:", INPUT_DIR)
    chunks_data = []
    chunk_texts = []

    for filename in os.listdir(INPUT_DIR):
        if not filename.endswith(".txt"):
            continue
        with open(os.path.join(INPUT_DIR, filename), "r", encoding="utf-8") as f:
            text = f.read()
        title, work_order = extract_metadata(text)
        chunks = chunk_text(text, max_words=CHUNK_WORD_LIMIT)
        for i, chunk in enumerate(chunks):
            chunks_data.append((filename, chunk, i, title, work_order))
            chunk_texts.append(chunk)
        print(f"✅ {filename}: {len(chunks)} chunks")

    print("🔍 Building inverted index...")
    inverted_index = build_inverted_index(chunks_data)

    save_to_sqlite(chunks_data, inverted_index)

    embeddings = generate_embeddings_parallel(chunk_texts, EMBEDDING_MODEL)

    save_faiss_index(embeddings, INDEX_PATH)

    print(f"\n🎉 Done! {len(chunks_data)} chunks processed from {INPUT_DIR}")

if __name__ == "__main__":
    main()