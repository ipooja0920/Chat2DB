import React, { useState, useEffect } from "react";
import { Database, Key, Link, Search, Table2, Hash, Type, Calendar, ToggleLeft, GitFork, Maximize2 } from "lucide-react";
import { getDatabaseById } from "@/lib/queryEngine";

// ─── Schema Data ──────────────────────────────────────────────────────────────

const SCHEMA_DATA = {
  chinook: {
    tables: [
      {
        name: "Artist", description: "Music artists and bands", rows: 275, color: "purple",
        columns: [
          { name: "ArtistId", type: "INTEGER", pk: true, fk: false, nullable: false, desc: "Unique artist identifier" },
          { name: "Name", type: "NVARCHAR(120)", pk: false, fk: false, nullable: true, desc: "Artist or band name" },
        ],
        relations: [],
      },
      {
        name: "Album", description: "Music albums released by artists", rows: 347, color: "blue",
        columns: [
          { name: "AlbumId", type: "INTEGER", pk: true, fk: false, nullable: false, desc: "Unique album identifier" },
          { name: "Title", type: "NVARCHAR(160)", pk: false, fk: false, nullable: false, desc: "Album title" },
          { name: "ArtistId", type: "INTEGER", pk: false, fk: true, nullable: false, desc: "References Artist", ref: "Artist" },
        ],
        relations: [{ from: "ArtistId", to: "Artist", toCol: "ArtistId", type: "many-to-one" }],
      },
      {
        name: "Genre", description: "Music genre classifications", rows: 25, color: "green",
        columns: [
          { name: "GenreId", type: "INTEGER", pk: true, fk: false, nullable: false, desc: "Unique genre identifier" },
          { name: "Name", type: "NVARCHAR(120)", pk: false, fk: false, nullable: true, desc: "Genre name" },
        ],
        relations: [],
      },
      {
        name: "MediaType", description: "Audio/video media formats", rows: 5, color: "orange",
        columns: [
          { name: "MediaTypeId", type: "INTEGER", pk: true, fk: false, nullable: false, desc: "Unique media type identifier" },
          { name: "Name", type: "NVARCHAR(120)", pk: false, fk: false, nullable: true, desc: "Media format name" },
        ],
        relations: [],
      },
      {
        name: "Track", description: "Individual music tracks", rows: 3500, color: "pink",
        columns: [
          { name: "TrackId", type: "INTEGER", pk: true, fk: false, nullable: false, desc: "Unique track identifier" },
          { name: "Name", type: "NVARCHAR(200)", pk: false, fk: false, nullable: false, desc: "Track name" },
          { name: "AlbumId", type: "INTEGER", pk: false, fk: true, nullable: true, desc: "References Album", ref: "Album" },
          { name: "MediaTypeId", type: "INTEGER", pk: false, fk: true, nullable: false, desc: "References MediaType", ref: "MediaType" },
          { name: "GenreId", type: "INTEGER", pk: false, fk: true, nullable: true, desc: "References Genre", ref: "Genre" },
          { name: "Composer", type: "NVARCHAR(220)", pk: false, fk: false, nullable: true, desc: "Composer name" },
          { name: "Milliseconds", type: "INTEGER", pk: false, fk: false, nullable: false, desc: "Track duration in ms" },
          { name: "Bytes", type: "INTEGER", pk: false, fk: false, nullable: true, desc: "File size in bytes" },
          { name: "UnitPrice", type: "NUMERIC(10,2)", pk: false, fk: false, nullable: false, desc: "Price per track" },
        ],
        relations: [
          { from: "AlbumId", to: "Album", toCol: "AlbumId", type: "many-to-one" },
          { from: "MediaTypeId", to: "MediaType", toCol: "MediaTypeId", type: "many-to-one" },
          { from: "GenreId", to: "Genre", toCol: "GenreId", type: "many-to-one" },
        ],
      },
      {
        name: "Playlist", description: "User-created playlists", rows: 18, color: "teal",
        columns: [
          { name: "PlaylistId", type: "INTEGER", pk: true, fk: false, nullable: false, desc: "Unique playlist identifier" },
          { name: "Name", type: "NVARCHAR(120)", pk: false, fk: false, nullable: true, desc: "Playlist name" },
        ],
        relations: [],
      },
      {
        name: "PlaylistTrack", description: "Junction: playlists ↔ tracks", rows: 8715, color: "teal",
        columns: [
          { name: "PlaylistId", type: "INTEGER", pk: true, fk: true, nullable: false, desc: "References Playlist", ref: "Playlist" },
          { name: "TrackId", type: "INTEGER", pk: true, fk: true, nullable: false, desc: "References Track", ref: "Track" },
        ],
        relations: [
          { from: "PlaylistId", to: "Playlist", toCol: "PlaylistId", type: "many-to-one" },
          { from: "TrackId", to: "Track", toCol: "TrackId", type: "many-to-one" },
        ],
      },
      {
        name: "Employee", description: "Store staff and management", rows: 8, color: "indigo",
        columns: [
          { name: "EmployeeId", type: "INTEGER", pk: true, fk: false, nullable: false, desc: "Unique employee identifier" },
          { name: "LastName", type: "NVARCHAR(20)", pk: false, fk: false, nullable: false, desc: "Last name" },
          { name: "FirstName", type: "NVARCHAR(20)", pk: false, fk: false, nullable: false, desc: "First name" },
          { name: "Title", type: "NVARCHAR(30)", pk: false, fk: false, nullable: true, desc: "Job title" },
          { name: "ReportsTo", type: "INTEGER", pk: false, fk: true, nullable: true, desc: "Manager employee ID", ref: "Employee" },
          { name: "BirthDate", type: "DATETIME", pk: false, fk: false, nullable: true, desc: "Date of birth" },
          { name: "HireDate", type: "DATETIME", pk: false, fk: false, nullable: true, desc: "Date hired" },
          { name: "Email", type: "NVARCHAR(60)", pk: false, fk: false, nullable: true, desc: "Email address" },
          { name: "Phone", type: "NVARCHAR(24)", pk: false, fk: false, nullable: true, desc: "Phone number" },
          { name: "City", type: "NVARCHAR(40)", pk: false, fk: false, nullable: true, desc: "City of residence" },
          { name: "Country", type: "NVARCHAR(40)", pk: false, fk: false, nullable: true, desc: "Country" },
        ],
        relations: [{ from: "ReportsTo", to: "Employee", toCol: "EmployeeId", type: "self" }],
      },
      {
        name: "Customer", description: "Store customers worldwide", rows: 59, color: "amber",
        columns: [
          { name: "CustomerId", type: "INTEGER", pk: true, fk: false, nullable: false, desc: "Unique customer identifier" },
          { name: "FirstName", type: "NVARCHAR(40)", pk: false, fk: false, nullable: false, desc: "First name" },
          { name: "LastName", type: "NVARCHAR(20)", pk: false, fk: false, nullable: false, desc: "Last name" },
          { name: "Company", type: "NVARCHAR(80)", pk: false, fk: false, nullable: true, desc: "Company name" },
          { name: "Email", type: "NVARCHAR(60)", pk: false, fk: false, nullable: false, desc: "Email address" },
          { name: "Phone", type: "NVARCHAR(24)", pk: false, fk: false, nullable: true, desc: "Phone number" },
          { name: "City", type: "NVARCHAR(40)", pk: false, fk: false, nullable: true, desc: "City" },
          { name: "Country", type: "NVARCHAR(40)", pk: false, fk: false, nullable: true, desc: "Country" },
          { name: "SupportRepId", type: "INTEGER", pk: false, fk: true, nullable: true, desc: "Assigned support employee", ref: "Employee" },
        ],
        relations: [{ from: "SupportRepId", to: "Employee", toCol: "EmployeeId", type: "many-to-one" }],
      },
      {
        name: "Invoice", description: "Customer purchase invoices", rows: 412, color: "red",
        columns: [
          { name: "InvoiceId", type: "INTEGER", pk: true, fk: false, nullable: false, desc: "Unique invoice identifier" },
          { name: "CustomerId", type: "INTEGER", pk: false, fk: true, nullable: false, desc: "References Customer", ref: "Customer" },
          { name: "InvoiceDate", type: "DATETIME", pk: false, fk: false, nullable: false, desc: "Invoice date" },
          { name: "BillingAddress", type: "NVARCHAR(70)", pk: false, fk: false, nullable: true, desc: "Billing address" },
          { name: "BillingCity", type: "NVARCHAR(40)", pk: false, fk: false, nullable: true, desc: "Billing city" },
          { name: "BillingCountry", type: "NVARCHAR(40)", pk: false, fk: false, nullable: true, desc: "Billing country" },
          { name: "Total", type: "NUMERIC(10,2)", pk: false, fk: false, nullable: false, desc: "Total invoice amount" },
        ],
        relations: [{ from: "CustomerId", to: "Customer", toCol: "CustomerId", type: "many-to-one" }],
      },
      {
        name: "InvoiceLine", description: "Line items on each invoice", rows: 2240, color: "red",
        columns: [
          { name: "InvoiceLineId", type: "INTEGER", pk: true, fk: false, nullable: false, desc: "Unique line item identifier" },
          { name: "InvoiceId", type: "INTEGER", pk: false, fk: true, nullable: false, desc: "References Invoice", ref: "Invoice" },
          { name: "TrackId", type: "INTEGER", pk: false, fk: true, nullable: false, desc: "References Track", ref: "Track" },
          { name: "UnitPrice", type: "NUMERIC(10,2)", pk: false, fk: false, nullable: false, desc: "Price at time of purchase" },
          { name: "Quantity", type: "INTEGER", pk: false, fk: false, nullable: false, desc: "Quantity purchased" },
        ],
        relations: [
          { from: "InvoiceId", to: "Invoice", toCol: "InvoiceId", type: "many-to-one" },
          { from: "TrackId", to: "Track", toCol: "TrackId", type: "many-to-one" },
        ],
      },
    ],
  },
  northwind: {
    tables: [
      {
        name: "Categories", description: "Product category classifications", rows: 8, color: "green",
        columns: [
          { name: "CategoryID", type: "INTEGER", pk: true, fk: false, nullable: false, desc: "Unique category identifier" },
          { name: "CategoryName", type: "NVARCHAR(15)", pk: false, fk: false, nullable: false, desc: "Category name" },
          { name: "Description", type: "NTEXT", pk: false, fk: false, nullable: true, desc: "Category description" },
        ],
        relations: [],
      },
      {
        name: "Suppliers", description: "Product suppliers and vendors", rows: 29, color: "blue",
        columns: [
          { name: "SupplierID", type: "INTEGER", pk: true, fk: false, nullable: false, desc: "Unique supplier identifier" },
          { name: "CompanyName", type: "NVARCHAR(40)", pk: false, fk: false, nullable: false, desc: "Company name" },
          { name: "ContactName", type: "NVARCHAR(30)", pk: false, fk: false, nullable: true, desc: "Contact person name" },
          { name: "Country", type: "NVARCHAR(15)", pk: false, fk: false, nullable: true, desc: "Country" },
          { name: "Phone", type: "NVARCHAR(24)", pk: false, fk: false, nullable: true, desc: "Phone number" },
        ],
        relations: [],
      },
      {
        name: "Products", description: "Catalog of all available products", rows: 77, color: "purple",
        columns: [
          { name: "ProductID", type: "INTEGER", pk: true, fk: false, nullable: false, desc: "Unique product identifier" },
          { name: "ProductName", type: "NVARCHAR(40)", pk: false, fk: false, nullable: false, desc: "Product name" },
          { name: "SupplierID", type: "INTEGER", pk: false, fk: true, nullable: true, desc: "References Suppliers", ref: "Suppliers" },
          { name: "CategoryID", type: "INTEGER", pk: false, fk: true, nullable: true, desc: "References Categories", ref: "Categories" },
          { name: "QuantityPerUnit", type: "NVARCHAR(20)", pk: false, fk: false, nullable: true, desc: "Quantity description" },
          { name: "UnitPrice", type: "MONEY", pk: false, fk: false, nullable: true, desc: "Price per unit" },
          { name: "UnitsInStock", type: "SMALLINT", pk: false, fk: false, nullable: true, desc: "Current stock level" },
          { name: "UnitsOnOrder", type: "SMALLINT", pk: false, fk: false, nullable: true, desc: "Units on order" },
          { name: "Discontinued", type: "BIT", pk: false, fk: false, nullable: false, desc: "Whether discontinued" },
        ],
        relations: [
          { from: "SupplierID", to: "Suppliers", toCol: "SupplierID", type: "many-to-one" },
          { from: "CategoryID", to: "Categories", toCol: "CategoryID", type: "many-to-one" },
        ],
      },
      {
        name: "Shippers", description: "Shipping companies for delivery", rows: 3, color: "orange",
        columns: [
          { name: "ShipperID", type: "INTEGER", pk: true, fk: false, nullable: false, desc: "Unique shipper identifier" },
          { name: "CompanyName", type: "NVARCHAR(40)", pk: false, fk: false, nullable: false, desc: "Shipping company name" },
          { name: "Phone", type: "NVARCHAR(24)", pk: false, fk: false, nullable: true, desc: "Phone number" },
        ],
        relations: [],
      },
      {
        name: "Customers", description: "Retail customers placing orders", rows: 91, color: "amber",
        columns: [
          { name: "CustomerID", type: "NCHAR(5)", pk: true, fk: false, nullable: false, desc: "Unique customer code" },
          { name: "CompanyName", type: "NVARCHAR(40)", pk: false, fk: false, nullable: false, desc: "Company name" },
          { name: "ContactName", type: "NVARCHAR(30)", pk: false, fk: false, nullable: true, desc: "Contact person" },
          { name: "Country", type: "NVARCHAR(15)", pk: false, fk: false, nullable: true, desc: "Country" },
          { name: "Phone", type: "NVARCHAR(24)", pk: false, fk: false, nullable: true, desc: "Phone number" },
        ],
        relations: [],
      },
      {
        name: "Employees", description: "Staff handling orders and territories", rows: 9, color: "indigo",
        columns: [
          { name: "EmployeeID", type: "INTEGER", pk: true, fk: false, nullable: false, desc: "Unique employee identifier" },
          { name: "LastName", type: "NVARCHAR(20)", pk: false, fk: false, nullable: false, desc: "Last name" },
          { name: "FirstName", type: "NVARCHAR(10)", pk: false, fk: false, nullable: false, desc: "First name" },
          { name: "Title", type: "NVARCHAR(30)", pk: false, fk: false, nullable: true, desc: "Job title" },
          { name: "ReportsTo", type: "INTEGER", pk: false, fk: true, nullable: true, desc: "Manager employee ID", ref: "Employees" },
          { name: "HireDate", type: "DATETIME", pk: false, fk: false, nullable: true, desc: "Date hired" },
          { name: "Country", type: "NVARCHAR(15)", pk: false, fk: false, nullable: true, desc: "Country" },
        ],
        relations: [{ from: "ReportsTo", to: "Employees", toCol: "EmployeeID", type: "self" }],
      },
      {
        name: "Orders", description: "Customer purchase orders", rows: 830, color: "red",
        columns: [
          { name: "OrderID", type: "INTEGER", pk: true, fk: false, nullable: false, desc: "Unique order identifier" },
          { name: "CustomerID", type: "NCHAR(5)", pk: false, fk: true, nullable: true, desc: "References Customers", ref: "Customers" },
          { name: "EmployeeID", type: "INTEGER", pk: false, fk: true, nullable: true, desc: "References Employees", ref: "Employees" },
          { name: "OrderDate", type: "DATETIME", pk: false, fk: false, nullable: true, desc: "Date order placed" },
          { name: "RequiredDate", type: "DATETIME", pk: false, fk: false, nullable: true, desc: "Date required by" },
          { name: "ShippedDate", type: "DATETIME", pk: false, fk: false, nullable: true, desc: "Date shipped" },
          { name: "ShipVia", type: "INTEGER", pk: false, fk: true, nullable: true, desc: "References Shippers", ref: "Shippers" },
          { name: "Freight", type: "MONEY", pk: false, fk: false, nullable: true, desc: "Freight charge" },
          { name: "ShipCountry", type: "NVARCHAR(15)", pk: false, fk: false, nullable: true, desc: "Destination country" },
        ],
        relations: [
          { from: "CustomerID", to: "Customers", toCol: "CustomerID", type: "many-to-one" },
          { from: "EmployeeID", to: "Employees", toCol: "EmployeeID", type: "many-to-one" },
          { from: "ShipVia", to: "Shippers", toCol: "ShipperID", type: "many-to-one" },
        ],
      },
      {
        name: "OrderDetails", description: "Line items within each order", rows: 2155, color: "red",
        columns: [
          { name: "OrderID", type: "INTEGER", pk: true, fk: true, nullable: false, desc: "References Orders", ref: "Orders" },
          { name: "ProductID", type: "INTEGER", pk: true, fk: true, nullable: false, desc: "References Products", ref: "Products" },
          { name: "UnitPrice", type: "MONEY", pk: false, fk: false, nullable: false, desc: "Price per unit" },
          { name: "Quantity", type: "SMALLINT", pk: false, fk: false, nullable: false, desc: "Quantity ordered" },
          { name: "Discount", type: "REAL", pk: false, fk: false, nullable: false, desc: "Discount percentage" },
        ],
        relations: [
          { from: "OrderID", to: "Orders", toCol: "OrderID", type: "many-to-one" },
          { from: "ProductID", to: "Products", toCol: "ProductID", type: "many-to-one" },
        ],
      },
      {
        name: "Region", description: "Geographic sales regions", rows: 4, color: "teal",
        columns: [
          { name: "RegionID", type: "INTEGER", pk: true, fk: false, nullable: false, desc: "Unique region identifier" },
          { name: "RegionDescription", type: "NCHAR(50)", pk: false, fk: false, nullable: false, desc: "Region name" },
        ],
        relations: [],
      },
      {
        name: "Territories", description: "Sales territories within regions", rows: 53, color: "teal",
        columns: [
          { name: "TerritoryID", type: "NVARCHAR(20)", pk: true, fk: false, nullable: false, desc: "Unique territory identifier" },
          { name: "TerritoryDescription", type: "NCHAR(50)", pk: false, fk: false, nullable: false, desc: "Territory name" },
          { name: "RegionID", type: "INTEGER", pk: false, fk: true, nullable: false, desc: "References Region", ref: "Region" },
        ],
        relations: [{ from: "RegionID", to: "Region", toCol: "RegionID", type: "many-to-one" }],
      },
      {
        name: "EmployeeTerritories", description: "Junction: employees ↔ territories", rows: 49, color: "indigo",
        columns: [
          { name: "EmployeeID", type: "INTEGER", pk: true, fk: true, nullable: false, desc: "References Employees", ref: "Employees" },
          { name: "TerritoryID", type: "NVARCHAR(20)", pk: true, fk: true, nullable: false, desc: "References Territories", ref: "Territories" },
        ],
        relations: [
          { from: "EmployeeID", to: "Employees", toCol: "EmployeeID", type: "many-to-one" },
          { from: "TerritoryID", to: "Territories", toCol: "TerritoryID", type: "many-to-one" },
        ],
      },
    ],
  },
};

const COLOR_MAP = {
  purple: { dot: "bg-purple-400", text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", header: "bg-purple-500/20" },
  blue:   { dot: "bg-blue-400",   text: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30",   header: "bg-blue-500/20"   },
  green:  { dot: "bg-emerald-400",text: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/30",header: "bg-emerald-500/20" },
  orange: { dot: "bg-orange-400", text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", header: "bg-orange-500/20" },
  pink:   { dot: "bg-pink-400",   text: "text-pink-400",   bg: "bg-pink-500/10",   border: "border-pink-500/30",   header: "bg-pink-500/20"   },
  teal:   { dot: "bg-teal-400",   text: "text-teal-400",   bg: "bg-teal-500/10",   border: "border-teal-500/30",   header: "bg-teal-500/20"   },
  indigo: { dot: "bg-indigo-400", text: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/30", header: "bg-indigo-500/20" },
  amber:  { dot: "bg-amber-400",  text: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/30",  header: "bg-amber-500/20"  },
  red:    { dot: "bg-rose-400",   text: "text-rose-400",   bg: "bg-rose-500/10",   border: "border-rose-500/30",   header: "bg-rose-500/20"   },
};

function formatRows(n) {
  if (n >= 1000) return `~${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function getTypeIcon(type) {
  const t = type.toUpperCase();
  if (t.includes("INT") || t.includes("NUMERIC") || t.includes("MONEY") || t.includes("REAL") || t.includes("SMALLINT")) return <Hash className="w-3 h-3" />;
  if (t.includes("DATETIME") || t.includes("DATE")) return <Calendar className="w-3 h-3" />;
  if (t.includes("BIT")) return <ToggleLeft className="w-3 h-3" />;
  return <Type className="w-3 h-3" />;
}

// ─── Relationship Diagram ─────────────────────────────────────────────────────

function RelationshipDiagram({ table, allTables }) {
  if (!table) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
      <GitFork className="w-8 h-8 opacity-30" />
      <p className="text-sm">Select a table to view relationships</p>
    </div>
  );

  const relatedNames = new Set([
    ...table.relations.map((r) => r.to),
    ...allTables.filter((t) => t.name !== table.name && t.relations.some((r) => r.to === table.name)).map((t) => t.name),
  ]);

  const relatedTables = allTables.filter((t) => relatedNames.has(t.name));

  return (
    <div className="flex flex-col gap-3 p-2 overflow-auto h-full">
      {/* Center: selected table */}
      <div className="flex justify-center">
        <RelCard table={table} isCenter allTables={allTables} />
      </div>

      {relatedTables.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider px-2">Related Tables</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {relatedTables.map((t) => (
              <RelCard key={t.name} table={t} allTables={allTables} />
            ))}
          </div>
        </>
      )}

      {/* Legend */}
      <div className="mt-auto pt-3 border-t border-border flex items-center gap-4 flex-wrap justify-center">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="font-mono text-xs">—1</span> One
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="font-mono text-xs">∞</span> Many
        </div>
        <div className="flex items-center gap-1.5">
          <Key className="w-3 h-3 text-amber-400" />
          <span className="text-[11px] text-muted-foreground">Primary Key</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Link className="w-3 h-3 text-blue-400" />
          <span className="text-[11px] text-muted-foreground">Foreign Key</span>
        </div>
      </div>
    </div>
  );
}

function RelCard({ table, isCenter, allTables }) {
  const colors = COLOR_MAP[table.color] || COLOR_MAP.purple;
  const pkCol = table.columns.find((c) => c.pk);
  const fkCols = table.columns.filter((c) => c.fk);
  const previewCols = table.columns.slice(0, 5);

  return (
    <div className={`rounded-xl border ${isCenter ? `${colors.border} shadow-lg shadow-black/20` : "border-border"} overflow-hidden min-w-[160px] max-w-[200px] flex-shrink-0`}>
      <div className={`px-3 py-2 ${isCenter ? colors.header : "bg-secondary/60"} flex items-center gap-2`}>
        <Table2 className={`w-3.5 h-3.5 ${isCenter ? colors.text : "text-muted-foreground"}`} />
        <span className={`text-[12px] font-bold ${isCenter ? colors.text : "text-foreground"}`}>{table.name}</span>
      </div>
      <div className="bg-card/80 px-3 py-2 space-y-1">
        {previewCols.map((col) => (
          <div key={col.name} className="flex items-center gap-1.5">
            {col.pk ? <Key className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" /> :
             col.fk ? <Link className="w-2.5 h-2.5 text-blue-400 flex-shrink-0" /> :
             <div className="w-2.5 h-2.5 flex-shrink-0" />}
            <span className={`text-[11px] truncate ${col.pk ? "text-amber-300 font-semibold" : col.fk ? "text-blue-300" : "text-muted-foreground"}`}>
              {col.name}
            </span>
          </div>
        ))}
        {table.columns.length > 5 && (
          <div className="text-[10px] text-muted-foreground/50 pl-4">+{table.columns.length - 5} more...</div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ExploreSchema({ database = "chinook" }) {
  const schemaData = SCHEMA_DATA[database] || SCHEMA_DATA.chinook;
  const db = getDatabaseById(database);

  const [search, setSearch] = useState("");
  const [selectedTable, setSelectedTable] = useState(schemaData.tables[0]);

  // Reset selected table when DB changes
  useEffect(() => {
    const newSchema = SCHEMA_DATA[database] || SCHEMA_DATA.chinook;
    setSelectedTable(newSchema.tables[0]);
    setSearch("");
  }, [database]);

  const totalColumns = schemaData.tables.reduce((s, t) => s + t.columns.length, 0);
  const totalRelations = schemaData.tables.reduce((s, t) => s + t.relations.length, 0);
  const totalRows = schemaData.tables.reduce((s, t) => s + t.rows, 0);

  const filteredTables = schemaData.tables.filter((t) =>
    !search || t.name.toLowerCase().includes(search.toLowerCase())
  );

  const pkCol = selectedTable?.columns.find((c) => c.pk);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-4 gap-px bg-border border-b border-border flex-shrink-0">
        {[
          { icon: <Table2 className="w-5 h-5 text-primary" />, bg: "bg-primary/10", value: schemaData.tables.length, label: "Tables", sub: "View all tables →" },
          { icon: <Hash className="w-5 h-5 text-emerald-400" />, bg: "bg-emerald-500/10", value: totalColumns, label: "Columns", sub: "Across all tables" },
          { icon: <GitFork className="w-5 h-5 text-blue-400" />, bg: "bg-blue-500/10", value: totalRelations, label: "Relationships", sub: "Foreign keys" },
          { icon: <Database className="w-5 h-5 text-amber-400" />, bg: "bg-amber-500/10", value: formatRows(totalRows), label: "Total Rows", sub: "Approximate" },
        ].map((s) => (
          <div key={s.label} className="bg-card px-6 py-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              {s.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs font-semibold text-foreground">{s.label}</div>
              <div className="text-[10px] text-muted-foreground">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3-Panel Layout ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Panel 1: Table List */}
        <div className="w-52 flex-shrink-0 border-r border-border flex flex-col bg-card/50">
          <div className="px-4 pt-4 pb-3 border-b border-border">
            <h2 className="text-sm font-bold text-foreground mb-3">
              Tables ({schemaData.tables.length})
            </h2>
            <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 border border-border">
              <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder="Search tables..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {filteredTables.map((table) => {
              const colors = COLOR_MAP[table.color] || COLOR_MAP.purple;
              const isActive = selectedTable?.name === table.name;
              return (
                <button
                  key={table.name}
                  onClick={() => setSelectedTable(table)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors group ${
                    isActive ? "bg-primary/10 border-r-2 border-primary" : "hover:bg-secondary/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                    <span className={`text-[13px] font-medium truncate ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                      {table.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-1">{formatRows(table.rows)}</span>
                </button>
              );
            })}
          </div>
          <div className="px-4 py-3 border-t border-border">
            <button className="w-full flex items-center justify-center gap-2 text-[11px] text-primary font-medium hover:text-primary/80 transition-colors">
              <GitFork className="w-3 h-3" />
              View All Relationships
            </button>
          </div>
        </div>

        {/* Panel 2: Table Details */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-border min-w-0">
          {selectedTable ? (
            <>
              {/* Details header */}
              <div className="px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-base font-bold text-foreground">Table Details</h2>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${COLOR_MAP[selectedTable.color]?.bg} ${COLOR_MAP[selectedTable.color]?.text} border ${COLOR_MAP[selectedTable.color]?.border}`}>
                    {selectedTable.name}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">{selectedTable.description}</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                      <Hash className="w-3 h-3" /> Columns
                    </div>
                    <div className="text-xl font-bold text-foreground">{selectedTable.columns.length}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                      <Key className="w-3 h-3 text-amber-400" /> Primary Key
                    </div>
                    <div className="text-sm font-bold text-amber-300">{pkCol?.name || "—"}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                      <Database className="w-3 h-3" /> Rows (approx.)
                    </div>
                    <div className="text-xl font-bold text-foreground">{selectedTable.rows.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Column table */}
              <div className="flex-1 overflow-auto">
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-secondary/80 backdrop-blur border-b border-border">
                      <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">Column Name</th>
                      <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Data Type</th>
                      <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Nullable</th>
                      <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTable.columns.map((col, idx) => (
                      <tr
                        key={col.name}
                        className={`border-b border-border/40 hover:bg-secondary/30 transition-colors ${idx % 2 === 0 ? "" : "bg-secondary/10"}`}
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            {col.pk && <Key className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                            {col.fk && !col.pk && <Link className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                            <span className={`text-[13px] font-semibold ${col.pk ? "text-amber-300" : col.fk ? "text-blue-300" : "text-foreground"}`}>
                              {col.name}
                            </span>
                            {col.pk && <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded font-bold">PK</span>}
                            {col.fk && <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded font-bold">FK</span>}
                          </div>
                          {col.ref && (
                            <div className="text-[10px] text-muted-foreground mt-0.5 pl-5 flex items-center gap-1">
                              <span>→</span> <span className="text-blue-400">{col.ref}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">{getTypeIcon(col.type)}</span>
                            <span className="text-[12px] font-mono text-muted-foreground">{col.type}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${col.nullable ? "bg-secondary text-muted-foreground" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                            {col.nullable ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[12px] text-muted-foreground">{col.desc}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Select a table from the list
            </div>
          )}
        </div>

        {/* Panel 3: Relationships */}
        <div className="w-72 flex-shrink-0 flex flex-col overflow-hidden bg-card/30">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
            <h2 className="text-sm font-bold text-foreground">Relationships Overview</h2>
            <Maximize2 className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" />
          </div>
          <div className="flex-1 overflow-auto p-4">
            <RelationshipDiagram table={selectedTable} allTables={schemaData.tables} />
          </div>
        </div>

      </div>
    </div>
  );
}