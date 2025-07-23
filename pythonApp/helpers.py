# helpers.py
import re
import sqlite3
from collections import defaultdict, Counter
import math
import heapq
import requests
import os
from dotenv import load_dotenv

from difflib import SequenceMatcher
import google.generativeai as genai

load_dotenv()

MAUI_LOCATIONS = {"maui", "lahaina", "kahului", "kihei", "wailuku", "makawao", "kula", "pukalani", "upcountry"}
GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

query_cache = {}  # key: (user, file, query), value: answer

def is_similar(q1, q2, threshold=0.92):
    return SequenceMatcher(None, q1.lower(), q2.lower()).ratio() >= threshold

def preprocess_query(query):
    return re.findall(r'\b\w+\b', query.lower())

def is_in_work_order_range(filename, min_wo, max_wo):
    match = re.match(r"(\d{4,5})", filename)
    if match:
        work_order = int(match.group(1))
        return min_wo <= work_order <= max_wo
    return True

def rank_documents(query, db_path, min_wo=0, max_wo=99999, top_k=20):
    query_tokens = preprocess_query(query)

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = {row[0] for row in cursor.fetchall()}

        if "inverted_index" in tables:
            index_table = "inverted_index"
            chunk_table = "chunks"
        elif "handbook_chunks" in tables:
            index_table = chunk_table = "handbook_chunks"
        elif "chunks" in tables:
            index_table = chunk_table = "chunks"
        else:
            raise Exception("❌ No valid table found for ranking.")

        cursor.execute(f"PRAGMA table_info({chunk_table})")
        columns = {col[1] for col in cursor.fetchall()}

        file_col = 'file' if 'file' in columns else None
        chunk_col = 'chunk' if 'chunk' in columns else 'text'

        cursor.execute(f"SELECT {chunk_col} FROM {chunk_table}")
        rows = cursor.fetchall()
        all_chunks = [row[0] for row in rows if isinstance(row[0], str)]

        if index_table != "inverted_index":
            return [
                {
                    'file': f"Document {i+1}",
                    'chunk': chunk,
                    'score': 0.0
                }
                for i, chunk in enumerate(all_chunks[:top_k])
            ]

        # Add TF-IDF logic here only if inverted_index is present (you probably don't need it for handbook)


def get_quick_view_sentences(file, query, db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    if "handbook" in db_path:
        table = "handbook_chunks"
        col = "chunk"
    else:
        table = "chunks"
        col = "text"

    cursor.execute(f"SELECT {col} FROM {table}")
    rows = cursor.fetchall()

    full_text = " ".join(row[0] for row in rows if isinstance(row[0], str))
    print(f"🤖 Loaded {len(full_text.split())} words from {table}")

    return [full_text]


# Gemini model config
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-pro")

def ask_gemini_single_file(query, file_name, snippets, user='guest', use_cache=True):
    if not query:
        return "No query provided."
    if not snippets:
        return "No relevant content found for this file."

    cache_key = (user, file_name, query.strip().lower())

    if use_cache:
        for (cached_user, cached_file, cached_query), cached_answer in query_cache.items():
            if cached_user == user and cached_file == file_name and is_similar(query, cached_query):
                print(f"⚡ Cache hit for: '{query}' ≈ '{cached_query}'")
                return cached_answer

    prompt = f"""You are a helpful AI assistant. Please answer the user's question using the provided excerpt below.

**Requirements:**
- You do not need an introduction just go straight to the point!
- Respond in **clear, readable Markdown**.
- Use **bold headings**, bullet points, and spacing to organize content.
- Bold any key phrases like \"Work Order\", \"Policy\", \"Contact\", \"Deadline\", or section names if mentioned.
- Keep paragraphs short and avoid large walls of text.

---

**Question:**
{query}

**Excerpt from {file_name}:**
{chr(10).join(snippets)}

---

**Answer (in well-formatted Markdown):**
"""
    try:
        print("🧠 Gemini Prompt Preview:\n", prompt[:300])
        response = model.generate_content(prompt)
        answer = response.text.strip()

        if use_cache:
            query_cache[cache_key] = answer

        return answer

    except Exception as e:
        import traceback
        print("❌ Gemini SDK error:")
        traceback.print_exc()
        return f"Gemini SDK error: {str(e)}"
