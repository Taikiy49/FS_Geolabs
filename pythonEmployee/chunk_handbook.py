def chunk_handbook(text, max_words=250):
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks = []
    buffer = []
    count = 0

    for para in paragraphs:
        words = para.split()
        if count + len(words) > max_words:
            if buffer:
                chunks.append(" ".join(buffer))
            buffer = words
            count = len(words)
        else:
            buffer += words
            count += len(words)

    if buffer:
        chunks.append(" ".join(buffer))
    return chunks
