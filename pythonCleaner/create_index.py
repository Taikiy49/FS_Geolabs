# create_index.py

import json
import os
from collections import defaultdict
import re

def tokenize(text):
    # Convert to lowercase and split by words, removing punctuation
    return re.findall(r'\b\w+\b', text.lower())

def build_inverted_index(chunk_file):
    with open(chunk_file, 'r', encoding='utf-8') as f:
        chunks = json.load(f)  # Ensure it's a JSON array

    inverted_index = defaultdict(set)

    for idx, entry in enumerate(chunks):
        file_name = entry['file']
        chunk_text = entry['chunk']
        tokens = tokenize(chunk_text)
        
        for token in tokens:
            inverted_index[token].add(file_name)  # Add filename, not chunk index

    # Convert sets to lists for JSON serialization
    inverted_index = {word: list(files) for word, files in inverted_index.items()}

    # Save the inverted index
    with open('inverted_index.json', 'w', encoding='utf-8') as f:
        json.dump(inverted_index, f, indent=2)

    print(f"Inverted index saved with {len(inverted_index)} unique words.")

if __name__ == "__main__":
    chunk_file = 'preprocessed_chunks.json'  # Make sure this is the single JSON array
    build_inverted_index(chunk_file)
