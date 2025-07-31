import os
import pandas as pd
import sqlite3

EXCEL_PATH = r"\\GEOLABS-SERVER\Project Status\PR Data Base 6-25\PR Data Base 6-25.xls"
DB_PATH = "pr_database.db"

if not os.path.exists(EXCEL_PATH):
    print(f"❌ File not found: {EXCEL_PATH}")
    exit()

try:
    df = pd.read_excel(EXCEL_PATH, sheet_name=0)
    print(f"✅ Loaded {len(df)} rows from Excel.")
except Exception as e:
    print("❌ Failed to load Excel:", e)
    exit()

try:
    conn = sqlite3.connect(DB_PATH)
    df.to_sql("pr_data", conn, if_exists="replace", index=False)
    conn.close()
    print(f"✅ Saved to SQLite DB: {DB_PATH}")
except Exception as e:
    print("❌ Failed to write to DB:", e)
