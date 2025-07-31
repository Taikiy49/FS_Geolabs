import json
import re
from collections import Counter
import google.generativeai as genai

# ================================
# CONFIGURE GEMINI API
# ================================
genai.configure(api_key="AIzaSyDqi4HACfmjzWp_8_yg0t_Q_xqu9HL5AQA")
model = genai.GenerativeModel("models/gemini-1.5-flash")

# ================================
# TEXT PREPROCESSING
# ================================
def preprocess_text(text: str):
    return re.findall(r'\b\w+\b', text.lower())

def preprocess_query(query: str):
    return preprocess_text(query)

# ================================
# RANK DOCUMENTS BY INVERTED INDEX
# ================================
def query_inverted_index(query, inverted_index_file, metadata_file, top_k=5):
    with open(inverted_index_file, 'r', encoding='utf-8') as f:
        inverted_index = json.load(f)
    with open(metadata_file, 'r', encoding='utf-8') as f:
        metadata = json.load(f)

    query_tokens = preprocess_query(query)
    file_scores = Counter()

    for token in query_tokens:
        if token in inverted_index:
            for file_name in inverted_index[token]:
                file_scores[file_name] += 1

    top_files = file_scores.most_common(top_k)

    results = []
    for file_name, score in top_files:
        matching_chunks = [entry['chunk'] for entry in metadata if entry['file'] == file_name]
        combined_text = "\n---\n".join(matching_chunks[:3])  # Limit to 3 chunks per file
        results.append({
            'file': file_name,
            'chunk': combined_text,
            'score': score
        })

    return results

# ================================
# ASK GEMINI FOR AI ANSWER
# ================================
def ask_gemini(query, context):
    prompt = f"""
You are a geotechnical engineer. Use only the report excerpts below to answer the question.

Question:
{query}

Report Excerpts:
{context}

Only use the provided context. Be concise and specific in your answer.
"""
    response = model.generate_content(prompt)
    return response.text

# ================================
# MAIN FUNCTION
# ================================
if __name__ == "__main__":
    # Ask the user for a custom query
    query = input("Enter your question: ").strip()

    inverted_index_file = "inverted_index.json"
    metadata_file = "preprocessed_chunks.json"

    print("\n🔍 Ranking top documents...")
    top_results = query_inverted_index(query, inverted_index_file, metadata_file, top_k=5)

    print("\n📚 Top Ranked Files:")
    for i, result in enumerate(top_results, 1):
        print(f"{i}. File: {result['file']} (Score: {result['score']})")

    combined_chunks = "\n\n---\n\n".join([r['chunk'] for r in top_results])

    print("\n🤖 Generating AI Answer...\n")
    ai_answer = ask_gemini(query, combined_chunks)
    print(ai_answer)
