require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// SQL Server Configuration
const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    server: process.env.DB_SERVER,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true', // true para Azure, false local
        trustServerCertificate: process.env.DB_TRUST_CERT === 'true' // true si es local
    }
};

let poolPromise = new sql.ConnectionPool(sqlConfig)
    .connect()
    .then(async pool => {
        console.log('✅ Conectado a SQL Server');
        
        // Auto-Migration
        try {
            // 1. Migrate Invoices Type Column
            await pool.request().query(`
                IF NOT EXISTS (
                    SELECT * FROM sys.columns 
                    WHERE object_id = OBJECT_ID(N'[dbo].[Invoices]') 
                    AND name = 'type'
                )
                BEGIN
                    ALTER TABLE Invoices ADD type NVARCHAR(50) NOT NULL DEFAULT 'invoice';
                    PRINT 'Columna type añadida';
                END
            `);

            // 2. Migrate Users Table
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' and xtype='U')
                BEGIN
                    CREATE TABLE Users (
                        id NVARCHAR(50) PRIMARY KEY,
                        username NVARCHAR(100) UNIQUE NOT NULL,
                        password NVARCHAR(255) NOT NULL,
                        role NVARCHAR(50) DEFAULT 'admin',
                        createdAt NVARCHAR(50)
                    );
                    PRINT 'Tabla Users creada';
                END
            `);

            // 3. Seed Default Admin User
            const checkAdmin = await pool.request().query("SELECT * FROM Users WHERE username = 'admin'");
            if (checkAdmin.recordset.length === 0) {
                const hashedPassword = await bcrypt.hash('admin123', 10);
                await pool.request()
                    .input('id', sql.NVarChar, '1')
                    .input('user', sql.NVarChar, 'admin')
                    .input('pass', sql.NVarChar, hashedPassword)
                    .input('date', sql.NVarChar, new Date().toISOString())
                    .query(`
                        INSERT INTO Users (id, username, password, role, createdAt)
                        VALUES (@id, @user, @pass, 'admin', @date)
                    `);
                console.log('✅ Usuario admin inyectado con éxito (admin:admin123)');
            }

            // 4. Migrate Clients New Columns
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Clients]') AND name = 'city')
                BEGIN
                    ALTER TABLE Clients ADD city NVARCHAR(100) NULL, contactPerson NVARCHAR(100) NULL, creditLimit DECIMAL(18,2) NULL;
                    PRINT '✅ Columnas agregadas a Clients';
                END
            `);

            // 5. Migrate Products New Columns
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Products]') AND name = 'category')
                BEGIN
                    ALTER TABLE Products ADD category NVARCHAR(100) NULL, barcode NVARCHAR(100) NULL, costPrice DECIMAL(18,2) NULL;
                    PRINT '✅ Columnas agregadas a Products';
                END
            `);

        } catch(e) {
            console.error('Error auto-migrando DB:', e.message);
        }

        return pool;
    })
    .catch(err => {
        console.error('❌ Error de conexión a la base de datos:', err);
    });

// ----------------------------------------------------------------------
// ENDPOINTS DE AUTENTICACIÓN (Auth)
// ----------------------------------------------------------------------

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_factura_key_123';

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Usuario y Contraseña requeridos' });
        }

        const pool = await poolPromise;
        if (!pool) {
            return res.status(503).json({ error: 'Servicio de base de datos no disponible.' });
        }
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM Users WHERE username = @username');

        const user = result.recordset[0];
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generate Token
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------------------------
// ENDPOINTS DE CLIENTES (Clients)
// ----------------------------------------------------------------------

// GET: Obtener todos los clientes
app.get('/api/clients', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Clients ORDER BY createdAt DESC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Crear nuevo cliente
app.post('/api/clients', async (req, res) => {
    try {
        const { id, name, email, phone, address, taxId, createdAt, city, contactPerson, creditLimit } = req.body;
        const pool = await poolPromise;
        
        await pool.request()
            .input('id', sql.NVarChar, id)
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('phone', sql.NVarChar, phone)
            .input('address', sql.NVarChar, address)
            .input('taxId', sql.NVarChar, taxId)
            .input('createdAt', sql.NVarChar, createdAt)
            .input('city', sql.NVarChar, city || null)
            .input('contactPerson', sql.NVarChar, contactPerson || null)
            .input('creditLimit', sql.Decimal(18,2), creditLimit || null)
            .query(`
                INSERT INTO Clients (id, name, email, phone, address, taxId, createdAt, city, contactPerson, creditLimit)
                VALUES (@id, @name, @email, @phone, @address, @taxId, @createdAt, @city, @contactPerson, @creditLimit)
            `);
            
        res.status(201).json({ message: 'Cliente creado exitosamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT: Actualizar cliente
app.put('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const keys = Object.keys(req.body);
        if (keys.length === 0) return res.status(400).json({ error: 'No se enviaron datos' });

        const pool = await poolPromise;
        const request = pool.request();
        request.input('idTarget', sql.NVarChar, id);

        const setString = keys.map(k => `${k} = @${k}`).join(', ');
        
        keys.forEach(k => {
            if (k === 'creditLimit') request.input(k, sql.Decimal(18,2), req.body[k]);
            else request.input(k, sql.NVarChar, req.body[k]);
        });

        await request.query(`UPDATE Clients SET ${setString} WHERE id = @idTarget`);
        res.json({ message: 'Cliente actualizado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE: Eliminar cliente
app.delete('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.NVarChar, id)
            .query('DELETE FROM Clients WHERE id = @id');
        res.json({ message: 'Cliente eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------------------------
// ENDPOINTS DE PRODUCTOS (Products)
// ----------------------------------------------------------------------

// GET: Todos los productos
app.get('/api/products', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Products ORDER BY TRY_CAST(id AS INT) ASC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Crear producto
app.post('/api/products', async (req, res) => {
    try {
        const { id, name, description, price, stock, createdAt, category, barcode, costPrice } = req.body;
        const pool = await poolPromise;
        
        await pool.request()
            .input('id', sql.NVarChar, id)
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description)
            .input('price', sql.Decimal(18,2), price)
            .input('stock', sql.Int, stock)
            .input('createdAt', sql.NVarChar, createdAt)
            .input('category', sql.NVarChar, category || null)
            .input('barcode', sql.NVarChar, barcode || null)
            .input('costPrice', sql.Decimal(18,2), costPrice || null)
            .query(`
                INSERT INTO Products (id, name, description, price, stock, createdAt, category, barcode, costPrice)
                VALUES (@id, @name, @description, @price, @stock, @createdAt, @category, @barcode, @costPrice)
            `);
            
        res.status(201).json({ message: 'Producto creado exitosamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT y DELETE de productos omitidos parcialmente pero se implementarán completos al igual que clients...
app.put('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const keys = Object.keys(req.body);
        if (keys.length === 0) return res.status(400).json({ error: 'No hay datos' });

        const pool = await poolPromise;
        const request = pool.request();
        request.input('idTarget', sql.NVarChar, id);

        const setString = keys.map(k => `${k} = @${k}`).join(', ');
        keys.forEach(k => {
            if (k === 'price' || k === 'costPrice') request.input(k, sql.Decimal(18,2), req.body[k]);
            else if (k === 'stock') request.input(k, sql.Int, req.body[k]);
            else request.input(k, sql.NVarChar, req.body[k]);
        });

        await request.query(`UPDATE Products SET ${setString} WHERE id = @idTarget`);
        res.json({ message: 'Producto actualizado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request().input('id', sql.NVarChar, req.params.id)
            .query('DELETE FROM Products WHERE id = @id');
        res.json({ message: 'Producto eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------------------------
// ENDPOINTS DE FACTURAS E ITEMS (Invoices)
// ----------------------------------------------------------------------

app.get('/api/invoices', async (req, res) => {
    try {
        const pool = await poolPromise;
        // Obtener facturas
        const resultInvoices = await pool.request().query('SELECT * FROM Invoices ORDER BY date DESC');
        const resultItems = await pool.request().query('SELECT * FROM InvoiceItems');
        
        // Mapear los items a sus facturas correspondientes
        const invoices = resultInvoices.recordset.map(inv => ({
            ...inv,
            items: resultItems.recordset.filter(item => item.invoiceId === inv.id)
        }));

        res.json(invoices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/invoices', async (req, res) => {
    try {
        const { id, clientId, clientName, items, subtotal, tax, total, date, status, notes, type } = req.body;
        // Default to 'invoice' if not provided for backwards compatibility
        const documentType = type || 'invoice';
        
        const pool = await poolPromise;
        
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            
            // 1. Insertar Factura/Documento
            await request
                .input('id', sql.NVarChar, id)
                .input('clientId', sql.NVarChar, clientId)
                .input('clientName', sql.NVarChar, clientName)
                .input('subtotal', sql.Decimal(18,2), subtotal)
                .input('tax', sql.Decimal(18,2), tax)
                .input('total', sql.Decimal(18,2), total)
                .input('date', sql.NVarChar, date)
                .input('status', sql.NVarChar, status)
                .input('notes', sql.NVarChar, notes)
                .input('type', sql.NVarChar, documentType)
                .query(`
                    INSERT INTO Invoices (id, clientId, clientName, subtotal, tax, total, date, status, notes, type)
                    VALUES (@id, @clientId, @clientName, @subtotal, @tax, @total, @date, @status, @notes, @type)
                `);

            // 2. Insertar Items
            for (const item of items) {
                const itemReq = new sql.Request(transaction);
                await itemReq
                    .input('id', sql.NVarChar, item.id)
                    .input('invoiceId', sql.NVarChar, id)
                    .input('productId', sql.NVarChar, item.productId)
                    .input('productName', sql.NVarChar, item.productName)
                    .input('quantity', sql.Int, item.quantity)
                    .input('price', sql.Decimal(18,2), item.price)
                    .input('total', sql.Decimal(18,2), item.total)
                    .query(`
                        INSERT INTO InvoiceItems (id, invoiceId, productId, productName, quantity, price, total)
                        VALUES (@id, @invoiceId, @productId, @productName, @quantity, @price, @total)
                    `);
                    
                    // Manejo de Inventario
                    // - 'invoice': Descuenta el stock
                    // - 'credit_note': Regresa el stock
                    // - 'order' / 'debit_note': No hace nada con el stock por ahora
                    if (documentType === 'invoice' || documentType === 'credit_note') {
                        const isCredit = documentType === 'credit_note';
                        const sign = isCredit ? '+' : '-';
                        
                        const updateStockReq = new sql.Request(transaction);
                        await updateStockReq
                            .input('prodId', sql.NVarChar, item.productId)
                            .input('qty', sql.Int, item.quantity)
                            .query(`UPDATE Products SET stock = stock ${sign} @qty WHERE id = @prodId`);
                    }
                }

                await transaction.commit();
                res.status(201).json({ message: 'Documento registrado con éxito' });
            } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ----------------------------------------------------------------------
// ENDPOINTS AUDITORIA
// ----------------------------------------------------------------------
app.get('/api/auditLogs', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM AuditLogs ORDER BY timestamp DESC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auditLogs', async (req, res) => {
    try {
        const { id, action, entity, details, timestamp, username } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.NVarChar, id)
            .input('action', sql.NVarChar, action)
            .input('entity', sql.NVarChar, entity)
            .input('details', sql.NVarChar, details)
            .input('timestamp', sql.NVarChar, timestamp)
            .input('username', sql.NVarChar, username || 'Admin')
            .query(`
                INSERT INTO AuditLogs (id, action, entity, details, timestamp, username)
                VALUES (@id, @action, @entity, @details, @timestamp, @username)
            `);
        res.status(201).json({ message: 'Log guardado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// START SERVER
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
