import os
import sqlite3
import pandas as pd
import win32com.client

# === Paths ===
xls_path = os.path.abspath(r"U:\Project Status\PR Data Base 6-25.xls")
xlsx_path = os.path.abspath("temp_converted.xlsx")
db_path = os.path.abspath("uploads/pr_data.db")
table_name = "pr_data"

# === If DB already exists, just load it ===
if os.path.exists(db_path):
    print(f"✅ Database already exists: {db_path}")
    try:
        conn = sqlite3.connect(db_path)
        df = pd.read_sql_query(f"SELECT * FROM {table_name}", conn)
        conn.close()
        print(f"📦 Loaded {len(df)} rows from existing database.\n")
        print("📋 Preview of data:")
        print(df.head())
    except Exception as e:
        print(f"❌ Error reading from database: {e}")
    exit()

# === Convert .xls → .xlsx using COM ===
print("🔄 Converting .xls to .xlsx...")
excel = win32com.client.Dispatch("Excel.Application")
excel.Visible = False
excel.DisplayAlerts = False

try:
    wb = excel.Workbooks.Open(xls_path)
    wb.SaveAs(xlsx_path, FileFormat=51)  # 51 = .xlsx
    wb.Close()
    excel.Quit()
    print(f"✅ Converted to {xlsx_path}")
except Exception as e:
    excel.Quit()
    print(f"❌ Failed to convert .xls to .xlsx: {e}")
    exit()

# === Load and unify all sheets ===
try:
    dfs = pd.read_excel(xlsx_path, sheet_name=None)
    all_rows = []

    for sheet_name, sheet_df in dfs.items():
        sheet_df = sheet_df.iloc[:, :6]  # Max 6 columns
        while len(sheet_df.columns) < 6:
            sheet_df[f"extra_{len(sheet_df.columns)}"] = None

        sheet_df.columns = ["Date", "Client", "Project", "PR", "WO_E", "WO_F"]
        sheet_df["WO"] = sheet_df["WO_E"].combine_first(sheet_df["WO_F"])
        sheet_df.dropna(how='all', inplace=True)
        sheet_df["Date"] = pd.to_datetime(sheet_df["Date"], errors="coerce").dt.date
        final_df = sheet_df[["Date", "Client", "Project", "PR", "WO"]]
        all_rows.append(final_df)

    df = pd.concat(all_rows, ignore_index=True)
    print(f"✅ Loaded {len(df)} total rows from all sheets.")
except Exception as e:
    print(f"❌ Failed to process Excel: {e}")
    exit()

# === Save to SQLite DB ===
try:
    conn = sqlite3.connect(db_path)
    df.to_sql(table_name, conn, if_exists='replace', index=False)
    conn.close()
    print(f"✅ Saved to DB: {db_path}")
    print("📋 Preview of saved data:")
    print(df.head())
except Exception as e:
    print(f"❌ Failed to save to database: {e}")
    exit()

# === Delete temporary .xlsx ===
try:
    os.remove(xlsx_path)
    print(f"🗑️ Deleted temporary file: {xlsx_path}")
except Exception as e:
    print(f"⚠️ Could not delete temp .xlsx: {e}")

