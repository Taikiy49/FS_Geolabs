from flask import Blueprint, request, jsonify
import os
import re
import sqlite3
import tempfile
import traceback
from tqdm import tqdm
from collections import defaultdict
from transformers import AutoTokenizer, AutoModel
import torch


import fitz  # PyMuPDF
import nltk
from nltk.tokenize import sent_tokenize
from PIL import Image
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r"C:\Users\tyamashita\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"

import io

admin_bp = Blueprint('admin', __name__)

# Ensure upload history table exists
def ensure_upload_history_table():
    try:
        with sqlite3.connect("chat_history.db") as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS upload_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user TEXT,
                    file TEXT,
                    db_name TEXT,
                    timestamp TEXT
                )
            """)
    except Exception as e:
        print("⚠️ Could not initialize upload_history table:", e)

ensure_upload_history_table()

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

MODEL_NAME = "BAAI/bge-base-en-v1.5"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
embedding_model = AutoModel.from_pretrained(MODEL_NAME)


CHUNK_SIZE = 800
OVERLAP = 200
nltk.download('punkt')

def compute_embeddings(text_chunks):
    inputs = tokenizer(text_chunks, padding=True, truncation=True, return_tensors="pt")
    with torch.no_grad():
        outputs = embedding_model(**inputs)

    # Mean Pooling
    embeddings = outputs.last_hidden_state.mean(dim=1)
    return embeddings.numpy()


def extract_text_from_pdf_with_ocr_fallback(pdf_path):
    doc = fitz.open(pdf_path)
    full_text = []

    for i, page in enumerate(doc):
        page_text = page.get_text().strip()
        if page_text:
            print(f"✅ Page {i+1}: Found native text")
            full_text.append(page_text)
        else:
            print(f"🔍 Page {i+1}: No text found, running OCR...")
            try:
                pix = page.get_pixmap(dpi=300)
                img_data = pix.tobytes("ppm")
                img = Image.open(io.BytesIO(img_data))
                ocr_text = pytesseract.image_to_string(img).strip()
                if ocr_text:
                    print(f"✅ Page {i+1}: OCR extracted {len(ocr_text.split())} words")
                else:
                    print(f"⚠️ Page {i+1}: OCR failed or empty")
                full_text.append(ocr_text)
            except Exception as e:
                print(f"❌ OCR error on page {i+1}: {e}")

    doc.close()
    return "\n\n".join([t for t in full_text if t.strip()])


def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=OVERLAP):
    sentences = sent_tokenize(text)
    chunks = []
    current_chunk = []

    for sentence in sentences:
        current_chunk.append(sentence)
        total_words = sum(len(s.split()) for s in current_chunk)

        if total_words >= chunk_size:
            chunks.append(' '.join(current_chunk))
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


def embed_to_db(input_pdf_path, db_path, track=print):
    file_name = os.path.basename(input_pdf_path)
    track(f"📄 Loading PDF: {file_name}")

    try:
        track("🔍 Extracting text...")
        text = extract_text_from_pdf_with_ocr_fallback(input_pdf_path)
        if not text.strip():
            track(f"⚠️ No extractable text in: {file_name}")
            return
    except Exception as e:
        track(f"❌ Error reading PDF: {e}")
        return

    track("✂️ Chunking text...")
    chunks = chunk_text(text)
    track(f"✅ Created {len(chunks)} chunks")

    if not chunks:
        track(f"⚠️ No chunks extracted from: {file_name}")
        return

    track("🧠 Embedding chunks...")
    try:
        embeddings = compute_embeddings(chunks)


    except Exception as e:
        track(f"❌ Embedding failed: {e}")
        return

    track("💾 Writing to database...")
    try:
        conn = sqlite3.connect(db_path)
        create_chunks_table(conn)
        insert_chunks_with_embeddings(conn, file_name, chunks, embeddings)
        conn.close()
    except Exception as e:
        track(f"❌ Database write failed: {e}")
        return

    track(f"🎉 Done! Indexed {len(chunks)} chunks into '{db_path}'")


def embed_to_general_db(input_pdf_path, db_path):
    print(f"📄 Loading PDF (general): {os.path.basename(input_pdf_path)}")
    text = extract_text_from_pdf_with_ocr_fallback(input_pdf_path)

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
    embeddings = compute_embeddings(chunks)



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

        steps = []

        def track(msg):
            print(msg)
            steps.append(msg)

        if mode == 'general':
            embed_to_general_db(tmp_path, db_path, track)
        else:
            embed_to_db(tmp_path, db_path, track)

        # ✅ Log upload to chat_history.db
        try:
            with sqlite3.connect("chat_history.db") as conn:
                conn.execute("""
                    INSERT INTO upload_history (user, file, db_name, timestamp)
                    VALUES (?, ?, ?, datetime('now', '-10 hours'))
                """, (
                    request.form.get("user", "guest"),
                    file.filename,
                    db_name
                ))
        except Exception as e:
            print("⚠️ Failed to log upload:", e)


        os.remove(tmp_path)
        return jsonify({'message': f"✅ File indexed into {db_name}!", 'steps': steps})
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
        # ✅ Log deletion
        try:
            with sqlite3.connect("chat_history.db") as conn:
                conn.execute("""
                    INSERT INTO upload_history (user, file, db_name, timestamp)
                    VALUES (?, ?, ?, datetime('now', '-10 hours'))
                """, (
                    "admin",
                    "[DELETED]",
                    db_name
                ))
        except Exception as e:
            print("⚠️ Failed to log deletion:", e)

        return jsonify({'message': f"✅ {db_name} successfully deleted."})

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/api/list-files', methods=['POST'])
def list_files_in_db():
    try:
        data = request.get_json()
        db_name = data.get("db_name")
        db_path = os.path.join(UPLOAD_FOLDER, db_name)

        if not db_name or not os.path.exists(db_path):
            return jsonify({"error": "Database not found"}), 404

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # You can switch to 'inverted_index' if using that table instead
        cursor.execute("SELECT DISTINCT file FROM chunks")
        files = [row[0] for row in cursor.fetchall()]
        conn.close()

        return jsonify({"files": files})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Failed to list files: {str(e)}"}), 500


@admin_bp.route('/api/upload-history', methods=['GET'])
def get_upload_history():
    try:
        conn = sqlite3.connect("chat_history.db")
        cursor = conn.cursor()
        cursor.execute("""
            SELECT user, file, db_name, timestamp
            FROM upload_history
            ORDER BY timestamp DESC
            LIMIT 50
        """)
        rows = cursor.fetchall()
        conn.close()

        history = [
            {
                "user": row[0],
                "file": row[1],
                "db": row[2],
                "time": row[3]
            }
            for row in rows
        ]

        return jsonify(history)

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Failed to retrieve upload history: {str(e)}"}), 500
