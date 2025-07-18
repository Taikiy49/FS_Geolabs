import re
import sqlite3
from collections import Counter
import google.generativeai as genai
import os

# Gemini setup (use environment variable for security)
genai.configure(api_key="AIzaSyDqi4HACfmjzWp_8_yg0t_Q_xqu9HL5AQA")
model = genai.GenerativeModel("models/gemini-1.5-flash")

MAUI_LOCATIONS = {"maui", "lahaina", "kahului", "kihei", "wailuku", "makawao", "kula", "pukalani", "upcountry"}

def preprocess_query(query):
    return re.findall(r'\b\w+\b', query.lower())

def is_in_work_order_range(filename, min_wo, max_wo):
    match = re.match(r"(\d{4,5})", filename)
    if match:
        work_order = int(match.group(1))
        return min_wo <= work_order <= max_wo
    return False

def rank_documents(query, db_path, min_wo, max_wo, top_k):
    query_tokens = preprocess_query(query)
    file_scores = Counter()

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()

        for token in query_tokens:
            cursor.execute("SELECT DISTINCT file FROM inverted_index WHERE keyword = ?", (token,))
            for (file_name,) in cursor.fetchall():
                if is_in_work_order_range(file_name, min_wo, max_wo):
                    file_scores[file_name] += 1

        results = []
        for file_name, score in file_scores.items():
            lower_name = file_name.lower()
            if any(loc in lower_name for loc in MAUI_LOCATIONS):
                score += 3

            cursor.execute("SELECT chunk FROM chunks WHERE file = ? LIMIT 5", (file_name,))
            chunks = [row[0] for row in cursor.fetchall()]
            combined_text = "\n---\n".join(chunks)

            content_lower = combined_text.lower()
            if any(loc in content_lower for loc in MAUI_LOCATIONS):
                score += 2

            results.append({
                'file': file_name,
                'chunk': combined_text,
                'score': score
            })

        results.sort(key=lambda x: x['score'], reverse=True)
        max_score = results[0]['score'] if results else 1

        for r in results:
            r['score'] = int((r['score'] / max_score) * 100)

        return results[:top_k]

def ask_gemini(query, ranked_chunks):
    sources = ""
    for i, doc in enumerate(ranked_chunks, 1):
        sources += f"[{i}] File: {doc['file']}\n{doc['chunk']}\n\n"

    prompt = f"""
You are a geotechnical engineer. Answer the user's question using only the excerpts below.

Instructions:
- Be specific, factual, and technical.
- Use only information provided below.
- Always cite the file(s) the answer comes from.
- If the answer is not found, say \"The provided reports do not contain this information.\"

Question: {query}

Report Excerpts:
{sources}

Final Answer (with citations):
"""

    response = model.generate_content(prompt, generation_config={
        "temperature": 0.2,
        "max_output_tokens": 1024
    })
    return response.text
