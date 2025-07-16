import os
import re

RAW_DIR = "raw_reports"
CLEAN_DIR = "cleaned_reports"

def extract_work_order_and_title(filename):
    name = os.path.splitext(filename)[0]
    match = re.match(r'(\d{4}-\d{2})[_\- ]?(.*)', name)
    if match:
        work_order = f"Work Order No: {match.group(1)}"
        raw_title = match.group(2).replace("_", " ").replace(".", " ").strip()
        title = re.sub(r'\s+', ' ', raw_title) if raw_title else "Untitled"
    else:
        work_order = "Work Order No: UNKNOWN"
        title = "Untitled"
    return work_order, f"Title: {title}"

def clean_text(text):
    lines = text.splitlines()
    clean_lines = []
    for line in lines:
        if re.search(r'\bPage\b|\bFigure\b|\bJob No\b|\bGround Elevation\b', line, re.IGNORECASE):
            continue
        if re.fullmatch(r'[A-Z\s\d,\.#\-]{20,}', line.strip()):
            continue
        cleaned = re.sub(r'\s{2,}', ' ', line.strip())
        if cleaned:
            clean_lines.append(cleaned)
    return "\n".join(clean_lines)

def clean_all_files():
    if not os.path.exists(CLEAN_DIR):
        os.makedirs(CLEAN_DIR)

    txt_files = [f for f in os.listdir(RAW_DIR) if f.lower().endswith(".txt")]

    for filename in txt_files:
        file_path = os.path.join(RAW_DIR, filename)
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            raw_text = f.read()

        work_order_line, title_line = extract_work_order_and_title(filename)
        cleaned_body = clean_text(raw_text)
        full_cleaned_text = f"{work_order_line}\n{title_line}\n\n{cleaned_body}"

        output_path = os.path.join(CLEAN_DIR, filename)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(full_cleaned_text)

    print(f"✅ Cleaned {len(txt_files)} files with Work Order and Title inserted.")

if __name__ == "__main__":
    clean_all_files()
