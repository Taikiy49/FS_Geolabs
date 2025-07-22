# helpers.py
import re
import sqlite3
from collections import defaultdict, Counter
import math
import heapq
import requests
import os
from dotenv import load_dotenv  # ✅ import this

load_dotenv()

MAUI_LOCATIONS = {"maui", "lahaina", "kahului", "kihei", "wailuku", "makawao", "kula", "pukalani", "upcountry"}
GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # ✅ now this will work



from difflib import SequenceMatcher

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

def rank_documents(query, db_path, min_wo, max_wo, top_k=20):
    query_tokens = preprocess_query(query)
    tf = defaultdict(Counter)
    df = Counter()

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(DISTINCT file) FROM inverted_index")
        total_docs = cursor.fetchone()[0]

        placeholders = ','.join('?' * len(query_tokens))
        cursor.execute(f"SELECT keyword, file, chunk_id, term_freq FROM inverted_index WHERE keyword IN ({placeholders})", query_tokens)
        for keyword, file, _, freq in cursor.fetchall():
            if is_in_work_order_range(file, min_wo, max_wo):
                tf[file][keyword] += freq
                df[keyword] += 1

        cursor.execute("SELECT file, chunk FROM chunks")
        chunks_by_file = defaultdict(list)
        for file, chunk in cursor.fetchall():
            chunks_by_file[file].append(chunk)

    tfidf_scores = []
    for file, counts in tf.items():
        score = sum(counts[t] * (math.log((total_docs + 1) / (df[t] + 1)) + 1) for t in query_tokens)
        chunks = chunks_by_file[file][:3]
        combined_text = "\n---\n".join(chunks)

        boost = 3 if any(loc in file.lower() for loc in MAUI_LOCATIONS) else 0
        if any(loc in combined_text.lower() for loc in MAUI_LOCATIONS):
            boost += 2

        tfidf_scores.append({
            'file': file,
            'chunk': combined_text,
            'score': round(score + boost, 3)
        })

    top_docs = heapq.nlargest(top_k, tfidf_scores, key=lambda x: x['score'])
    print("\nTop Ranked Files:")
    for doc in top_docs:
        print(f"- {doc['file']} (score: {doc['score']})")

    return top_docs

def get_quick_view_sentences(file, query, db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 🔁 Determine the correct column name
    cursor.execute("PRAGMA table_info(chunks)")
    columns = [row[1] for row in cursor.fetchall()]
    column_name = "text" if "text" in columns else "chunk"

    cursor.execute(f"SELECT {column_name} FROM chunks WHERE file = ?", (file,))
    rows = cursor.fetchall()

    if not rows:
        print(f"❌ No chunks found in DB for {file}")
        return ["This file has no readable chunks in the database."]

    full_text = " ".join(row[0] for row in rows if isinstance(row[0], str))
    print(f"🧠 Feeding entire report: {file} — approx {len(full_text.split())} words")

    return [full_text]


import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-pro")  # ✅ You now get 1.5

def ask_gemini_single_file(query, file_name, snippets, user='guest', use_cache=True):
    if not query:
        return "No query provided."
    if not snippets:
        return "No relevant content found for this file."

    cache_key = (user, file_name, query.strip().lower())

    # ✅ Step 1: Check for cached similar query
    if use_cache:
        for (cached_user, cached_file, cached_query), cached_answer in query_cache.items():
            if cached_user == user and cached_file == file_name and is_similar(query, cached_query):
                print(f"⚡ Cache hit for: '{query}' ≈ '{cached_query}'")
                return cached_answer

    # ✅ Step 2: Compose prompt and call Gemini
    prompt = f"""You are a helpful AI assistant. Please answer the user's question using the provided excerpt below.

**Requirements:**
- You do not need an introduction just go straight to the point!
- Respond in **clear, readable Markdown**.
- Use **bold headings**, bullet points, and spacing to organize content.
- Bold any key phrases like "Work Order", "Policy", "Contact", "Deadline", or section names if mentioned.
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

        # ✅ Step 3: Cache the answer
        if use_cache:
            query_cache[cache_key] = answer

        return answer

    except Exception as e:
        import traceback
        print("❌ Gemini SDK error:")
        traceback.print_exc()
        return f"Gemini SDK error: {str(e)}"
