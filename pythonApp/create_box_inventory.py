import pandas as pd
import sqlite3
from datetime import datetime

# Load Excel file
xlsx_file = "Maui Core Box Inventory.xlsx"
df = pd.read_excel(xlsx_file)

# Rename columns to match DB schema (standardize names)
df.rename(columns={
    "W.O. Number": "work_order",
    "Project": "project",
    "Engineer": "engineer",
    "Report Submission Date": "report_submission_date",
    "Construction Complete?": "complete",
    "Keep or Dump": "keep_or_dump"
}, inplace=True)

# Convert submission date to datetime
df["report_submission_date"] = pd.to_datetime(df["report_submission_date"], errors='coerce')

# Create the 3-month storage date (replacing the existing 2-month one)
df["storage_expiry_date"] = df["report_submission_date"] + pd.DateOffset(months=3)

# Add island and year metadata
df["island"] = "Maui"
df["year"] = df["report_submission_date"].dt.year

# Final dataframe (matching DB columns)
final_df = df[[
    "year",
    "island",
    "work_order",
    "project",
    "engineer",
    "report_submission_date",
    "storage_expiry_date",
    "complete",
    "keep_or_dump"
]]

# Save to SQLite database
db_file = "core_box_inventory.db"
conn = sqlite3.connect(db_file)
cursor = conn.cursor()

# Create the table if it doesn't exist
cursor.execute("""
CREATE TABLE IF NOT EXISTS core_boxes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER,
    island TEXT CHECK(island IN ('Hawaii', 'Maui')),
    work_order TEXT,
    project TEXT,
    engineer TEXT,
    report_submission_date TEXT,
    storage_expiry_date TEXT,
    complete TEXT,
    keep_or_dump TEXT
)
""")

# Insert into DB
final_df.to_sql("core_boxes", conn, if_exists='append', index=False)

# Commit and close
conn.commit()
conn.close()

print("✅ Database created and data inserted successfully.")
