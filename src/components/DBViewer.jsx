import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import API_URL from "../config";
import {
  FaSync,
  FaCopy,
  FaExternalLinkAlt,
  FaCloudDownloadAlt,
  FaTimes,
  FaSearch,
  FaTrash,
  FaChevronDown
} from "react-icons/fa";
import "../styles/DBViewer.css";

const pageSizes = [10, 25, 50, 100];

function extOf(name = "") {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

export default function FileSystem() {
  // Global
  const [dbs, setDbs] = useState([]);
  const [loadingDbs, setLoadingDbs] = useState(true);
  const [error, setError] = useState("");

  // DB list controls
  const [qDb, setQDb] = useState("");
  const [sortDbBy, setSortDbBy] = useState("name"); // name | files
  const [sortDbDir, setSortDbDir] = useState("ASC");

  // Expanded state
  const [expanded, setExpanded] = useState(""); // which DB is open (single)
  const [filesByDb, setFilesByDb] = useState({}); // { dbName: string[] }
  const [loadingFiles, setLoadingFiles] = useState(false);

  // S3 signed URLs
  const [s3PdfUrls, setS3PdfUrls] = useState({}); // { "db/file.pdf": url }

  // File controls (per expanded DB)
  const [qFile, setQFile] = useState("");
  const [fileExt, setFileExt] = useState("");
  const [sortFileBy, setSortFileBy] = useState("name"); // name | ext
  const [sortFileDir, setSortFileDir] = useState("ASC");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Selection + preview + schema
  const [selected, setSelected] = useState(new Set());
  const [copiedKey, setCopiedKey] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewMeta, setPreviewMeta] = useState({ name: "", ext: "" });
  const [schema, setSchema] = useState(null); // { db, table-> {columns, sample_rows}}

  // Initial loads
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingDbs(true);
        const res = await axios.get(`${API_URL}/api/list-dbs`);
        const filtered = (res.data.dbs || []).filter(d => d !== "chat_history.db");
        setDbs(filtered);
      } catch (e) {
        setError("Failed to fetch DB list.");
      } finally {
        setLoadingDbs(false);
      }
    };
    const loadS3 = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/s3-db-pdfs`);
        const map = {};
        for (const { Key, url } of res.data.files || []) map[Key] = url;
        setS3PdfUrls(map);
      } catch (e) {
        // ignore: S3 may be optional
      }
    };
    load();
    loadS3();
  }, []);

  // Derived: DB list with search/sort
  const filteredDbs = useMemo(() => {
    const needle = qDb.trim().toLowerCase();
    let arr = dbs;
    if (needle) arr = dbs.filter(d => d.toLowerCase().includes(needle));
    // add file counts if loaded
    const withMeta = arr.map(d => ({
      name: d,
      files: (filesByDb[d] || []).length
    }));
    withMeta.sort((a, b) => {
      let r =
        sortDbBy === "files"
          ? a.files - b.files
          : a.name.localeCompare(b.name);
      return sortDbDir === "ASC" ? r : -r;
    });
    return withMeta;
  }, [dbs, qDb, sortDbBy, sortDbDir, filesByDb]);

  const toggleDbSort = (field) => {
    if (sortDbBy === field) {
      setSortDbDir(d => (d === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortDbBy(field);
      setSortDbDir("ASC");
    }
  };

  const refreshDbs = async () => {
    try {
      setLoadingDbs(true);
      const res = await axios.get(`${API_URL}/api/list-dbs`);
      const filtered = (res.data.dbs || []).filter(d => d !== "chat_history.db");
      setDbs(filtered);
    } catch {
      setError("Failed to refresh DB list.");
    } finally {
      setLoadingDbs(false);
    }
  };

  const openDb = async (db) => {
    if (expanded === db) {
      setExpanded("");
      setSelected(new Set());
      return;
    }
    setExpanded(db);
    setSelected(new Set());
    setQFile("");
    setFileExt("");
    setSortFileBy("name");
    setSortFileDir("ASC");
    setPage(1);
    setPageSize(25);

    if (!filesByDb[db]) {
      try {
        setLoadingFiles(true);
        const res = await axios.post(`${API_URL}/api/list-files`, { db_name: db });
        setFilesByDb(prev => ({ ...prev, [db]: res.data.files || [] }));
      } catch (e) {
        setFilesByDb(prev => ({ ...prev, [db]: [] }));
      } finally {
        setLoadingFiles(false);
      }
    }
  };

  const inspectDb = async (db) => {
    try {
      const res = await axios.post(`${API_URL}/api/inspect-db`, { db_name: db });
      setSchema({ db, ...res.data });
    } catch {
      setSchema({ db, error: "Failed to load schema." });
    }
  };

  const deleteDb = async (db) => {
    const txt = prompt(`Type EXACTLY: DELETE ${db}`);
    if (!txt) return;
    try {
      await axios.post(`${API_URL}/api/delete-db`, {
        db_name: db,
        confirmation_text: txt
      });
      setDbs(prev => prev.filter(d => d !== db));
      setExpanded("");
      setFilesByDb(prev => {
        const n = { ...prev }; delete n[db]; return n;
      });
    } catch (e) {
      alert("Deletion failed.");
    }
  };

  // Files (for expanded DB)
  const files = filesByDb[expanded] || [];
  const fileOptionsExt = useMemo(() => {
    const s = new Set(files.map(extOf).filter(Boolean));
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [files]);

  const filteredFiles = useMemo(() => {
    let arr = files.map(name => ({ name, ext: extOf(name) }));
    if (qFile.trim()) {
      const needle = qFile.toLowerCase();
      arr = arr.filter(f => f.name.toLowerCase().includes(needle));
    }
    if (fileExt) arr = arr.filter(f => f.ext === fileExt);
    arr.sort((a, b) => {
      const r = sortFileBy === "ext"
        ? a.ext.localeCompare(b.ext)
        : a.name.localeCompare(b.name);
      return sortFileDir === "ASC" ? r : -r;
    });
    return arr;
  }, [files, qFile, fileExt, sortFileBy, sortFileDir]);

  const totalFiles = filteredFiles.length;
  const totalPages = Math.max(1, Math.ceil(totalFiles / pageSize));
  const pagedFiles = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredFiles.slice(start, start + pageSize);
  }, [filteredFiles, page, pageSize]);

  const toggleFileSort = (field) => {
    if (sortFileBy === field) {
      setSortFileDir(d => (d === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortFileBy(field);
      setSortFileDir("ASC");
    }
    setPage(1);
  };

  const s3Url = (db, file) => s3PdfUrls[`${db}/${file}`];

  const copyUrl = async (db, file) => {
    const url = s3Url(db, file);
    if (!url) return alert("Signed URL not found.");
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(`${db}/${file}`);
      setTimeout(() => setCopiedKey(""), 1200);
    } catch {}
  };

  const openPreview = (db, file) => {
    const url = s3Url(db, file);
    if (!url) return alert("Signed URL not found.");
    setPreviewMeta({ name: file, ext: extOf(file) });
    setPreviewUrl(url);
  };

  const selectAllOnPage = (checked) => {
    setSelected(prev => {
      const next = new Set(prev);
      pagedFiles.forEach(f =>
        checked ? next.add(f.name) : next.delete(f.name)
      );
      return next;
    });
  };
  const toggleSelect = (name) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  const bulkCopy = async () => {
    const urls = [...selected]
      .map(n => s3Url(expanded, n))
      .filter(Boolean)
      .join("\n");
    if (!urls) return;
    try {
      await navigator.clipboard.writeText(urls);
      setCopiedKey("@bulk");
      setTimeout(() => setCopiedKey(""), 1200);
    } catch {}
  };

  const bulkOpen = () => {
    const urls = [...selected]
      .map(n => s3Url(expanded, n))
      .filter(Boolean)
      .slice(0, 10);
    if (urls.length === 0) return;
    urls.forEach(u => window.open(u, "_blank", "noopener,noreferrer"));
  };

  const exportCsv = () => {
    const rows = filteredFiles.map(f => [expanded, f.name, f.ext.toUpperCase(), s3Url(expanded, f.name) || ""]);
    const header = "database,file,ext,url\n";
    const body = rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${expanded}_files.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fs-wrap">
      <div className="fs-topbar">
        <div className="fs-left">
          <div className="fs-search">
            <FaSearch className="fs-search-icon" />
            <input
              className="fs-input"
              placeholder="Search databases…"
              value={qDb}
              onChange={(e) => setQDb(e.target.value)}
            />
          </div>
          <button className="fs-btn" onClick={refreshDbs} title="Refresh DB list">
            <FaSync className="fs-ic" /> Refresh
          </button>
        </div>
        <div className="fs-right">
          <span className="fs-muted">{filteredDbs.length} DBs</span>
        </div>
      </div>

      <div className="fs-body">
        <div className="fs-dbcol">
          <div className="fs-listhead">
            <button className="fs-link" onClick={() => toggleDbSort("name")}>
              Name {sortDbBy === "name" ? (sortDbDir === "ASC" ? "▲" : "▼") : ""}
            </button>
            <button className="fs-link" onClick={() => toggleDbSort("files")}>
              Files {sortDbBy === "files" ? (sortDbDir === "ASC" ? "▲" : "▼") : ""}
            </button>
          </div>

          {loadingDbs ? (
            <div className="fs-empty">Loading DBs…</div>
          ) : error ? (
            <div className="fs-empty">{error}</div>
          ) : filteredDbs.length === 0 ? (
            <div className="fs-empty">No databases.</div>
          ) : (
            <ul className="fs-dblist">
              {filteredDbs.map(({ name, files }) => (
                <li key={name} className={`fs-dbitem ${expanded === name ? "is-active" : ""}`}>
                  <div className="fs-dbrow">
                    <button className="fs-dbname" onClick={() => openDb(name)}>
                      {name} <FaChevronDown className={`fs-caret ${expanded === name ? "is-open" : ""}`} />
                    </button>
                    <div className="fs-dbmeta">
                      <span className="fs-chip">{files} files</span>
                      <button className="fs-link" onClick={() => inspectDb(name)}>[Schema]</button>
                      <button className="fs-link fs-danger" onClick={() => deleteDb(name)} title="Delete DB">
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="fs-filecol">
          {expanded ? (
            <>
              <div className="fs-filehead">
                <div className="fs-title">{expanded}</div>
                <div className="fs-filters">
                  <div className="fs-search">
                    <FaSearch className="fs-search-icon" />
                    <input
                      className="fs-input"
                      placeholder="Search files…"
                      value={qFile}
                      onChange={(e) => { setQFile(e.target.value); setPage(1); }}
                    />
                  </div>
                  <select
                    className="fs-select"
                    value={fileExt}
                    onChange={(e) => { setFileExt(e.target.value); setPage(1); }}
                  >
                    <option value="">Type: All</option>
                    {fileOptionsExt.map(x => (
                      <option key={x} value={x}>{x.toUpperCase()}</option>
                    ))}
                  </select>
                  <button className="fs-btn" onClick={exportCsv}>Export CSV</button>
                  <select
                    className="fs-select"
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  >
                    {pageSizes.map(n => <option key={n} value={n}>{n}/page</option>)}
                  </select>
                </div>
              </div>

              <div className="fs-actions">
                <label className="fs-checkrow">
                  <input
                    type="checkbox"
                    checked={pagedFiles.length > 0 && pagedFiles.every(f => selected.has(f.name))}
                    onChange={(e) => selectAllOnPage(e.target.checked)}
                  />
                  <span>Select page</span>
                </label>
                <button className="fs-btn" onClick={bulkCopy} disabled={selected.size === 0}>
                  <FaCopy className="fs-ic" /> Copy URLs
                </button>
                <button className="fs-btn" onClick={bulkOpen} disabled={selected.size === 0}>
                  <FaExternalLinkAlt className="fs-ic" /> Open (max 10)
                </button>
                {selected.size > 0 && (
                  <button className="fs-btn fs-btn-ghost" onClick={clearSelection}>
                    Clear ({selected.size})
                  </button>
                )}
                {(copiedKey === "@bulk") && <span className="fs-copied">Copied!</span>}
              </div>

              <div className="fs-tablewrap">
                {loadingFiles ? (
                  <div className="fs-empty">Loading files…</div>
                ) : totalFiles === 0 ? (
                  <div className="fs-empty">No files.</div>
                ) : (
                  <table className="fs-table">
                    <thead>
                      <tr>
                        <th className="fs-th fs-th-check"></th>
                        <th className="fs-th" onClick={() => toggleFileSort("name")}>
                          File {sortFileBy === "name" ? (sortFileDir === "ASC" ? "▲" : "▼") : ""}
                        </th>
                        <th className="fs-th" onClick={() => toggleFileSort("ext")}>
                          Type {sortFileBy === "ext" ? (sortFileDir === "ASC" ? "▲" : "▼") : ""}
                        </th>
                        <th className="fs-th fs-th-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedFiles.map(({ name, ext }) => {
                        const url = s3Url(expanded, name);
                        const key = `${expanded}/${name}`;
                        return (
                          <tr key={name}>
                            <td className="fs-td-check">
                              <input
                                type="checkbox"
                                checked={selected.has(name)}
                                onChange={() => toggleSelect(name)}
                              />
                            </td>
                            <td className="fs-ellipsis" title={name}>{name}</td>
                            <td className="fs-type">{ext ? ext.toUpperCase() : "-"}</td>
                            <td className="fs-actions-cell">
                              <button className="fs-iconbtn" title="Preview" onClick={() => openPreview(expanded, name)}>👁</button>
                              {url ? (
                                <>
                                  <a className="fs-iconbtn" href={url} target="_blank" rel="noreferrer" title="Open"><FaExternalLinkAlt /></a>
                                  <a className="fs-iconbtn" href={url} download={name} title="Download"><FaCloudDownloadAlt /></a>
                                  <button className="fs-iconbtn" title="Copy URL" onClick={() => copyUrl(expanded, name)}><FaCopy /></button>
                                  {copiedKey === key && <span className="fs-copied-inline">Copied</span>}
                                </>
                              ) : (
                                <span className="fs-muted">No URL</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="fs-pager">
                <button className="fs-btn" onClick={() => setPage(1)} disabled={page === 1}>⏮</button>
                <button className="fs-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>◀</button>
                <span className="fs-page">{page} / {totalPages}</span>
                <button className="fs-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>▶</button>
                <button className="fs-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>⏭</button>
              </div>
            </>
          ) : (
            <div className="fs-empty fs-full">Select a database to view files.</div>
          )}
        </div>
      </div>

      {/* Schema modal */}
      {schema && (
        <div className="fs-modal" onClick={() => setSchema(null)}>
          <div className="fs-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="fs-modal-head">
              <div className="fs-title">Schema: {schema.db}</div>
              <button className="fs-iconbtn" onClick={() => setSchema(null)} title="Close"><FaTimes /></button>
            </div>
            <div className="fs-modal-body">
              {schema.error ? (
                <div className="fs-empty">{schema.error}</div>
              ) : (
                Object.entries(schema).map(([table, info]) => {
                  if (table === "db") return null;
                  return (
                    <div key={table} className="fs-schema-block">
                      <div className="fs-schema-title">{table}</div>
                      <div className="fs-schema-columns">Columns: {info.columns.join(", ")}</div>
                      <div className="fs-schema-sample">Sample rows:</div>
                      <div className="fs-sample-table">
                        {(info.sample_rows || []).slice(0, 5).map((row, i) => (
                          <div key={i} className="fs-sample-row">
                            {(row || []).map((cell, j) => (
                              <span key={j} className="fs-cell" title={String(cell)}>
                                {typeof cell === "string" && cell.length > 60 ? (cell.slice(0, 60) + "…") : String(cell)}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewUrl && (
        <div className="fs-modal" onClick={() => setPreviewUrl("")}>
          <div className="fs-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="fs-modal-head">
              <div className="fs-title">{previewMeta.name}</div>
              <button className="fs-iconbtn" onClick={() => setPreviewUrl("")} title="Close"><FaTimes /></button>
            </div>
            <div className="fs-modal-body">
              {previewMeta.ext === "pdf" ? (
                <iframe className="fs-frame" src={previewUrl} title="Preview" />
              ) : ["png", "jpg", "jpeg", "webp", "gif"].includes(previewMeta.ext) ? (
                <img className="fs-img" src={previewUrl} alt={previewMeta.name} />
              ) : (
                <div className="fs-empty">No inline preview for .{previewMeta.ext}. Use Open/Download.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
