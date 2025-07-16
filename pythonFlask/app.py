from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime
from helpers import rank_documents, ask_gemini

app = Flask(__name__)
CORS(app)

CHAT_HISTORY_FILE = "chat_history.json"

@app.route('/api/files', methods=['GET'])
def list_files():
    try:
        with open("preprocessed_chunks.json", "r", encoding="utf-8") as f:
            metadata = json.load(f)
        unique_files = sorted(set(entry['file'] for entry in metadata))
        return jsonify(unique_files)
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/question', methods=['POST'])
def answer_question():
    try:
        data = request.get_json()
        query = data.get('query')
        min_wo = int(data.get('min', 0))
        max_wo = int(data.get('max', 99999))
        top_k = min(int(data.get('top_k', 10)), 30)
        user = data.get('user', 'guest')

        ranked_chunks = rank_documents(
            query,
            inverted_index_file='inverted_index.json',
            metadata_file='preprocessed_chunks.json',
            min_wo=min_wo,
            max_wo=max_wo,
            top_k=top_k
        )

        top_files = [doc['file'] for doc in ranked_chunks]
        answer = ask_gemini(query, ranked_chunks)

        # Save to chat history
        new_entry = {
            "timestamp": datetime.now().isoformat(),
            "question": query,
            "answer": answer,
            "sources": top_files
        }

        try:
            with open(CHAT_HISTORY_FILE, "r", encoding="utf-8") as f:
                history = json.load(f)
        except FileNotFoundError:
            history = {}

        if user not in history:
            history[user] = []

        history[user].append(new_entry)

        with open(CHAT_HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2)

        return jsonify({
            "answer": answer,
            "sources": top_files
        })

    except Exception as e:
        print("❌ Backend Error:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat_history', methods=['GET'])
def get_chat_history():
    user = request.args.get("user", "guest")
    try:
        with open(CHAT_HISTORY_FILE, "r", encoding="utf-8") as f:
            history = json.load(f)
        return jsonify(history.get(user, []))
    except FileNotFoundError:
        return jsonify([])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

"""
http://13.56.211.75:5000
"""