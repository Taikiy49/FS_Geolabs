import os
import json
from typing import List

def chunk_text(text: str, max_words: int = 200) -> List[str]:
    words = text.split()
    chunks = []
    for i in range(0, len(words), max_words):
        chunk = " ".join(words[i:i + max_words])
        chunks.append(chunk)
    return chunks

def chunk_reports(input_dir: str, output_file: str):
    all_chunks = []
    for filename in os.listdir(input_dir):
        if filename.endswith(".txt"):
            filepath = os.path.join(input_dir, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                text = f.read()
            chunks = chunk_text(text)
            for chunk in chunks:
                all_chunks.append({"file": filename, "chunk": chunk})

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_chunks, f, indent=2)

if __name__ == '__main__':
    input_dir = "cleaned_reports"
    output_file = "preprocessed_chunks.json"
    chunk_reports(input_dir, output_file)
