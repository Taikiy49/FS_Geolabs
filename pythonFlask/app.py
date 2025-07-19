# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import sqlite3
import os
import traceback
from helpers import rank_documents, ask_gemini, get_quick_view_sentences, get_system_instruction

app = Flask(__name__)
CORS(app)

DB_FILE = "chat_history.db"
GEO_DB = "geolabs.db"

# Initialize chat history DB
def init_db():
    if not os.path.exists(DB_FILE):
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute("""
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user TEXT,
            question TEXT,
            answer TEXT,
            sources TEXT,
            timestamp TEXT
        )
        """)
        conn.commit()
        conn.close()

@app.route('/api/rank_only', methods=['POST'])
def rank_only():
    try:
        data = request.get_json()
        query = data.get('query')
        min_wo = int(data.get('min', 0))
        max_wo = int(data.get('max', 99999))
        top_k = min(int(data.get('top_k', 20)), 30)

        ranked_chunks = rank_documents(query, GEO_DB, min_wo, max_wo, top_k=top_k)

        return jsonify({
            "ranked_files": [
                {"file": doc["file"], "score": round(doc["score"], 1)}
                for doc in ranked_chunks
            ]
        })

    except Exception as e:
        print("\u274C Error in /api/rank_only:", str(e))
        traceback.print_exc()
        return jsonify({"error": "Ranking failed."}), 500

@app.route('/api/question', methods=['POST'])
def answer_question():
    try:
        data = request.get_json()
        query = data.get('query')
        min_wo = int(data.get('min', 0))
        max_wo = int(data.get('max', 99999))
        top_k = min(int(data.get('top_k', 10)), 30)
        user = data.get('user', 'guest')
        selected_files = data.get('selected_files', [])

        ranked_chunks = rank_documents(query, GEO_DB, min_wo, max_wo, top_k=20)

        ranked_files = [doc['file'] for doc in ranked_chunks if doc['file'] not in selected_files]
        final_files = selected_files + ranked_files[:max(0, top_k - len(selected_files))]

        relevant_chunks = [doc for doc in ranked_chunks if doc['file'] in final_files]

        answer = ask_gemini(query, relevant_chunks)

        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO chat_history (user, question, answer, sources, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, (user, query, answer, ",".join(final_files), datetime.now().isoformat()))
        conn.commit()
        conn.close()

        return jsonify({
            "answer": answer,
            "sources": final_files,
            "ranked_files": [
                {"file": doc["file"], "score": round(doc["score"], 1)}
                for doc in ranked_chunks
            ]
        })

    except Exception as e:
        print("\u274C Backend Error:", str(e))
        traceback.print_exc()
        return jsonify({"error": "An error occurred processing your request."}), 500

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
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute("""
            SELECT question, answer, sources, timestamp
            FROM chat_history
            WHERE user = ?
            ORDER BY id DESC
        """, (user,))
        rows = cur.fetchall()
        conn.close()

        history = [{
            "question": row[0],
            "answer": row[1],
            "sources": row[2].split(","),
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