from flask import Blueprint, request, jsonify
import os
import re
import sqlite3
import tempfile
import fitz  # PyMuPDF
from tqdm import tqdm
from collections import defaultdict
from sentence_transformers import SentenceTransformer
import traceback

admin_bp = Blueprint('admin', __name__)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

MODEL_NAME = "BAAI/bge-base-en-v1.5"
CHUNK_SIZE = 800
OVERLAP = 200

model = SentenceTransformer(MODEL_NAME)

def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text()
    doc.close()
    return full_text.strip()

import nltk
nltk.download('punkt')  # This is the sentence tokenizer

from nltk.tokenize import sent_tokenize

def chunk_text(text, chunk_size=800, overlap=200):
    sentences = sent_tokenize(text)
    chunks = []
    current_chunk = []

    for sentence in sentences:
        current_chunk.append(sentence)
        total_words = sum(len(s.split()) for s in current_chunk)

        if total_words >= chunk_size:
            chunks.append(' '.join(current_chunk))
            # Overlap using last few sentences to approximate overlap
            overlap_words = 0
            new_chunk = []
            for s in reversed(current_chunk):
                overlap_words += len(s.split())
                new_chunk.insert(0, s)
                if overlap_words >= overlap:
                    break
            current_chunk = new_chunk

    if current_chunk:
        chunks.append(' '.join(current_chunk))

    return chunks


def create_chunks_table(conn):
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS chunks (
            file TEXT,
            chunk INTEGER,
            text TEXT,
            embedding BLOB
        )
    """)
    conn.commit()

def create_general_chunks_table(conn):
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS general_chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chunk TEXT,
            embedding BLOB
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

def insert_general_chunks(conn, chunks, embeddings):
    c = conn.cursor()
    for chunk, emb in zip(chunks, embeddings):
        c.execute(
            "INSERT INTO general_chunks (chunk, embedding) VALUES (?, ?)",
            (chunk, emb.tobytes())
        )
    conn.commit()

def embed_to_db(input_pdf_path, db_path):
    file_name = os.path.basename(input_pdf_path)
    print(f"\n📄 Loading PDF: {file_name}")

    try:
        text = extract_text_from_pdf(input_pdf_path)
        if not text.strip():
            print(f"⚠️ No extractable text in: {file_name}")
            return
    except Exception as e:
        print(f"❌ Error reading PDF: {e}")
        return

    print("✂️ Chunking text...")
    chunks = chunk_text(text)
    print(f"✅ Created {len(chunks)} chunks")
    if not chunks:
        print(f"⚠️ No chunks extracted from: {file_name}")
        return

    print("🧠 Embedding chunks...")
    try:
        embeddings = model.encode(chunks, convert_to_tensor=False, show_progress_bar=True)
    except Exception as e:
        print(f"❌ Embedding failed: {e}")
        return

    print("💾 Writing to database...")
    try:
        conn = sqlite3.connect(db_path)
        create_chunks_table(conn)
        insert_chunks_with_embeddings(conn, file_name, chunks, embeddings)
        conn.close()
    except Exception as e:
        print(f"❌ Database write failed: {e}")
        return

    print(f"🎉 Done! Indexed {len(chunks)} chunks into '{db_path}'")

def embed_to_general_db(input_pdf_path, db_path):
    print(f"📄 Loading PDF (general): {os.path.basename(input_pdf_path)}")
    text = extract_text_from_pdf(input_pdf_path)

    if not text:
        print("⚠️ Skipped empty or unreadable PDF.")
        return

    print("✂️ Chunking text...")
    chunks = chunk_text(text)
    print(f"✅ Created {len(chunks)} chunks")

    if not chunks:
        print("⚠️ No chunks extracted.")
        return

    print("🔢 Embedding...")
    embeddings = model.encode(chunks, convert_to_tensor=False, show_progress_bar=True)

    print("💾 Writing to general_chunks table...")
    conn = sqlite3.connect(db_path)
    create_general_chunks_table(conn)
    insert_general_chunks(conn, chunks, embeddings)
    conn.close()

    print(f"🎉 Done! Indexed {len(chunks)} general chunks into '{db_path}'")

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

        db_path = os.path.join(UPLOAD_FOLDER, db_name)
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        if mode == 'general':
            embed_to_general_db(tmp_path, db_path)
        else:
            embed_to_db(tmp_path, db_path)

        os.remove(tmp_path)
        return jsonify({'message': f"✅ File indexed into {db_name}!"})

    except Exception as e:
        traceback.print_exc()
        print("❌ Error indexing file:", e)
        return jsonify({'message': '❌ Failed to process file.'}), 500

@admin_bp.route('/api/list-dbs', methods=['GET'])
def list_dbs():
    try:
        dbs = [f for f in os.listdir(UPLOAD_FOLDER) if f.endswith('.db')]
        return jsonify({'dbs': dbs})
    except Exception as e:
        return jsonify({'dbs': [], 'error': str(e)}), 500

@admin_bp.route('/api/inspect-db', methods=['POST'])
def inspect_db():
    try:
        data = request.get_json()
        db_name = data.get('db_name')
        db_path = os.path.join(UPLOAD_FOLDER, db_name)

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
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/api/delete-db', methods=['POST'])
def delete_db():
    try:
        data = request.get_json()
        db_name = data.get('db_name')
        confirmation_text = data.get('confirmation_text', '')
        expected_confirmation = f"DELETE {db_name}"

        if confirmation_text.strip() != expected_confirmation:
            return jsonify({'error': 'Confirmation text does not match. Deletion aborted.'}), 400

        db_path = os.path.join(UPLOAD_FOLDER, db_name)
        if not os.path.exists(db_path):
            return jsonify({'error': 'Database not found'}), 404

        os.remove(db_path)
        return jsonify({'message': f"✅ {db_name} successfully deleted."})

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
