import React, { useState } from "react";
import { Database, Key, Link, Hash, Type, Calendar, ToggleLeft, ChevronDown, ChevronRight, Search, Table2 } from "lucide-react";
import { getDatabaseById } from "@/lib/queryEngine";

// ─── Schema Definitions ───────────────────────────────────────────────────────

const SCHEMA_DATA = {
  chinook: {
    tables: [
      {
        name: "Artist",
        description: "Music artists and bands",
        color: "purple",
        columns: [
          { name: "ArtistId", type: "INTEGER", pk: true, fk: false, nullable: false },
          { name: "Name", type: "NVARCHAR(120)", pk: false, fk: false, nullable: true },
        ],
        relations: ["Album"],
      },
      {
        name: "Album",
        description: "Music albums released by artists",
        color: "blue",
        columns: [
          { name: "AlbumId", type: "INTEGER", pk: true, fk: false, nullable: false },
          { name: "Title", type: "NVARCHAR(160)", pk: false, fk: false, nullable: false },
          { name: "ArtistId", type: "INTEGER", pk: false, fk: true, nullable: false, ref: "Artist" },
        ],
        relations: ["Artist", "Track"],
      },
      {
        name: "Genre",
        description: "Music genres for classification",
        color: "green",
        columns: [
          { name: "GenreId", type: "INTEGER", pk: true, fk: false, nullable: false },
          { name: "Name", type: "NVARCHAR(120)", pk: false, fk: false, nullable: true },
        ],
        relations: ["Track"],
      },
      {
        name: "MediaType",
        description: "Audio/video media formats",
        color: "orange",
        columns: [
          { name: "MediaTypeId", type: "INTEGER", pk: true, fk: false, nullable: false },
          { name: "Name", type: "NVARCHAR(120)", pk: false, fk: false, nullable: true },
        ],
        relations: ["Track"],
      },
      {
        name: "Track",
        description: "Individual music tracks",
        color: "pink",
        columns: [
          { name: "TrackId", type: "INTEGER", pk: true, fk: false, nullable: false },
          { name: "Name", type: "NVARCHAR(200)", pk: false, fk: false, nullable: false },
          { name: "AlbumId", type: "INTEGER", pk: false, fk: true, nullable: true, ref: "Album" },
          { name: "MediaTypeId", type: "INTEGER", pk: false, fk: true, nullable: false, ref: "MediaType" },
          { name: "GenreId", type: "INTEGER", pk: false, fk: true, nullable: true, ref: "Genre" },
          { name: "Composer", type: "NVARCHAR(220)", pk: false, fk: false, nullable: true },
          { name: "Milliseconds", type: "INTEGER", pk: false, fk: false, nullable: false },
          { name: "Bytes", type: "INTEGER", pk: false, fk: false, nullable: true },
          { name: "UnitPrice", type: "NUMERIC(10,2)", pk: false, fk: false, nullable: false },
        ],
        relations: ["Album", "MediaType", "Genre", "PlaylistTrack", "InvoiceLine"],
      },
      {
        name: "Playlist",
        description: "User-created playlists",
        color: "teal",
        columns: [
          { name: "PlaylistId", type: "INTEGER", pk: true, fk: false, nullable: false },
          { name: "Name", type: "NVARCHAR(120)", pk: false, fk: false, nullable: true },
        ],
        relations: ["PlaylistTrack"],
      },
      {
        name: "PlaylistTrack",
        description: "Junction: playlists and tracks",
        color: "teal",
        columns: [
          { name: "PlaylistId", type: "INTEGER", pk: true, fk: true, nullable: false, ref: "Playlist" },
          { name: "TrackId", type: "INTEGER", pk: true, fk: true, nullable: false, ref: "Track" },
        ],
        relations: ["Playlist", "Track"],
      },
      {
        name: "Employee",
        description: "Store staff and management",
        color: "indigo",
        columns: [
          { name: "EmployeeId", type: "INTEGER", pk: true, fk: false, nullable: false },
          { name: "LastName", type: "NVARCHAR(20)", pk: false, fk: false, nullable: false },
          { name: "FirstName", type: "NVARCHAR(20)", pk: false, fk: false, nullable: false },
          { name: "Title", type: "NVARCHAR(30)", pk: false, fk: false, nullable: true },
          { name: "ReportsTo", type: "INTEGER", pk: false, fk: true, nullable: true, ref: "Employee" },
          { name: "BirthDate", type: "DATETIME", pk: false, fk: false, nullable: true },
          { name: "HireDate", type: "DATETIME", pk: false, fk: false, nullable: true },
          { name: "Email", type: "NVARCHAR(60)", pk: false, fk: false, nullable: true },
          { name: "Phone", type: "NVARCHAR(24)", pk: false, fk: false, nullable: true },
          { name: "City", type: "NVARCHAR(40)", pk: false, fk: false, nullable: true },
          { name: "Country", type: "NVARCHAR(40)", pk: false, fk: false, nullable: true },
        ],
        relations: ["Customer"],
      },
      {
        name: "Customer",
        description: "Store customers worldwide",
        color: "amber",
        columns: [
          { name: "CustomerId", type: "INTEGER", pk: true, fk: false, nullable: false },
          { name: "FirstName", type: "NVARCHAR(40)", pk: false, fk: false, nullable: false },
          { name: "LastName", type: "NVARCHAR(20)", pk: false, fk: false, nullable: false },
          { name: "Company", type: "NVARCHAR(80)", pk: false, fk: false, nullable: true },
          { name: "Email", type: "NVARCHAR(60)", pk: false, fk: false, nullable: false },
          { name: "Phone", type: "NVARCHAR(24)", pk: false, fk: false, nullable: true },
          { name: "City", type: "NVARCHAR(40)", pk: false, fk: false, nullable: true },
          { name: "Country", type: "NVARCHAR(40)", pk: false, fk: false, nullable: true },
          { name: "SupportRepId", type: "INTEGER", pk: false, fk: true, nullable: true, ref: "Employee" },
        ],
        relations: ["Employee", "Invoice"],
      },
      {
        name: "Invoice",
        description: "Customer purchase invoices",
        color: "red",
        columns: [
          { name: "InvoiceId", type: "INTEGER", pk: true, fk: false, nullable: false },
          { name: "CustomerId", type: "INTEGER", pk: false, fk: true, nullable: false, ref: "Customer" },
          { name: "InvoiceDate", type: "DATETIME", pk: false, fk: false, nullable: false },
          { name: "BillingAddress", type: "NVARCHAR(70)", pk: false, fk: false, nullable: true },
          { name: "BillingCity", type: "NVARCHAR(40)", pk: false, fk: false, nullable: true },
          { name: "BillingCountry", type: "NVARCHAR(40)", pk: false, fk: false, nullable: true },
          { name: "Total", type: "NUMERIC(10,2)", pk: false, fk: false, nullable: false },
        ],
        relations: ["Customer", "InvoiceLine"],
      },
      {
        name: "InvoiceLine",
        description: "Line items on each invoice",
        color: "red",
        columns: [
          { name: "InvoiceLineId", type: "INTEGER", pk: true, fk: false, nullable: false },
          { name: "InvoiceId", type: "INTEGER", pk: false, fk: true, nullable: false, ref: "Invoice" },
          { name: "TrackId", type: "INTEGER", pk: false, fk: true, nullable: false, ref: "Track" },
          { name: "UnitPrice", type: "NUMERIC(10,2)", pk: false, fk: false, nullable: false },
          { name: "Quantity", type: "INTEGER", pk: false, fk: false, nullable: false },
        ],
        relations: ["Invoice", "Track"],
      },
    ],
  },
  northwind: {
    tables: [
      {
        name: "Categories",
        description: "Product category classifications",
        color: "green",
        columns: [
          { name: "CategoryID", type: "INTEGER", pk: true, fk: false, nullable: false },
          { name: "CategoryName", type: "NVARCHAR(15)", pk: false, fk: false, nullable: false },
          { name: "Description", type: "NTEXT", pk: false, fk: false, nullable: true },
        ],
        relations: ["Products"],
      },
      {
        name: "Suppliers",
        description: "Product suppliers and vendors",
        color: "blue",
        columns: [
          { name: "SupplierID", type: "INTEGER", pk: true, fk: false, nullable: false },
          { name: "CompanyName", type: "NVARCHAR(40)", pk: false, fk: false, nullable: false },
          { name: "ContactName", type: "NVARCHAR(30)", pk: false, fk: false, nullable: true },
          { name: "ContactTitle", type: "NVARCHAR(30)", pk: false, fk: false, nullable: true },
          { name: "Country", type: "NVARCHAR(15)", pk: false, fk: false, nullable: true },
          { name: "Phone", type: "NVARCHAR(24)", pk: false, fk: false, nullable: true },
        ],
        relations: ["Products"],
      },
      {
        name: "Products",
        description: "Catalog of all available products",
        color: "purple",
        columns: [
          { name: "ProductID", type: "INTEGER", pk: true, fk: false, nullable: false },
          { name: "ProductName", type: "NVARCHAR(40)", pk: false, fk: false, nullable: false },
          { name: "SupplierID", type: "INTEGER", pk: false, fk: true, nullable: true, ref: "Suppliers" },
          { name: "CategoryID", type: "INTEGER", pk: false, fk: true, nullable: true, ref: "Categories" },
          { name: "QuantityPerUnit", type: "NVARCHAR(20)", pk: false, fk: false, nullable: true },
          { name: "UnitPrice", type: "MONEY", pk: false, fk: false, nullable: true },
          { name: "UnitsInStock", type: "SMALLINT", pk: false, fk: false, nullable: true },
          { name: "UnitsOnOrder", type: "SMALLINT", pk: false, fk: false, nullable: true },
          { name: "Discontinued", type: "BIT", pk: false, fk: false, nullable: false },
        ],
        relations: ["Suppliers", "Categories", "OrderDetails"],
      },
      {
        name: "Shippers",
        description: "Shipping companies used for delivery",
        color: "orange",
        columns: [
          { name: "ShipperID", type: "INTEGER", pk: true, fk: false, nullable: false },
          { name: "CompanyName", type: "NVARCHAR(40)", pk: false, fk: false, nullable: false },
          { name: "Phone", type: "NVARCHAR(24)", pk: false, fk: false, nullable: true },
        ],
        relations: ["Orders"],
      },
      {
        name: "Customers",
        description: "Retail customers placing orders",
        color: "amber",
        columns: [
          { name: "CustomerID", type: "NCHAR(5)", pk: true, fk: false, nullable: false },
          { name: "CompanyName", type: "NVARCHAR(40)", pk: false, fk: false, nullable: false },
          { name: "ContactName", type: "NVARCHAR(30)", pk: false, fk: false, nullable: true },
          { name: "ContactTitle", type: "NVARCHAR(30)", pk: false, fk: false, nullable: true },
          { name: "Country", type: "NVARCHAR(15)", pk: false, fk: false, nullable: true },
          { name: "Phone", type: "NVARCHAR(24)", pk: false, fk: false, nullable: true },
        ],
        relations: ["Orders"],
      },
      {
        name: "Employees",
        description: "Staff handling orders and territories",
        color: "indigo",
        columns: [
          { name: "EmployeeID", type: "INTEGER", pk: true, fk: false, nullable: false },
          { name: "LastName", type: "NVARCHAR(20)", pk: false, fk: false, nullable: false },
          { name: "FirstName", type: "NVARCHAR(10)", pk: false, fk: false, nullable: false },
          { name: "Title", type: "NVARCHAR(30)", pk: false, fk: false, nullable: true },
          { name: "ReportsTo", type: "INTEGER", pk: false, fk: true, nullable: true, ref: "Employees" },
          { name: "HireDate", type: "DATETIME", pk: false, fk: false, nullable: true },
          { name: "Country", type: "NVARCHAR(15)", pk: false, fk: false, nullable: true },
        ],
        relations: ["Orders", "EmployeeTerritories"],
      },
      {
        name: "Orders",
        description: "Customer purchase orders",
        color: "red",
        columns: [
          { name: "OrderID", type: "INTEGER", pk: true, fk: false, nullable: false },
          { name: "CustomerID", type: "NCHAR(5)", pk: false, fk: true, nullable: true, ref: "Customers" },
          { name: "EmployeeID", type: "INTEGER", pk: false, fk: true, nullable: true, ref: "Employees" },
          { name: "OrderDate", type: "DATETIME", pk: false, fk: false, nullable: true },
          { name: "RequiredDate", type: "DATETIME", pk: false, fk: false, nullable: true },
          { name: "ShippedDate", type: "DATETIME", pk: false, fk: false, nullable: true },
          { name: "ShipVia", type: "INTEGER", pk: false, fk: true, nullable: true, ref: "Shippers" },
          { name: "Freight", type: "MONEY", pk: false, fk: false, nullable: true },
          { name: "ShipCountry", type: "NVARCHAR(15)", pk: false, fk: false, nullable: true },
        ],
        relations: ["Customers", "Employees", "Shippers", "OrderDetails"],
      },
      {
        name: "OrderDetails",
        description: "Line items within each order",
        color: "red",
        columns: [
          { name: "OrderID", type: "INTEGER", pk: true, fk: true, nullable: false, ref: "Orders" },
          { name: "ProductID", type: "INTEGER", pk: true, fk: true, nullable: false, ref: "Products" },
          { name: "UnitPrice", type: "MONEY", pk: false, fk: false, nullable: false },
          { name: "Quantity", type: "SMALLINT", pk: false, fk: false, nullable: false },
          { name: "Discount", type: "REAL", pk: false, fk: false, nullable: false },
        ],
        relations: ["Orders", "Products"],
      },
      {
        name: "Region",
        description: "Geographic sales regions",
        color: "teal",
        columns: [
          { name: "RegionID", type: "INTEGER", pk: true, fk: false, nullable: false },
          { name: "RegionDescription", type: "NCHAR(50)", pk: false, fk: false, nullable: false },
        ],
        relations: ["Territories"],
      },
      {
        name: "Territories",
        description: "Sales territories within regions",
        color: "teal",
        columns: [
          { name: "TerritoryID", type: "NVARCHAR(20)", pk: true, fk: false, nullable: false },
          { name: "TerritoryDescription", type: "NCHAR(50)", pk: false, fk: false, nullable: false },
          { name: "RegionID", type: "INTEGER", pk: false, fk: true, nullable: false, ref: "Region" },
        ],
        relations: ["Region", "EmployeeTerritories"],
      },
      {
        name: "EmployeeTerritories",
        description: "Junction: employees and territories",
        color: "indigo",
        columns: [
          { name: "EmployeeID", type: "INTEGER", pk: true, fk: true, nullable: false, ref: "Employees" },
          { name: "TerritoryID", type: "NVARCHAR(20)", pk: true, fk: true, nullable: false, ref: "Territories" },
        ],
        relations: ["Employees", "Territories"],
      },
    ],
  },
};

// ─── Color Maps ───────────────────────────────────────────────────────────────

const COLOR_MAP = {
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", dot: "bg-purple-400", header: "from-purple-500/20 to-purple-500/5" },
  blue:   { bg: "bg-blue-500/10",   border: "border-blue-500/30",   text: "text-blue-400",   dot: "bg-blue-400",   header: "from-blue-500/20 to-blue-500/5"   },
  green:  { bg: "bg-emerald-500/10",border: "border-emerald-500/30",text: "text-emerald-400",dot: "bg-emerald-400",header: "from-emerald-500/20 to-emerald-500/5"},
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", dot: "bg-orange-400", header: "from-orange-500/20 to-orange-500/5" },
  pink:   { bg: "bg-pink-500/10",   border: "border-pink-500/30",   text: "text-pink-400",   dot: "bg-pink-400",   header: "from-pink-500/20 to-pink-500/5"   },
  teal:   { bg: "bg-teal-500/10",   border: "border-teal-500/30",   text: "text-teal-400",   dot: "bg-teal-400",   header: "from-teal-500/20 to-teal-500/5"   },
  indigo: { bg: "bg-indigo-500/10", border: "border-indigo-500/30", text: "text-indigo-400", dot: "bg-indigo-400", header: "from-indigo-500/20 to-indigo-500/5" },
  amber:  { bg: "bg-amber-500/10",  border: "border-amber-500/30",  text: "text-amber-400",  dot: "bg-amber-400",  header: "from-amber-500/20 to-amber-500/5"  },
  red:    { bg: "bg-rose-500/10",   border: "border-rose-500/30",   text: "text-rose-400",   dot: "bg-rose-400",   header: "from-rose-500/20 to-rose-500/5"   },
};

function getTypeIcon(type) {
  const t = type.toUpperCase();
  if (t.includes("INT") || t.includes("NUMERIC") || t.includes("MONEY") || t.includes("REAL") || t.includes("SMALLINT")) return <Hash className="w-3 h-3" />;
  if (t.includes("DATETIME") || t.includes("DATE")) return <Calendar className="w-3 h-3" />;
  if (t.includes("BIT")) return <ToggleLeft className="w-3 h-3" />;
  return <Type className="w-3 h-3" />;
}

// ─── Table Card ───────────────────────────────────────────────────────────────

function TableCard({ table, isExpanded, onToggle, searchTerm }) {
  const colors = COLOR_MAP[table.color] || COLOR_MAP.purple;
  const filteredColumns = table.columns.filter(
    (col) =>
      !searchTerm ||
      col.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      col.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`rounded-xl border ${colors.border} overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-black/10`}>
      {/* Table Header */}
      <button
        onClick={onToggle}
        className={`w-full text-left px-5 py-4 bg-gradient-to-r ${colors.header} flex items-center gap-3 group`}
      >
        <div className={`w-8 h-8 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
          <Table2 className={`w-4 h-4 ${colors.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{table.name}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
              {table.columns.length} cols
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{table.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {table.relations.length > 0 && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
              <Link className="w-3 h-3" />
              {table.relations.length} rel
            </span>
          )}
          {isExpanded
            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground" />
          }
        </div>
      </button>

      {/* Columns */}
      {isExpanded && (
        <div className="bg-card/50">
          {/* Column header */}
          <div className="px-5 py-2 border-b border-border/50 grid grid-cols-12 gap-2">
            <span className="col-span-5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Column</span>
            <span className="col-span-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Type</span>
            <span className="col-span-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Flags</span>
          </div>
          {filteredColumns.map((col, idx) => (
            <div
              key={col.name}
              className={`px-5 py-2.5 grid grid-cols-12 gap-2 items-center border-b border-border/30 last:border-0 transition-colors hover:bg-secondary/30 ${idx % 2 === 0 ? "" : "bg-secondary/10"}`}
            >
              {/* Column name */}
              <div className="col-span-5 flex items-center gap-2 min-w-0">
                {col.pk && (
                  <div title="Primary Key" className="flex-shrink-0">
                    <Key className="w-3 h-3 text-amber-400" />
                  </div>
                )}
                {col.fk && !col.pk && (
                  <div title={`Foreign Key → ${col.ref}`} className="flex-shrink-0">
                    <Link className="w-3 h-3 text-blue-400" />
                  </div>
                )}
                {!col.pk && !col.fk && <div className="w-3 h-3 flex-shrink-0" />}
                <span className={`text-[12px] font-medium truncate ${col.pk ? "text-amber-300" : col.fk ? "text-blue-300" : "text-foreground"}`}>
                  {col.name}
                </span>
              </div>

              {/* Type */}
              <div className="col-span-4 flex items-center gap-1.5 min-w-0">
                <span className="text-muted-foreground">{getTypeIcon(col.type)}</span>
                <span className="text-[11px] font-mono text-muted-foreground truncate">{col.type}</span>
              </div>

              {/* Flags */}
              <div className="col-span-3 flex items-center gap-1 flex-wrap">
                {col.pk && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">PK</span>
                )}
                {col.fk && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30" title={col.ref}>
                    FK
                  </span>
                )}
                {col.nullable && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border">NULL</span>
                )}
              </div>
            </div>
          ))}

          {/* Relations */}
          {table.relations.length > 0 && (
            <div className="px-5 py-3 bg-secondary/20 border-t border-border/30 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Relations:</span>
              {table.relations.map((rel) => (
                <span key={rel} className="text-[10px] px-2 py-0.5 rounded-full bg-card border border-border text-muted-foreground font-medium">
                  ↔ {rel}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExploreSchema({ database = "chinook" }) {
  const [expandedTables, setExpandedTables] = useState(new Set(["Artist", "Categories"]));
  const [searchTerm, setSearchTerm] = useState("");

  const db = getDatabaseById(database);
  const schemaData = SCHEMA_DATA[database] || SCHEMA_DATA.chinook;

  const filteredTables = schemaData.tables.filter(
    (table) =>
      !searchTerm ||
      table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.columns.some((col) => col.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleTable = (name) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const expandAll = () => setExpandedTables(new Set(schemaData.tables.map((t) => t.name)));
  const collapseAll = () => setExpandedTables(new Set());

  const totalColumns = schemaData.tables.reduce((sum, t) => sum + t.columns.length, 0);
  const totalRelations = schemaData.tables.reduce((sum, t) => sum + t.relations.length, 0) / 2;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-5 border-b border-border">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">Schema Explorer</h1>
              <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold rounded-full">
                {db.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{db.description} — {schemaData.tables.length} tables, {totalColumns} columns, ~{Math.round(totalRelations)} relationships</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Tables", value: schemaData.tables.length, color: "text-primary" },
            { label: "Columns", value: totalColumns, color: "text-emerald-400" },
            { label: "Relations", value: Math.round(totalRelations), color: "text-amber-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-secondary/50 border border-border rounded-xl px-4 py-3 text-center">
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search + controls */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-secondary/60 border border-border rounded-xl px-4 py-2.5 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Search tables or columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
            />
          </div>
          <button onClick={expandAll} className="px-3 py-2 text-xs font-medium text-muted-foreground border border-border rounded-lg hover:bg-secondary transition-colors whitespace-nowrap">
            Expand All
          </button>
          <button onClick={collapseAll} className="px-3 py-2 text-xs font-medium text-muted-foreground border border-border rounded-lg hover:bg-secondary transition-colors whitespace-nowrap">
            Collapse
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="px-8 py-3 border-b border-border flex items-center gap-5 flex-wrap bg-secondary/20">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Legend:</span>
        <div className="flex items-center gap-1.5">
          <Key className="w-3 h-3 text-amber-400" />
          <span className="text-[11px] text-muted-foreground">Primary Key</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Link className="w-3 h-3 text-blue-400" />
          <span className="text-[11px] text-muted-foreground">Foreign Key</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border">NULL</span>
          <span className="text-[11px] text-muted-foreground">Nullable</span>
        </div>
      </div>

      {/* Tables list */}
      <div className="flex-1 overflow-y-auto px-8 py-5">
        {filteredTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <Database className="w-10 h-10 opacity-30" />
            <p className="text-sm">No tables match your search</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTables.map((table) => (
              <TableCard
                key={table.name}
                table={table}
                isExpanded={expandedTables.has(table.name)}
                onToggle={() => toggleTable(table.name)}
                searchTerm={searchTerm}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}