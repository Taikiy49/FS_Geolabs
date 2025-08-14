// src/components/CoreBoxInventory.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_URL from "../config";
import "../styles/CoreBoxInventory.css";

const pageSizes = [10, 25, 50, 100];

function Badge({ children, tone = "neutral" }) {
  return <span className={`cbi-badge cbi-badge-${tone}`}>{children}</span>;
}

export default function CoreBoxInventory() {
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);

  // filters
  const [q, setQ] = useState("");
  const [island, setIsland] = useState("");
  const [year, setYear] = useState("");
  const [complete, setComplete] = useState("");
  const [keepOrDump, setKeepOrDump] = useState("");
  const [expiredOnly, setExpiredOnly] = useState(false);

  // sorting & paging
  const [sortBy, setSortBy] = useState("report_submission_date");
  const [sortDir, setSortDir] = useState("DESC");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // dropdown options
  const [years, setYears] = useState([]);
  const [islands, setIslands] = useState([]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(count / pageSize)),
    [count, pageSize]
  );

  const fetchOptions = async () => {
    try {
      const [y, i] = await Promise.all([
        axios.get(`${API_URL}/api/core-boxes/years`),
        axios.get(`${API_URL}/api/core-boxes/islands`),
      ]);
      setYears(y.data.years || []);
      setIslands(i.data.islands || []);
    } catch {
      setYears([]);
      setIslands([]);
    }
  };

  const fetchRows = async () => {
    const params = {
      q: q || undefined,
      island: island || undefined,
      year: year || undefined,
      complete: complete || undefined,
      keep_or_dump: keepOrDump || undefined,
      expired: expiredOnly ? "1" : undefined,
      sort_by: sortBy,
      sort_dir: sortDir,
      page,
      page_size: pageSize,
    };
    try {
      const res = await axios.get(`${API_URL}/api/core-boxes`, { params });
      setRows(res.data.rows || []);
      setCount(res.data.total || 0);
    } catch (e) {
      console.error("Failed to fetch core boxes", e);
      setRows([]);
      setCount(0);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, island, year, complete, keepOrDump, expiredOnly, sortBy, sortDir, page, pageSize]);

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(col);
      setSortDir("ASC");
    }
    setPage(1);
  };

  const resetFilters = () => {
    setQ("");
    setIsland("");
    setYear("");
    setComplete("");
    setKeepOrDump("");
    setExpiredOnly(false);
    setSortBy("report_submission_date");
    setSortDir("DESC");
    setPage(1);
    setPageSize(25);
  };

  const formatDate = (s) => {
    if (!s) return "";
    const d = new Date(s);
    return isNaN(d) ? s : d.toLocaleDateString();
  };

  return (
    <div className="cbi-wrap">
      <div className="cbi-topbar">
        <div className="cbi-filters">
          <input
            className="cbi-input"
            placeholder="Search (WO / Project / Engineer)…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />

          <select className="cbi-select" value={island} onChange={(e) => { setIsland(e.target.value); setPage(1); }}>
            <option value="">Island: All</option>
            {islands.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          <select className="cbi-select" value={year} onChange={(e) => { setYear(e.target.value); setPage(1); }}>
            <option value="">Year: All</option>
            {years.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          <select className="cbi-select" value={complete} onChange={(e) => { setComplete(e.target.value); setPage(1); }}>
            <option value="">Complete: All</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>

          <select className="cbi-select" value={keepOrDump} onChange={(e) => { setKeepOrDump(e.target.value); setPage(1); }}>
            <option value="">Disposition: All</option>
            <option value="Keep">Keep</option>
            <option value="Dump">Dump</option>
          </select>

          <label className="cbi-checkbox">
            <input
              type="checkbox"
              checked={expiredOnly}
              onChange={(e) => { setExpiredOnly(e.target.checked); setPage(1); }}
            />
            <span>Expired only</span>
          </label>

          <button className="cbi-btn cbi-btn-ghost" onClick={resetFilters}>Reset</button>
        </div>

        <div className="cbi-meta">
          <span>{count} results</span>
          <select
            className="cbi-select"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          >
            {pageSizes.map((n) => (
              <option key={n} value={n}>{n}/page</option>
            ))}
          </select>
        </div>
      </div>

      <div className="cbi-table-wrap">
        <table className="cbi-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("year")} className="cbi-th">Year {sortBy === "year" ? (sortDir === "ASC" ? "▲" : "▼") : ""}</th>
              <th onClick={() => toggleSort("island")} className="cbi-th">Island {sortBy === "island" ? (sortDir === "ASC" ? "▲" : "▼") : ""}</th>
              <th onClick={() => toggleSort("work_order")} className="cbi-th">W.O. {sortBy === "work_order" ? (sortDir === "ASC" ? "▲" : "▼") : ""}</th>
              <th onClick={() => toggleSort("project")} className="cbi-th">Project {sortBy === "project" ? (sortDir === "ASC" ? "▲" : "▼") : ""}</th>
              <th onClick={() => toggleSort("engineer")} className="cbi-th">Engineer {sortBy === "engineer" ? (sortDir === "ASC" ? "▲" : "▼") : ""}</th>
              <th onClick={() => toggleSort("report_submission_date")} className="cbi-th">Submitted {sortBy === "report_submission_date" ? (sortDir === "ASC" ? "▲" : "▼") : ""}</th>
              <th onClick={() => toggleSort("storage_expiry_date")} className="cbi-th">Expiry {sortBy === "storage_expiry_date" ? (sortDir === "ASC" ? "▲" : "▼") : ""}</th>
              <th className="cbi-th">Complete</th>
              <th className="cbi-th">Disposition</th>
              <th className="cbi-th">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const expired = r.storage_expiry_date && new Date(r.storage_expiry_date) < new Date();
              return (
                <tr key={r.id}>
                  <td>{r.year}</td>
                  <td>{r.island}</td>
                  <td className="cbi-mono">{r.work_order}</td>
                  <td title={r.project}>{r.project}</td>
                  <td>{r.engineer}</td>
                  <td>{formatDate(r.report_submission_date)}</td>
                  <td className={expired ? "cbi-expired" : ""}>{formatDate(r.storage_expiry_date)}</td>
                  <td>{r.complete}</td>
                  <td>{r.keep_or_dump}</td>
                  <td>
                    {expired ? <Badge tone="danger">Expired</Badge> : <Badge tone="ok">Active</Badge>}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan="10" className="cbi-empty">No results.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="cbi-pager">
        <button className="cbi-btn" onClick={() => setPage(1)} disabled={page === 1}>⏮</button>
        <button className="cbi-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>◀</button>
        <span className="cbi-page">{page} / {totalPages}</span>
        <button className="cbi-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>▶</button>
        <button className="cbi-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>⏭</button>
      </div>
    </div>
  );
}
