# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import sqlite3
from ocr import extract_work_orders_from_image
import os
import traceback
from helpers import rank_documents, ask_gemini_single_file, get_quick_view_sentences
from admin import admin_bp
import boto3

app = Flask(__name__)
app.register_blueprint(admin_bp)
CORS(app)

DB_FILE = "chat_history.db"
GEO_DB = "reports.db"

def init_db():
    if not os.path.exists(DB_FILE):
        with sqlite3.connect(DB_FILE) as conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS chat_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user TEXT,
                question TEXT,
                answer TEXT,
                sources TEXT,
                timestamp TEXT,
                db_name TEXT
            )
            """)
    
    # ✅ Add this even if DB file already exists
    with sqlite3.connect(DB_FILE) as conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS upload_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user TEXT,
            file TEXT,
            db_name TEXT,
            timestamp TEXT
        )
        """)




@app.route('/api/rank_only', methods=['POST'])
def rank_only():
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        min_wo = int(data.get('min', 0))
        max_wo = int(data.get('max', 99999))
        user = data.get('user', 'guest')

        if not query:
            return jsonify({"error": "Empty keyword."}), 400

        ranked = rank_documents(query, GEO_DB, min_wo, max_wo, top_k=30)

        # ✅ Check if an identical ranking query was already cached
        with sqlite3.connect(DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 1 FROM chat_history
                WHERE user = ? AND LOWER(question) = LOWER(?) AND answer = '[Ranking Only - No answer]'
                ORDER BY id DESC LIMIT 1
            """, (user, query))
            already_cached = cursor.fetchone()

            if not already_cached:
                conn.execute("""
                    INSERT INTO chat_history (user, question, answer, sources, timestamp, db_name)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    user,
                    query,
                    "[Ranking Only - No answer]",
                    ",".join(doc["file"] for doc in ranked),
                    datetime.now().isoformat(),
                    "reports.db"  # or pass the actual db name if variable
                ))

        return jsonify({
            "ranked_files": [
                {"file": doc["file"], "score": round(doc["score"], 1)}
                for doc in ranked
            ]
        })

    except Exception as e:
        print("❌ /api/rank_only error:", str(e))
        traceback.print_exc()
        return jsonify({"error": "Failed to rank documents."}), 500

@app.route('/api/single_file_answer', methods=['POST'])
def answer_from_single_file():
    try:
        data = request.get_json()
        print("🔍 Incoming /api/single_file_answer payload:", data)

        query = data.get("query")
        
        file = data.get("file")
        user = data.get("user", "guest")

        if not query or not file:
            print("❌ Missing query or file:", query, file)
            return jsonify({"error": "Missing query or file."}), 400

        snippets = get_quick_view_sentences(file, query, GEO_DB)
        answer = ask_gemini_single_file(query, file, snippets)

        with sqlite3.connect(DB_FILE) as conn:
            conn.execute("""
                INSERT INTO chat_history (user, question, answer, sources, timestamp)
                VALUES (?, ?, ?, ?, ?)
            """, (user, query, answer, file, datetime.now().isoformat()))


        return jsonify({"answer": answer})  # ✅ Make sure this return always happens

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to answer from selected file. {str(e)}"}), 500

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to answer from selected file. {str(e)}"}), 500

@app.route('/api/db_chat_history', methods=['GET'])
def get_db_chat_history():
    user = request.args.get("user", "guest")

    try:
        with sqlite3.connect(DB_FILE) as conn:  # Always use global DB_FILE
            cursor = conn.cursor()
            cursor.execute("""
                SELECT question, answer, sources, timestamp
                FROM chat_history
                WHERE user = ?
                ORDER BY id DESC
            """, (user,))
            rows = cursor.fetchall()

        history = []
        for row in rows:
            history.append({"role": "user", "text": row[0]})
            history.append({"role": "assistant", "text": row[1]})

        return jsonify(history)
    except Exception as e:
        print("❌ Error reading chat history from global DB:", e)
        return jsonify([])

HANDBOOK_DB = "employee_handbook.db"

@app.route('/api/question', methods=['POST'])
def handle_question():
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        db_name = data.get('db', '').strip()
        user = data.get('user', 'guest')
        use_cache = data.get('use_cache', True)
        min_wo = int(data.get('min', 0))
        max_wo = int(data.get('max', 99999))

        if not query or not db_name:
            return jsonify({"error": "Missing query or database name."}), 400

        if db_name in ['chat_history.db', 'reports.db']:
            return jsonify({"error": "Restricted database."}), 403

        db_path = os.path.join("uploads", db_name)
        if not os.path.exists(db_path):
            return jsonify({"error": f"Database {db_name} not found."}), 404

        # Load and rank chunks
        # Skip ranking if it's the handbook database
        if "handbook" in db_path:
            ranked_chunks = rank_documents(query, db_path, top_k=30)
        else:
            ranked_chunks = rank_documents(query, db_path, min_wo, max_wo, top_k=30)

        if not ranked_chunks:
            return jsonify({'answer': 'No relevant documents found.'})

        file = ranked_chunks[0]['file']
        snippets = get_quick_view_sentences(file, query, db_path)

        # Use cache if possible
        if use_cache:
            with sqlite3.connect(DB_FILE) as conn:
                cursor = conn.cursor()
                cursor.execute("""SELECT answer FROM chat_history
                                  WHERE user = ? AND sources = ? AND LOWER(question) = LOWER(?)
                                  ORDER BY id DESC LIMIT 1""", (user, file, query))
                cached = cursor.fetchone()
                if cached:
                    print("⚡ Returning cached answer")
                    return jsonify({"answer": cached[0]})

        # Generate new answer
        answer = ask_gemini_single_file(query, file, snippets, user=user, use_cache=False)

        with sqlite3.connect(DB_FILE) as conn:
            conn.execute("""
                INSERT INTO chat_history (user, question, answer, sources, timestamp, db_name)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (user, query, answer, file, datetime.now().isoformat(), db_name))  # or pass db explicitly



        return jsonify({'answer': answer})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Failed to answer question: {str(e)}"}), 500

@app.route('/api/files', methods=['GET'])
def list_files():
    try:
        with sqlite3.connect(GEO_DB) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT DISTINCT file FROM chunks")
            files = sorted(set(row[0] for row in cursor.fetchall()))
        return jsonify(files)
    except Exception as e:
        print("\u274C Error in /api/files:", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/chat_history', methods=['GET'])
def get_chat_history():
    user = request.args.get('user', 'guest')
    db = request.args.get('db', '')

    try:
        with sqlite3.connect("chat_history.db") as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT question, answer FROM chat_history
                WHERE user = ? AND db_name = ?
                ORDER BY timestamp DESC
                LIMIT 30
            """, (user, db))
            rows = cursor.fetchall()
            history = [{"question": row[0], "answer": row[1]} for row in rows]
            return jsonify(history)
    except Exception as e:
        print("Error loading chat history:", e)
        return jsonify([])


@app.route('/api/quick_view', methods=['POST'])
def quick_view():
    data = request.get_json()
    filename = data.get('filename')
    query = data.get('query', '')
    if not filename:
        return jsonify({"error": "Filename required."}), 400
    try:
        snippets = get_quick_view_sentences(filename, query, GEO_DB)
        return jsonify({"snippets": snippets})
    except Exception as e:
        print("\u274C Quick view error:", str(e))
        return jsonify({"error": "Unable to generate quick view."}), 500
    
from ocr import extract_work_orders_from_image

@app.route('/api/ocr-upload', methods=['POST'])
def ocr_work_orders():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image uploaded."}), 400

        image_file = request.files['image']
        extracted_text = extract_work_orders_from_image(image_file)
        return jsonify({
            "recognized_work_orders": extracted_text
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Gemini image processing failed: {str(e)}"}), 500


@app.route('/api/s3-files')
def list_s3_files():
    try:
        s3 = boto3.client('s3')
        BUCKET_NAME = 'geolabs-reports'
        response = s3.list_objects_v2(Bucket=BUCKET_NAME)

        files = []
        for obj in response.get('Contents', []):
            key = obj['Key']
            # ✅ generate temporary signed URL for downloading
            url = s3.generate_presigned_url(
                'get_object',
                Params={'Bucket': BUCKET_NAME, 'Key': key},
                ExpiresIn=3600  # valid for 1 hour
            )
            files.append({
                'Key': key,
                'url': url
            })

        return jsonify({'files': files})
    except Exception as e:
        print('❌ S3 List Error:', e)
        return jsonify({'error': str(e)}), 500


init_db()
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)


