# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import sqlite3
import os
import traceback
from helpers import rank_documents, ask_gemini_single_file, get_quick_view_sentences

app = Flask(__name__)
CORS(app)

DB_FILE = "chat_history.db"
GEO_DB = "geolabs.db"

# Initialize chat history DB
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
                timestamp TEXT
            )
            """)

@app.route('/api/rank_only', methods=['POST'])
def rank_only():
    try:
        data = request.get_json()
        query = data.get('query')
        min_wo = int(data.get('min', 0))
        max_wo = int(data.get('max', 99999))

        ranked = rank_documents(query, GEO_DB, min_wo, max_wo, top_k=30)
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


@app.route('/api/question', methods=['POST'])
def answer_question():
    try:
        data = request.get_json()
        query = data.get('query')
        min_wo = int(data.get('min', 0))
        max_wo = int(data.get('max', 99999))
        user = data.get('user', 'guest')

        ranked_chunks = rank_documents(query, GEO_DB, min_wo, max_wo, top_k=30)

        return jsonify({
            "ranked_files": [
                {"file": doc["file"], "score": round(doc["score"], 1)}
                for doc in ranked_chunks
            ]
        })

    except Exception as e:
        print("\u274C Backend Error:", str(e))
        traceback.print_exc()
        return jsonify({"error": "An error occurred processing your request."}), 500

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

@app.route('/api/handbook_chat_history', methods=['GET'])
def get_handbook_chat_history():
    user = request.args.get("user", "guest")
    try:
        with sqlite3.connect(DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT question, answer, sources, timestamp
                FROM chat_history
                WHERE user = ?
                AND sources = 'EmployeeHandbook.txt'
                ORDER BY id DESC
            """, (user,))
            rows = cursor.fetchall()

        history = []
        for row in rows:
            history.append({"role": "user", "text": row[0]})
            history.append({"role": "assistant", "text": row[1]})

        return jsonify(history)
    except Exception as e:
        print("❌ Error in handbook chat history:", e)
        return jsonify([])


HANDBOOK_DB = "employee_handbook.db"

@app.route('/api/handbook_question', methods=['POST'])
def handbook_question():
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        if not query:
            return jsonify({"error": "Empty question."}), 400

        user = data.get('user', 'guest')
        handbook_file = 'EmployeeHandbook.txt'

        # ✅ Check if we already have this exact question cached
        with sqlite3.connect(DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT answer FROM chat_history
                WHERE user = ? AND sources = ? AND LOWER(question) = LOWER(?)
                ORDER BY id DESC LIMIT 1
            """, (user, handbook_file, query))
            cached = cursor.fetchone()
            if cached:
                print("⚡ Returning cached answer")
                return jsonify({"answer": cached[0]})

        # ❌ If no cached answer, call Gemini
        snippets = get_quick_view_sentences(handbook_file, query, HANDBOOK_DB)
        answer = ask_gemini_single_file(query, handbook_file, snippets)

        # ✅ Save the new answer to DB
        with sqlite3.connect(DB_FILE) as conn:
            conn.execute("""
                INSERT INTO chat_history (user, question, answer, sources, timestamp)
                VALUES (?, ?, ?, ?, ?)
            """, (user, query, answer, handbook_file, datetime.now().isoformat()))

        return jsonify({"answer": answer})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to process handbook question: {str(e)}"}), 500


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
    user = request.args.get("user", "guest")
    try:
        with sqlite3.connect(DB_FILE) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT question, answer, sources, timestamp
                FROM chat_history
                WHERE user = ?
                ORDER BY id DESC
            """, (user,))
            rows = cursor.fetchall()

        history = [{
            "query": row[0],
            "answer": row[1],
            "sources": row[2].split(",") if row[2] else [],

            "timestamp": row[3]
        } for row in rows]

        return jsonify(history)
    except Exception as e:
        print("\u274C History Fetch Error:", str(e))
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

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000)
