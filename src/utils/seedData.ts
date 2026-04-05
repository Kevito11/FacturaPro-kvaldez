import { v4 as uuidv4 } from 'uuid';
import type { Client, Product, Invoice } from '../types';

export const initialClients: Client[] = [
    { id: uuidv4(), name: 'Juan Pérez', taxId: '001-0000000-1', address: 'Av. Winston Churchill #5', phone: '809-555-0101', email: 'juan.perez@email.com', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'María García', taxId: '001-0000000-2', address: 'Calle El Sol #20, Santiago', phone: '829-555-0202', email: 'maria.garcia@email.com', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Farmacia del Pueblo SRL', taxId: '131-00001-1', address: 'Av. Independencia #100', phone: '809-688-2222', email: 'contacto@farpueblo.com', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Constructora Bisonó', taxId: '101-55555-5', address: 'Av. 27 de Febrero #202', phone: '809-565-4444', email: 'ventas@bisono.com.do', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Pedro Martínez', taxId: '402-0000000-3', address: 'Calle 1ra #10, Los Prados', phone: '849-555-0303', email: 'pedro.mlb@email.com', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Supermercado Bravo', taxId: '101-88888-8', address: 'Av. Enriquillo', phone: '809-540-3333', email: 'info@bravo.com.do', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Luisa Rodríguez', taxId: '001-0000000-4', address: 'Calle Restauración #55', phone: '829-555-0404', email: 'luisa.rod@email.com', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Tech Solutions SRL', taxId: '130-99999-9', address: 'Blue Mall, Piso 4', phone: '809-555-9090', email: 'admin@techsolutions.do', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Carlos Sánchez', taxId: '001-0000000-5', address: 'Av. Abraham Lincoln #33', phone: '809-555-0505', email: 'carlos.s@email.com', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Ana Díaz', taxId: '402-1111111-1', address: 'Calle Real #8, Bella Vista', phone: '829-555-0606', email: 'ana.diaz@email.com', createdAt: new Date().toISOString() }
];

export const initialProducts: Product[] = [
    { id: uuidv4(), name: 'Laptop HP 15"', description: 'Laptop HP 15-dy2000, 8GB RAM, 256GB SSD', price: 35000, stock: 15, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Mouse Inalámbrico Logitech', description: 'Mouse M185, batería 1 año', price: 850, stock: 50, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Monitor Dell 24"', description: 'Monitor P2419H IPS Full HD', price: 12500, stock: 20, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Teclado Mecánico RGB', description: 'Teclado Redragon Kumara', price: 2800, stock: 30, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Impresora Epson L3150', description: 'EcoTank Multifuncional', price: 14500, stock: 8, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'DISCO SSD 1TB', description: 'Samsung 870 EVO', price: 6500, stock: 25, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Cable HDMI 2m', description: 'Cable alta velocidad 4K', price: 350, stock: 100, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Silla Ergonómica', description: 'Silla de oficina malla negra', price: 8500, stock: 12, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Webcam HD 1080p', description: 'Logitech C920 Pro', price: 4500, stock: 18, createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'UPS APC 600VA', description: 'Respaldo batería 4 tomas', price: 3200, stock: 15, createdAt: new Date().toISOString() }
];

const today = new Date();
const getRecentDate = (daysAgo: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
};

const createItem = (product: Product, quantity: number) => ({
    id: uuidv4(),
    productId: product.id,
    productName: product.name,
    quantity,
    price: product.price,
    total: product.price * quantity
});

export const initialInvoices: Invoice[] = [
    {
        id: uuidv4(),
        clientId: initialClients[0].id,
        clientName: initialClients[0].name,
        date: getRecentDate(0),
        items: [createItem(initialProducts[0], 1)],
        subtotal: 35000, tax: 6300, total: 41300, status: 'paid'
    },
    {
        id: uuidv4(),
        clientId: initialClients[1].id,
        clientName: initialClients[1].name,
        date: getRecentDate(1),
        items: [createItem(initialProducts[4], 2)],
        subtotal: 29000, tax: 5220, total: 34220, status: 'pending'
    },
    {
        id: uuidv4(),
        clientId: initialClients[2].id,
        clientName: initialClients[2].name,
        date: getRecentDate(1),
        items: [createItem(initialProducts[2], 5)],
        subtotal: 62500, tax: 11250, total: 73750, status: 'paid'
    },
    {
        id: uuidv4(),
        clientId: initialClients[3].id,
        clientName: initialClients[3].name,
        date: getRecentDate(2),
        items: [
            createItem(initialProducts[1], 10),
            createItem(initialProducts[6], 10)
        ],
        subtotal: 12000, tax: 2160, total: 14160, status: 'paid'
    },
    {
        id: uuidv4(),
        clientId: initialClients[4].id,
        clientName: initialClients[4].name,
        date: getRecentDate(3),
        items: [createItem(initialProducts[9], 1)],
        subtotal: 3200, tax: 576, total: 3776, status: 'pending'
    },
    {
        id: uuidv4(),
        clientId: initialClients[5].id,
        clientName: initialClients[5].name,
        date: getRecentDate(3),
        items: [createItem(initialProducts[7], 4)],
        subtotal: 34000, tax: 6120, total: 40120, status: 'paid'
    },
    {
        id: uuidv4(),
        clientId: initialClients[7].id,
        clientName: initialClients[7].name,
        date: getRecentDate(4),
        items: [createItem(initialProducts[0], 3)],
        subtotal: 105000, tax: 18900, total: 123900, status: 'pending'
    },
    {
        id: uuidv4(),
        clientId: initialClients[8].id,
        clientName: initialClients[8].name,
        date: getRecentDate(5),
        items: [createItem(initialProducts[3], 1)],
        subtotal: 2800, tax: 504, total: 3304, status: 'paid'
    },
    {
        id: uuidv4(),
        clientId: initialClients[9].id,
        clientName: initialClients[9].name,
        date: getRecentDate(6),
        items: [
            createItem(initialProducts[5], 2),
            createItem(initialProducts[1], 2)
        ],
        subtotal: 14700, tax: 2646, total: 17346, status: 'paid'
    },
    {
        id: uuidv4(),
        clientId: initialClients[0].id,
        clientName: initialClients[0].name,
        date: getRecentDate(0), // Another one for today
        items: [createItem(initialProducts[8], 1)],
        subtotal: 4500, tax: 810, total: 5310, status: 'pending'
    }
];
