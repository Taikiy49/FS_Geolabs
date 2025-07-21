# chunk_and_embed.py
import sqlite3
import os
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

DB_PATH = "employee_handbook.db"
MODEL_NAME = "BAAI/bge-base-en-v1.5"
INPUT_FILE = "employee_handbook.txt"
CHUNK_SIZE = 800
OVERLAP = 200


def chunk_text(text, chunk_size=800, overlap=200):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = ' '.join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks


def create_database(db_path):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS handbook_chunks (
                    id INTEGER PRIMARY KEY,
                    chunk TEXT,
                    embedding BLOB
                )''')
    conn.commit()
    conn.close()


def insert_chunks(db_path, chunks, embeddings):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    for chunk, emb in tqdm(zip(chunks, embeddings), total=len(chunks)):
        c.execute("INSERT INTO handbook_chunks (chunk, embedding) VALUES (?, ?)",
                  (chunk, emb.tobytes()))
    conn.commit()
    conn.close()


def embed_to_db(input_txt, db_path):
    with open(input_txt, "r", encoding="utf-8") as f:
        text = f.read()
    print("📄 Loaded handbook text")

    print("✂️ Chunking text...")
    chunks = chunk_text(text, CHUNK_SIZE, OVERLAP)
    print(f"✅ Created {len(chunks)} chunks")

    print("📦 Loading model and embedding...")
    model = SentenceTransformer(MODEL_NAME)
    embeddings = model.encode(chunks, convert_to_tensor=False, show_progress_bar=True)

    print("💾 Creating database and saving embeddings...")
    create_database(db_path)
    insert_chunks(db_path, chunks, embeddings)
    print(f"🎉 Done. Saved {len(chunks)} embedded chunks to {db_path}")


# Run it
if __name__ == '__main__':
    embed_to_db(INPUT_FILE, DB_PATH)
