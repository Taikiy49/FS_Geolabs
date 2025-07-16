import re
import json
from collections import Counter
import google.generativeai as genai

# Gemini setup
genai.configure(api_key="AIzaSyDqi4HACfmjzWp_8_yg0t_Q_xqu9HL5AQA")
model = genai.GenerativeModel("models/gemini-1.5-flash")

def preprocess_query(query):
    return re.findall(r'\b\w+\b', query.lower())

def is_in_work_order_range(filename, min_wo, max_wo):
    match = re.match(r"(\d{4,5})", filename)
    if match:
        work_order = int(match.group(1))
        return min_wo <= work_order <= max_wo
    return False

def rank_documents(query, inverted_index_file, metadata_file, min_wo, max_wo, top_k):
    with open(inverted_index_file, 'r', encoding='utf-8') as f:
        inverted_index = json.load(f)
    with open(metadata_file, 'r', encoding='utf-8') as f:
        metadata = json.load(f)

    query_tokens = preprocess_query(query)
    file_scores = Counter()

    for token in query_tokens:
        if token in inverted_index:
            for file_name in inverted_index[token]:
                if is_in_work_order_range(file_name, min_wo, max_wo):
                    file_scores[file_name] += 1

    top_files = file_scores.most_common(min(top_k, 30))
    results = []

    for file_name, score in top_files:
        matching_chunks = [entry['chunk'] for entry in metadata if entry['file'] == file_name]
        combined_text = "\n---\n".join(matching_chunks[:3])
        results.append({
            'file': file_name,
            'chunk': combined_text,
            'score': score
        })

    return results

def ask_gemini(query, ranked_chunks):
    sources = ""
    for i, doc in enumerate(ranked_chunks, 1):
        sources += f"[{i}] File: {doc['file']}\n{doc['chunk']}\n\n"

    prompt = f"""
You are a geotechnical engineer. Use the report excerpts below to answer the user's question.
Only use the provided content and cite which file(s) the information came from using the file names.

Question: {query}

Report Excerpts:
{sources}

Answer (with citations):
"""
    response = model.generate_content(prompt)
    return response.text
