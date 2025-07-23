import sqlite3
import os

# Paths
chat_history_path = "uploads/chat_history.db"
handbook_path = "uploads/employee_handbook.db"

# Helper to inspect DB with truncated content
def inspect_db(db_path, sample_table=None):
    print(f"\n📁 Inspecting {db_path}...")
    if not os.path.exists(db_path):
        print("❌ File not found!")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Show all table names
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print("📄 Tables:", tables)

    for (table,) in tables:
        print(f"\n🔍 Columns in '{table}':")
        cursor.execute(f"PRAGMA table_info({table})")
        for col in cursor.fetchall():
            print(col)

        if sample_table is None or table == sample_table:
            print(f"\n📊 Sample rows from '{table}' (truncated to 50 chars):")
            cursor.execute(f"SELECT * FROM {table} LIMIT 5")
            rows = cursor.fetchall()
            for i, row in enumerate(rows):
                truncated = tuple(str(col)[:10] + ("..." if len(str(col)) > 50 else "") for col in row)
                print(f"Row {i+1}:", truncated)

    conn.close()


# Run inspections
inspect_db(chat_history_path, sample_table="chat_history")
inspect_db(handbook_path, sample_table="handbook_chunks")
