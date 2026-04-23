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
                        permissions NVARCHAR(MAX) DEFAULT '[]',
                        createdAt NVARCHAR(50)
                    );
                    PRINT 'Tabla Users creada';
                END
                ELSE
                BEGIN
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'permissions')
                    BEGIN
                        ALTER TABLE Users ADD permissions NVARCHAR(MAX) DEFAULT '[]';
                        PRINT 'Columna permissions añadida a Users';
                    END

                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'fullName')
                    BEGIN
                        ALTER TABLE Users ADD fullName NVARCHAR(200) NULL;
                        PRINT 'Columna fullName añadida a Users';
                    END
                END
            `);

            // 3. Seed Default Admin User
            const checkAdmin = await pool.request().query("SELECT * FROM Users WHERE username = 'admin'");
            if (checkAdmin.recordset.length === 0) {
                const hashedPassword = await bcrypt.hash('admin123', 10);
                await pool.request()
                    .input('id', sql.NVarChar, '1')
                    .input('user', sql.NVarChar, 'admin')
                    .input('fname', sql.NVarChar, 'Administrador del Sistema')
                    .input('pass', sql.NVarChar, hashedPassword)
                    .input('perms', sql.NVarChar, JSON.stringify(['all', 'reports_view']))
                    .input('date', sql.NVarChar, new Date().toISOString())
                    .query(`
                        INSERT INTO Users (id, username, fullName, password, role, permissions, createdAt)
                        VALUES (@id, @user, @fname, @pass, 'admin', @perms, @date)
                    `);
                console.log('✅ Usuario admin inyectado con éxito (admin:admin123)');
            }

            // 4. Migrate Clients New Columns
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Clients') AND name = 'taxCondition')
                    ALTER TABLE Clients ADD taxCondition NVARCHAR(50) DEFAULT 'B02';
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Clients') AND name = 'creditBalance')
                    ALTER TABLE Clients ADD creditBalance DECIMAL(18,2) DEFAULT 0;

                IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('Payments') AND type in (N'U'))
                CREATE TABLE Payments (
                    id NVARCHAR(50) PRIMARY KEY,
                    clientId NVARCHAR(50),
                    clientName NVARCHAR(255),
                    amount DECIMAL(18,2),
                    date NVARCHAR(50),
                    method NVARCHAR(50),
                    reference NVARCHAR(255),
                    notes NVARCHAR(MAX),
                    invoiceIds NVARCHAR(MAX)
                );

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Clients]') AND name = 'city')
                BEGIN
                    ALTER TABLE Clients ADD city NVARCHAR(100) NULL, contactPerson NVARCHAR(100) NULL, creditLimit DECIMAL(18,2) NULL;
                    PRINT '✅ Columnas base agregadas a Clients';
                END

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Clients]') AND name = 'hasCreditEnabled')
                BEGIN
                    ALTER TABLE Clients ADD hasCreditEnabled BIT DEFAULT 0;
                    PRINT '✅ Columnas de Crédito y DGII agregadas a Clients';
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

            // 6. Migrate Invoices Related Documents Columns
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Invoices]') AND name = 'parentId')
                BEGIN
                    ALTER TABLE Invoices ADD parentId NVARCHAR(50) NULL, rootId NVARCHAR(50) NULL;
                    PRINT '✅ Columnas parentId y rootId agregadas a Invoices';
                END
            `);

            // 7. Migrate AuditLogs Table
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AuditLogs' and xtype='U')
                BEGIN
                    CREATE TABLE AuditLogs (
                        id NVARCHAR(50) PRIMARY KEY,
                        action NVARCHAR(100) NOT NULL,
                        entity NVARCHAR(100) NOT NULL,
                        details NVARCHAR(MAX) NULL,
                        [user] NVARCHAR(100) NOT NULL,
                        timestamp NVARCHAR(50) NOT NULL
                    );
                    PRINT '✅ Tabla AuditLogs creada';
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
        const { id, name, email, phone, address, taxId, createdAt, city, contactPerson, creditLimit, hasCreditEnabled, taxCondition } = req.body;
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
            .input('hasCreditEnabled', sql.Bit, hasCreditEnabled ? 1 : 0)
            .input('taxCondition', sql.NVarChar, taxCondition || null)
            .query(`
                INSERT INTO Clients (id, name, email, phone, address, taxId, createdAt, city, contactPerson, creditLimit, hasCreditEnabled, taxCondition)
                VALUES (@id, @name, @email, @phone, @address, @taxId, @createdAt, @city, @contactPerson, @creditLimit, @hasCreditEnabled, @taxCondition)
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
            else if (k === 'hasCreditEnabled') request.input(k, sql.Bit, req.body[k] ? 1 : 0);
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
    console.log('Nueva petición de documento:', req.body);
    try {
        const { id, clientId, clientName, items, subtotal, tax, total, date, status, notes, type, parentId, rootId } = req.body;
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
                .input('parentId', sql.NVarChar, req.body.parentId || null)
                .input('rootId', sql.NVarChar, req.body.rootId || null)
                .query(`
                    INSERT INTO Invoices (id, clientId, clientName, subtotal, tax, total, date, status, notes, type, parentId, rootId)
                    VALUES (@id, @clientId, @clientName, @subtotal, @tax, @total, @date, @status, @notes, @type, @parentId, @rootId)
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

                // 3. Actualizar estado del padre si existe
                if (parentId) {
                    const updateParentReq = new sql.Request(transaction);
                    let newParentStatus = null;
                    
                    if (documentType === 'invoice') {
                        newParentStatus = 'invoiced'; // Pedido -> Facturado
                    } else if (documentType === 'credit_note') {
                        // Aquí podríamos calcular si es total o parcial, por ahora lo marcamos como parcial/devuelto
                        newParentStatus = 'returned_total'; 
                    }

                    if (newParentStatus) {
                        await updateParentReq
                            .input('pId', sql.NVarChar, parentId)
                            .input('newStatus', sql.NVarChar, newParentStatus)
                            .query('UPDATE Invoices SET status = @newStatus WHERE id = @pId');
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


app.patch('/api/invoices/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.NVarChar, id)
            .input('status', sql.NVarChar, status)
            .query('UPDATE Invoices SET status = @status WHERE id = @id');
        res.json({ message: 'Estado actualizado correctamente' });
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
        const { id, action, entity, details, user, timestamp } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.NVarChar, id)
            .input('action', sql.NVarChar, action)
            .input('entity', sql.NVarChar, entity)
            .input('details', sql.NVarChar, details)
            .input('user', sql.NVarChar, user)
            .input('timestamp', sql.NVarChar, timestamp)
            .query(`
                INSERT INTO AuditLogs (id, action, entity, details, [user], timestamp)
                VALUES (@id, @action, @entity, @details, @user, @timestamp)
            `);
        res.json({ message: 'Log registrado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------------------------
// ENDPOINTS USUARIOS Y PERMISOS
// ----------------------------------------------------------------------
app.get('/api/users', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT id, username, fullName, role, permissions, createdAt FROM Users');
        const users = result.recordset.map(u => ({
            ...u,
            permissions: JSON.parse(u.permissions || '[]')
        }));
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { id, username, fullName, password, role, permissions, createdAt } = req.body;
        const pool = await poolPromise;
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.request()
            .input('id', sql.NVarChar, id)
            .input('user', sql.NVarChar, username)
            .input('fname', sql.NVarChar, fullName)
            .input('pass', sql.NVarChar, hashedPassword)
            .input('role', sql.NVarChar, role)
            .input('perms', sql.NVarChar, JSON.stringify(permissions))
            .input('date', sql.NVarChar, createdAt)
            .query(`
                INSERT INTO Users (id, username, fullName, password, role, permissions, createdAt)
                VALUES (@id, @user, @fname, @pass, @role, @perms, @date)
            `);
        res.json({ message: 'Usuario creado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, role, permissions } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.NVarChar, id)
            .input('fname', sql.NVarChar, fullName)
            .input('role', sql.NVarChar, role)
            .input('perms', sql.NVarChar, JSON.stringify(permissions))
            .query(`
                UPDATE Users 
                SET fullName = @fname, role = @role, permissions = @perms 
                WHERE id = @id
            `);
        res.json({ message: 'Usuario actualizado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (id === '1') return res.status(400).json({ error: 'No se puede eliminar al administrador principal' });
        
        const pool = await poolPromise;
        await pool.request().input('id', sql.NVarChar, id).query('DELETE FROM Users WHERE id = @id');
        res.json({ message: 'Usuario eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('user', sql.NVarChar, username)
            .query('SELECT * FROM Users WHERE username = @user');
        
        const user = result.recordset[0];
        if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Contraseña incorrecta' });

        const token = jwt.sign({ 
            id: user.id, 
            username: user.username,
            fullName: user.fullName,
            role: user.role, 
            permissions: JSON.parse(user.permissions || '[]') 
        }, JWT_SECRET, { expiresIn: '24h' });
        
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                permissions: JSON.parse(user.permissions || '[]')
            }
        });
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
// --- PAYMENTS ---
app.get('/api/payments', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Payments ORDER BY date DESC');
        const payments = result.recordset.map(p => ({
            ...p,
            invoiceIds: p.invoiceIds ? JSON.parse(p.invoiceIds) : []
        }));
        res.json(payments);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/payments', async (req, res) => {
    try {
        const { id, clientId, clientName, amount, date, method, reference, notes, invoiceIds } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.NVarChar, id)
            .input('cid', sql.NVarChar, clientId)
            .input('cname', sql.NVarChar, clientName)
            .input('amount', sql.Decimal(18, 2), amount)
            .input('date', sql.NVarChar, date)
            .input('method', sql.NVarChar, method)
            .input('ref', sql.NVarChar, reference)
            .input('notes', sql.NVarChar, notes)
            .input('iids', sql.NVarChar, JSON.stringify(invoiceIds))
            .query(`
                INSERT INTO Payments (id, clientId, clientName, amount, date, method, reference, notes, invoiceIds)
                VALUES (@id, @cid, @cname, @amount, @date, @method, @ref, @notes, @iids)
            `);
        res.status(201).json(req.body);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
