# admin.py (same directory as app.py)
from flask import Blueprint, request, jsonify
import os
import re
import sqlite3
import tempfile
import fitz  # PyMuPDF
from tqdm import tqdm
from collections import defaultdict
from sentence_transformers import SentenceTransformer

admin_bp = Blueprint('admin', __name__)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

MODEL_NAME = "BAAI/bge-base-en-v1.5"
CHUNK_SIZE = 800
OVERLAP = 200

def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text()
    doc.close()
    return full_text.strip()

def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=OVERLAP):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = ' '.join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

def tokenize(text):
    return re.findall(r'\b\w+\b', text.lower())

def create_tables_if_needed(conn):
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS chunks (
            file TEXT,
            chunk INTEGER,
            text TEXT,
            embedding BLOB
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS inverted_index (
            keyword TEXT,
            file TEXT,
            chunk_id INTEGER,
            term_freq INTEGER
        )
    """)
    conn.commit()

def insert_chunks_with_embeddings(conn, file_name, chunks, embeddings):
    c = conn.cursor()
    for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
        c.execute(
            "INSERT INTO chunks (file, chunk, text, embedding) VALUES (?, ?, ?, ?)",
            (file_name, i, chunk, emb.tobytes())
        )
    conn.commit()

def build_inverted_index(chunks, file_name):
    index = defaultdict(lambda: defaultdict(int))  # {keyword: {chunk_id: freq}}
    for chunk_id, chunk in enumerate(chunks):
        for token in tokenize(chunk):
            index[token][chunk_id] += 1
    return index

def insert_inverted_index(conn, file_name, index):
    c = conn.cursor()
    for keyword, chunk_dict in index.items():
        for chunk_id, freq in chunk_dict.items():
            c.execute(
                "INSERT INTO inverted_index (keyword, file, chunk_id, term_freq) VALUES (?, ?, ?, ?)",
                (keyword, file_name, chunk_id, freq)
            )
    conn.commit()

def embed_to_db(input_pdf_path, db_path):
    file_name = os.path.basename(input_pdf_path)

    print(f"📄 Loading PDF: {file_name}")
    text = extract_text_from_pdf(input_pdf_path)

    if not text:
        print(f"⚠️ Skipped empty or unreadable PDF: {file_name}")
        return

    print("✂️ Chunking text...")
    chunks = chunk_text(text)
    print(f"✅ Created {len(chunks)} chunks")

    if not chunks:
        print(f"⚠️ No chunks extracted from: {file_name}")
        return

    print("🔢 Embedding...")
    model = SentenceTransformer(MODEL_NAME)
    embeddings = model.encode(chunks, convert_to_tensor=False, show_progress_bar=True)

    print("💾 Writing to database...")
    conn = sqlite3.connect(db_path)
    create_tables_if_needed(conn)
    insert_chunks_with_embeddings(conn, file_name, chunks, embeddings)

    print("🧠 Building inverted index...")
    index = build_inverted_index(chunks, file_name)
    insert_inverted_index(conn, file_name, index)

    conn.close()
    print(f"🎉 Done! Indexed {len(chunks)} chunks and keywords into '{db_path}'")

@admin_bp.route('/api/process-file', methods=['POST'])
def process_file():
    try:
        file = request.files.get('file')
        db_name = request.form.get('db_name')
        mode = request.form.get('mode')

        if not file or not db_name:
            return jsonify({'message': 'Missing file or database name'}), 400

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            file.save(tmp)
            tmp_path = tmp.name

        db_path = os.path.join('uploads', db_name)
        os.makedirs('uploads', exist_ok=True)

        embed_to_db(tmp_path, db_path)

        os.remove(tmp_path)
        return jsonify({'message': f"✅ File indexed into {db_name}!"})

    except Exception as e:
        print("❌ Error indexing file:", e)
        return jsonify({'message': '❌ Failed to process file.'}), 500

@admin_bp.route('/api/list-dbs', methods=['GET'])
def list_dbs():
    try:
        dbs = [f for f in os.listdir('uploads') if f.endswith('.db')]
        return jsonify({'dbs': dbs})
    except Exception as e:
        return jsonify({'dbs': [], 'error': str(e)}), 500

@admin_bp.route('/api/inspect-db', methods=['POST'])
def inspect_db():
    try:
        data = request.get_json()
        db_name = data.get('db_name')
        db_path = os.path.join('uploads', db_name)

        if not os.path.exists(db_path):
            return jsonify({'error': 'Database not found'}), 404

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]

        structure = {}
        for table in tables:
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [row[1] for row in cursor.fetchall()]

            cursor.execute(f"SELECT * FROM {table} LIMIT 3")
            sample_rows = cursor.fetchall()

            safe_rows = []
            for row in sample_rows:
                safe_row = []
                for val in row:
                    if isinstance(val, bytes):
                        safe_row.append(f"<{len(val)} bytes>")
                    else:
                        safe_row.append(val)
                safe_rows.append(safe_row)

            structure[table] = {
                "columns": columns,
                "sample_rows": safe_rows
            }

        conn.close()
        return jsonify(structure)

    except Exception as e:
        print("❌ DB Inspect Error:", e)
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500