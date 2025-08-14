// src/components/Sidebar.jsx
import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaChevronDown,
  FaRobot,
  FaDatabase,
  FaCogs,
  FaTable,
  FaFolderOpen,
  FaCloudUploadAlt,
  FaCloud,
  FaSearch,
  FaHome,
  FaUserShield,
  FaAddressBook,
  FaBoxOpen,
} from "react-icons/fa";
import "../styles/Sidebar.css";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

export default function Sidebar({ collapsed, setCollapsed }) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdowns, setDropdowns] = useState({ doc: true, proj: true });

  const toggleDropdown = (key) =>
    setDropdowns((d) => ({ ...d, [key]: !d[key] }));

  const Item = ({ to, icon: Icon, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `sidebar-link ${isActive ? "active" : ""}`
      }
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
      title={label}
    >
      <Icon className="sidebar-link-icon" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );

  if (isMobile) return null;

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Open sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <FaBars /> : <FaTimes />}
      </button>

      {/* Home */}
      {!collapsed && (
        <Item to="/" icon={FaHome} label="Home" key="home" />
      )}

      {/* Document Databases */}
      <button
        className="sidebar-link"
        onClick={() => toggleDropdown("doc")}
        aria-expanded={dropdowns.doc}
        aria-controls="doc-group"
      >
        <FaDatabase className="sidebar-link-icon" />
        {!collapsed && <span>Document Databases</span>}
        {!collapsed && (
          <FaChevronDown
            className={`sidebar-link-chevron ${
              dropdowns.doc ? "rotate" : ""
            }`}
          />
        )}
      </button>
      {dropdowns.doc && !collapsed && (
        <div className="sidebar-dropdown" id="doc-group">
          {/* Ask AI = Robot */}
          <Item to="/ask-ai" icon={FaRobot} label="Ask AI" />
          {/* DB Viewer = Table */}
          <Item to="/db-viewer" icon={FaTable} label="DB Viewer" />
          {/* DB Admin = Cogs */}
          <Item to="/db-admin" icon={FaCogs} label="DB Admin" />
        </div>
      )}

      {/* Project Finder */}
      <button
        className="sidebar-link"
        onClick={() => toggleDropdown("proj")}
        aria-expanded={dropdowns.proj}
        aria-controls="proj-group"
      >
        <FaFolderOpen className="sidebar-link-icon" />
        {!collapsed && <span>Project Finder</span>}
        {!collapsed && (
          <FaChevronDown
            className={`sidebar-link-chevron ${
              dropdowns.proj ? "rotate" : ""
            }`}
          />
        )}
      </button>
      {dropdowns.proj && !collapsed && (
        <div className="sidebar-dropdown" id="proj-group">
          {/* S3 Viewer = Cloud (view/download) */}
          <Item to="/s3-viewer" icon={FaCloud} label="S3 Viewer" />
          {/* S3 Admin = Cloud Upload */}
          <Item to="/s3-admin" icon={FaCloudUploadAlt} label="S3 Admin" />
          {/* OCR Lookup = Search */}
          <Item to="/ocr-lookup" icon={FaSearch} label="OCR Lookup" />
        </div>
      )}

      {/* Core Box Inventory = Box/Open Box; also FIXED route path */}
      <Item
        to="/core-box-inventory"
        icon={FaBoxOpen}
        label="Core Box Inventory"
        key="core-box"
      />

      {/* Admin = Shield */}
      <Item to="/admin" icon={FaUserShield} label="Admin" key="admin" />

      {/* Contacts = Address Book */}
      <Item
        to="/contacts"
        icon={FaAddressBook}
        label="Contacts"
        key="contacts"
      />
    </aside>
  );
}
