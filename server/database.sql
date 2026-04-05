-- Ejecutar este script en Microsoft SQL Server Management Studio para crear las tablas necesarias

CREATE TABLE Users (
    id NVARCHAR(50) PRIMARY KEY,
    username NVARCHAR(100) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) DEFAULT 'admin',
    createdAt NVARCHAR(50)
);

CREATE TABLE Clients (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255),
    phone NVARCHAR(50),
    address NVARCHAR(1000),
    taxId NVARCHAR(50),
    createdAt NVARCHAR(50)
);

CREATE TABLE Products (
    id NVARCHAR(50) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(1000),
    price DECIMAL(18,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    createdAt NVARCHAR(50)
);

CREATE TABLE Invoices (
    id NVARCHAR(50) PRIMARY KEY,
    clientId NVARCHAR(50) REFERENCES Clients(id),
    clientName NVARCHAR(255),
    type NVARCHAR(50) DEFAULT 'invoice',
    subtotal DECIMAL(18,2),
    tax DECIMAL(18,2),
    total DECIMAL(18,2),
    date NVARCHAR(50),
    status NVARCHAR(50),
    notes NVARCHAR(1000)
);

CREATE TABLE InvoiceItems (
    id NVARCHAR(50) PRIMARY KEY,
    invoiceId NVARCHAR(50) REFERENCES Invoices(id) ON DELETE CASCADE,
    productId NVARCHAR(50),
    productName NVARCHAR(255),
    quantity INT,
    price DECIMAL(18,2),
    total DECIMAL(18,2)
);

CREATE TABLE AuditLogs (
    id NVARCHAR(50) PRIMARY KEY,
    action NVARCHAR(50),
    entity NVARCHAR(50),
    details NVARCHAR(1000),
    timestamp NVARCHAR(50),
    username NVARCHAR(100)
);
