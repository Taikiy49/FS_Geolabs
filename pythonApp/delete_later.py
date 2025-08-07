import sqlite3
import random
import os

DB_PATH = os.path.join("uploads", "users.db")

first_names = ["alex", "morgan", "jordan", "riley", "casey", "drew", "jamie", "taylor", "charlie", "devon"]
last_names = ["smith", "lee", "patel", "garcia", "kim", "thompson", "nguyen", "adams", "owens", "brown"]
roles = ["User", "Admin"]

def generate_email():
    first = random.choice(first_names)
    last = random.choice(last_names)
    num = random.randint(1, 999)
    return f"{first}.{last}{num}@geolabs.net"

def insert_unique_users(n=10):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            role TEXT
        )
    """)

    inserted = 0
    while inserted < n:
        email = generate_email()
        cursor.execute("SELECT 1 FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            continue  # already exists, try another
        role = random.choice(roles)
        cursor.execute("INSERT INTO users (email, role) VALUES (?, ?)", (email, role))
        inserted += 1

    conn.commit()
    conn.close()
    print(f"{inserted} new dummy users successfully added to {DB_PATH}")

if __name__ == "__main__":
    insert_unique_users(5)
