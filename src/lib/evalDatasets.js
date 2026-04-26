// ─── Eval Test Datasets (mirrors eval/data/eval_set.csv structure) ────────────
// Each entry: { question, expected_sql, expected_translatable, expected_cols, expected_rows }

export const EVAL_DATASETS = {
  chinook: [
    {
      question: "What is the total revenue by country?",
      expected_sql: "SELECT BillingCountry, SUM(Total) AS TotalRevenue FROM Invoice GROUP BY BillingCountry ORDER BY TotalRevenue DESC",
      expected_translatable: true,
      expected_cols: ["BillingCountry", "TotalRevenue"],
      expected_rows: [
        { BillingCountry: "USA", TotalRevenue: 523.06 },
        { BillingCountry: "Canada", TotalRevenue: 303.96 },
        { BillingCountry: "France", TotalRevenue: 195.1 },
      ]
    },
    {
      question: "Who are the top 5 customers by total spend?",
      expected_sql: "SELECT c.FirstName || ' ' || c.LastName AS CustomerName, SUM(i.Total) AS TotalSpend FROM Customer c JOIN Invoice i ON c.CustomerId = i.CustomerId GROUP BY c.CustomerId ORDER BY TotalSpend DESC LIMIT 5",
      expected_translatable: true,
      expected_cols: ["CustomerName", "TotalSpend"],
      expected_rows: [
        { CustomerName: "Helena Holý", TotalSpend: 49.62 },
        { CustomerName: "Richard Cunningham", TotalSpend: 47.62 },
      ]
    },
    {
      question: "What are the best selling genres by track count?",
      expected_sql: "SELECT g.Name AS Genre, COUNT(il.TrackId) AS TracksSold FROM InvoiceLine il JOIN Track t ON il.TrackId = t.TrackId JOIN Genre g ON t.GenreId = g.GenreId GROUP BY g.GenreId ORDER BY TracksSold DESC",
      expected_translatable: true,
      expected_cols: ["Genre", "TracksSold"],
      expected_rows: [
        { Genre: "Rock", TracksSold: 835 },
        { Genre: "Latin", TracksSold: 386 },
      ]
    },
    {
      question: "How many tracks are in each playlist?",
      expected_sql: "SELECT p.Name AS Playlist, COUNT(pt.TrackId) AS TrackCount FROM Playlist p LEFT JOIN PlaylistTrack pt ON p.PlaylistId = pt.PlaylistId GROUP BY p.PlaylistId ORDER BY TrackCount DESC",
      expected_translatable: true,
      expected_cols: ["Playlist", "TrackCount"],
      expected_rows: [
        { Playlist: "Music", TrackCount: 3290 },
        { Playlist: "Movies", TrackCount: 213 },
      ]
    },
    {
      question: "What is the average invoice total per country?",
      expected_sql: "SELECT BillingCountry, AVG(Total) AS AvgTotal FROM Invoice GROUP BY BillingCountry ORDER BY AvgTotal DESC",
      expected_translatable: true,
      expected_cols: ["BillingCountry", "AvgTotal"],
      expected_rows: [
        { BillingCountry: "Czech Republic", AvgTotal: 9.11 },
        { BillingCountry: "India", AvgTotal: 8.72 },
      ]
    },
    {
      question: "List all employees and who they report to",
      expected_sql: "SELECT e.FirstName || ' ' || e.LastName AS Employee, m.FirstName || ' ' || m.LastName AS Manager FROM Employee e LEFT JOIN Employee m ON e.ReportsTo = m.EmployeeId",
      expected_translatable: true,
      expected_cols: ["Employee", "Manager"],
      expected_rows: []
    },
    {
      question: "What is the color of the moon?",
      expected_sql: "",
      expected_translatable: false,
      expected_cols: [],
      expected_rows: []
    },
    {
      question: "Which artists have more than 10 albums?",
      expected_sql: "SELECT ar.Name AS Artist, COUNT(al.AlbumId) AS AlbumCount FROM Artist ar JOIN Album al ON ar.ArtistId = al.ArtistId GROUP BY ar.ArtistId HAVING COUNT(al.AlbumId) > 10 ORDER BY AlbumCount DESC",
      expected_translatable: true,
      expected_cols: ["Artist", "AlbumCount"],
      expected_rows: [
        { Artist: "Iron Maiden", AlbumCount: 21 },
        { Artist: "Led Zeppelin", AlbumCount: 14 },
      ]
    },
    {
      question: "What is the monthly revenue trend?",
      expected_sql: "SELECT strftime('%Y-%m', InvoiceDate) AS Month, SUM(Total) AS Revenue FROM Invoice GROUP BY Month ORDER BY Month",
      expected_translatable: true,
      expected_cols: ["Month", "Revenue"],
      expected_rows: []
    },
    {
      question: "Who is the CEO of Apple?",
      expected_sql: "",
      expected_translatable: false,
      expected_cols: [],
      expected_rows: []
    }
  ],
  northwind: [
    {
      question: "What are the top selling products by revenue?",
      expected_sql: "SELECT p.ProductName, SUM(od.UnitPrice * od.Quantity * (1 - od.Discount)) AS Revenue FROM Products p JOIN OrderDetails od ON p.ProductID = od.ProductID GROUP BY p.ProductID ORDER BY Revenue DESC",
      expected_translatable: true,
      expected_cols: ["ProductName", "Revenue"],
      expected_rows: [
        { ProductName: "Côte de Blaye", Revenue: 149984.2 },
        { ProductName: "Thüringer Rostbratwurst", Revenue: 87736.4 },
      ]
    },
    {
      question: "Which customers have the most orders?",
      expected_sql: "SELECT c.CompanyName, COUNT(o.OrderID) AS OrderCount FROM Customers c JOIN Orders o ON c.CustomerID = o.CustomerID GROUP BY c.CustomerID ORDER BY OrderCount DESC",
      expected_translatable: true,
      expected_cols: ["CompanyName", "OrderCount"],
      expected_rows: [
        { CompanyName: "Save-a-lot Markets", OrderCount: 31 },
        { CompanyName: "Ernst Handel", OrderCount: 30 },
      ]
    },
    {
      question: "What is the total revenue by country?",
      expected_sql: "SELECT c.Country, SUM(od.UnitPrice * od.Quantity * (1 - od.Discount)) AS Revenue FROM Customers c JOIN Orders o ON c.CustomerID = o.CustomerID JOIN OrderDetails od ON o.OrderID = od.OrderID GROUP BY c.Country ORDER BY Revenue DESC",
      expected_translatable: true,
      expected_cols: ["Country", "Revenue"],
      expected_rows: []
    },
    {
      question: "What are the most popular product categories?",
      expected_sql: "SELECT cat.CategoryName, COUNT(od.ProductID) AS TimesSold FROM Categories cat JOIN Products p ON cat.CategoryID = p.CategoryID JOIN OrderDetails od ON p.ProductID = od.ProductID GROUP BY cat.CategoryID ORDER BY TimesSold DESC",
      expected_translatable: true,
      expected_cols: ["CategoryName", "TimesSold"],
      expected_rows: [
        { CategoryName: "Beverages", TimesSold: 404 },
        { CategoryName: "Dairy Products", TimesSold: 367 },
      ]
    },
    {
      question: "Which employees have processed the most orders?",
      expected_sql: "SELECT e.FirstName || ' ' || e.LastName AS Employee, COUNT(o.OrderID) AS OrdersHandled FROM Employees e JOIN Orders o ON e.EmployeeID = o.EmployeeID GROUP BY e.EmployeeID ORDER BY OrdersHandled DESC",
      expected_translatable: true,
      expected_cols: ["Employee", "OrdersHandled"],
      expected_rows: []
    },
    {
      question: "What is the weather in New York today?",
      expected_sql: "",
      expected_translatable: false,
      expected_cols: [],
      expected_rows: []
    },
    {
      question: "List suppliers with more than 5 products",
      expected_sql: "SELECT s.CompanyName, COUNT(p.ProductID) AS ProductCount FROM Suppliers s JOIN Products p ON s.SupplierID = p.SupplierID GROUP BY s.SupplierID HAVING COUNT(p.ProductID) > 5 ORDER BY ProductCount DESC",
      expected_translatable: true,
      expected_cols: ["CompanyName", "ProductCount"],
      expected_rows: []
    },
    {
      question: "What products are discontinued?",
      expected_sql: "SELECT ProductName, UnitPrice FROM Products WHERE Discontinued = 1 ORDER BY ProductName",
      expected_translatable: true,
      expected_cols: ["ProductName", "UnitPrice"],
      expected_rows: []
    }
  ]
};

export const PIPELINES = ["Hybrid", "RAG", "TAG"];
export const LLMS = ["OpenAI", "Claude"];