# server/blueprints/core_box_inventory.py

import os
import sqlite3
from flask import Blueprint, request

# Adjust these if your DB lives elsewhere
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
CORE_DB = os.path.join(BASE_DIR, "uploads", "core_box_inventory.db")

corebox_bp = Blueprint("corebox", __name__)

def core_conn():
    os.makedirs(os.path.dirname(CORE_DB), exist_ok=True)  # ensure uploads/ exists
    conn = sqlite3.connect(CORE_DB)
    conn.row_factory = sqlite3.Row
    return conn

# Also: remove init_corebox_indices() from the global scope


# Optional: ensure indices exist (call once at startup)
def init_corebox_indices():
    with core_conn() as conn:
        conn.executescript("""
          CREATE INDEX IF NOT EXISTS idx_core_year ON core_boxes(year);
          CREATE INDEX IF NOT EXISTS idx_core_island ON core_boxes(island);
          CREATE INDEX IF NOT EXISTS idx_core_work_order ON core_boxes(work_order);
          CREATE INDEX IF NOT EXISTS idx_core_submission ON core_boxes(report_submission_date);
          CREATE INDEX IF NOT EXISTS idx_core_expiry ON core_boxes(storage_expiry_date);
        """)

# Call this once when the app starts
init_corebox_indices()


@corebox_bp.get("/api/core-boxes")
def api_core_boxes():
    """List rows with filters, sorting, and pagination."""
    q = request.args.get("q", "").strip()
    island = request.args.get("island", "").strip()
    year = request.args.get("year", "").strip()
    complete = request.args.get("complete", "").strip()
    keep_or_dump = request.args.get("keep_or_dump", "").strip()
    expired = request.args.get("expired", "") == "1"

    sort_by = request.args.get("sort_by", "report_submission_date")
    sort_dir = request.args.get("sort_dir", "DESC").upper()
    page = max(1, int(request.args.get("page", 1)))
    page_size = max(1, min(200, int(request.args.get("page_size", 25))))
    offset = (page - 1) * page_size

    # Whitelist sorting
    SORTABLE = {
        "year", "island", "work_order", "project", "engineer",
        "report_submission_date", "storage_expiry_date"
    }
    if sort_by not in SORTABLE:
        sort_by = "report_submission_date"
    if sort_dir not in ("ASC", "DESC"):
        sort_dir = "DESC"

    where = []
    params = []

    if q:
        where.append("(work_order LIKE ? OR project LIKE ? OR engineer LIKE ?)")
        like = f"%{q}%"
        params += [like, like, like]

    if island:
        where.append("island = ?")
        params.append(island)

    if year:
        where.append("year = ?")
        params.append(int(year))

    if complete:
        where.append("complete = ?")
        params.append(complete)

    if keep_or_dump:
        where.append("keep_or_dump = ?")
        params.append(keep_or_dump)

    if expired:
        where.append("date(storage_expiry_date) < date('now')")

    where_sql = f"WHERE {' AND '.join(where)}" if where else ""

    sql_data = f"""
        SELECT id, year, island, work_order, project, engineer,
               report_submission_date, storage_expiry_date, complete, keep_or_dump
        FROM core_boxes
        {where_sql}
        ORDER BY {sort_by} {sort_dir}
        LIMIT ? OFFSET ?
    """
    sql_count = f"SELECT COUNT(*) AS n FROM core_boxes {where_sql}"

    with core_conn() as conn:
        total = conn.execute(sql_count, params).fetchone()["n"]
        rows = conn.execute(sql_data, params + [page_size, offset]).fetchall()
        out = [dict(r) for r in rows]
    return {"rows": out, "total": total}


@corebox_bp.get("/api/core-boxes/years")
def api_core_years():
    with core_conn() as conn:
        rows = conn.execute(
            "SELECT DISTINCT year FROM core_boxes WHERE year IS NOT NULL ORDER BY year DESC"
        ).fetchall()
    return {"years": [r["year"] for r in rows]}


@corebox_bp.get("/api/core-boxes/islands")
def api_core_islands():
    with core_conn() as conn:
        rows = conn.execute(
            "SELECT DISTINCT island FROM core_boxes WHERE island IS NOT NULL ORDER BY island"
        ).fetchall()
    return {"islands": [r["island"] for r in rows]}
