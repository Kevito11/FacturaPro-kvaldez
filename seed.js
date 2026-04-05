const API_BASE_URL = 'http://localhost:5000/api';

const dummyClients = [
    { name: "Acme Corp S.A.", email: "compras@acme.com", phone: "809-555-0100", address: "Av. Winston Churchill 101", city: "Santo Domingo", contactPerson: "John Doe", creditLimit: 500000, taxId: "101-000001-1" },
    { name: "Distribuidora Nacional", email: "info@distnacional.com", phone: "809-555-0101", address: "Calle Central 45", city: "Santiago", contactPerson: "Maria Gomez", creditLimit: 250000, taxId: "101-000002-1" },
    { name: "Tech Solutions SRL", email: "ventas@techs.do", phone: "809-555-0102", address: "Plaza Central Local 4", city: "Santo Domingo", contactPerson: "Carlos Ruiz", creditLimit: 100000, taxId: "101-000003-1" },
    { name: "Ferretería El Tornillo", email: "admin@eltornillo.do", phone: "809-555-0103", address: "Av. 27 de Febrero 500", city: "Santo Domingo Este", contactPerson: "Juan Perez", creditLimit: 1000000, taxId: "101-000004-1" },
    { name: "Supermercados Unidos", email: "pagos@superunidos.com", phone: "809-555-0104", address: "Av. Luperón 32", city: "Santo Domingo", contactPerson: "Ana Martinez", creditLimit: 2500000, taxId: "101-000005-1" },
    { name: "Constructora del Sol", email: "compras@csol.do", phone: "809-555-0105", address: "Calle Sol 10", city: "La Vega", contactPerson: "Pedro Mota", creditLimit: 1500000, taxId: "101-000006-1" },
    { name: "Farmacias de la Salud", email: "finanzas@fsalud.com", phone: "809-555-0106", address: "Av. Tiradentes 15", city: "Santo Domingo", contactPerson: "Laura Sosa", creditLimit: 750000, taxId: "101-000007-1" },
    { name: "Importadora del Caribe", email: "import@caribe.do", phone: "809-555-0107", address: "Calle Puerto 5", city: "Puerto Plata", contactPerson: "Jose Silva", creditLimit: 300000, taxId: "101-000008-1" },
    { name: "Consultorías y Asociados", email: "contacto@consultorias.com", phone: "809-555-0108", address: "Torre Piantini, Piso 5", city: "Santo Domingo", contactPerson: "Elena Torres", creditLimit: 150000, taxId: "101-000009-1" },
    { name: "Comercializadora Rápida", email: "info@crapida.do", phone: "809-555-0109", address: "Av. San Vicente 88", city: "Santo Domingo Este", contactPerson: "Miguel Peña", creditLimit: 200000, taxId: "101-000010-1" }
];

const dummyProducts = [
    { name: "Laptop Dell XPS 13", description: "Core i7, 16GB RAM, 512GB SSD", price: 85000, stock: 15, category: "Computación", barcode: "123456789011", costPrice: 60000 },
    { name: "Monitor Samsung 24\"", description: "Monitor IPS Full HD a 75Hz", price: 12500, stock: 40, category: "Computación", barcode: "123456789012", costPrice: 8000 },
    { name: "Teclado Mecánico Logitech", description: "Teclado mecánico switches red", price: 4500, stock: 25, category: "Periféricos", barcode: "123456789013", costPrice: 2500 },
    { name: "Mouse Inalámbrico", description: "Mouse óptico 1600 DPI", price: 1200, stock: 100, category: "Periféricos", barcode: "123456789014", costPrice: 500 },
    { name: "Impresora HP LaserJet", description: "Impresora láser monocromática", price: 15000, stock: 10, category: "Oficina", barcode: "123456789015", costPrice: 10000 },
    { name: "Silla Ergonómica Ejecutiva", description: "Silla con soporte lumbar", price: 8500, stock: 30, category: "Mobiliario", barcode: "123456789016", costPrice: 4000 },
    { name: "Escritorio en L", description: "Escritorio de oficina madera", price: 18000, stock: 8, category: "Mobiliario", barcode: "123456789017", costPrice: 9500 },
    { name: "Disco Duro Externo 2TB", description: "Disco duro USB 3.0", price: 5500, stock: 50, category: "Almacenamiento", barcode: "123456789018", costPrice: 3500 },
    { name: "Cable HDMI 4K 2m", description: "Cable enmallado alta velocidad", price: 800, stock: 200, category: "Cables", barcode: "123456789019", costPrice: 200 },
    { name: "Mochila para Laptop", description: "Resistente al agua, 15.6 pulgadas", price: 2500, stock: 45, category: "Accesorios", barcode: "123456789020", costPrice: 900 }
];

async function seed() {
    console.log("Iniciando inyección de datos de prueba...");

    let clientRes = await fetch(`${API_BASE_URL}/clients`);
    let clients = await clientRes.json();
    let maxClientId = clients.reduce((max, c) => Math.max(max, parseInt(c.id) || 0), 0);

    for(let c of dummyClients) {
        maxClientId++;
        c.id = maxClientId.toString();
        c.createdAt = new Date().toISOString();
        await fetch(`${API_BASE_URL}/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(c)
        });
        console.log(`Cliente inyectado: ${c.name}`);
    }

    let prodRes = await fetch(`${API_BASE_URL}/products`);
    let products = await prodRes.json();
    let maxProdId = products.reduce((max, p) => Math.max(max, parseInt(p.id) || 0), 0);

    for(let p of dummyProducts) {
        maxProdId++;
        p.id = maxProdId.toString();
        p.createdAt = new Date().toISOString();
        await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p)
        });
        console.log(`Producto inyectado: ${p.name}`);
    }

    console.log("¡Completado!");
}

seed();
