export const TYPES_RESOURCES = true;

export interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city?: string;
    contactPerson?: string;
    taxId: string; // RNC or Cédula
    hasCreditEnabled?: boolean;
    creditLimit?: number;
    taxCondition?: string; // e.g., E31, E32, etc.
    creditBalance?: number; // Saldo a favor del cliente
    createdAt: string;
}

export interface Payment {
    id: string;
    clientId: string;
    clientName: string;
    amount: number;
    date: string;
    method: 'cash' | 'transfer' | 'check' | 'card';
    reference?: string;
    notes?: string;
    invoiceIds?: string[]; // Facturas que este pago está liquidando
}

export interface Product {
    id: string;
    name: string;
    description: string;
    category?: string;
    barcode?: string;
    costPrice?: number;
    price: number;
    stock: number;
    createdAt: string;
}

export type DocumentType = 'order' | 'invoice' | 'credit_note' | 'debit_note';

export interface InvoiceItem {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
}

export interface Invoice {
    id: string;
    type?: DocumentType; // Made optional so backwards compatibility is maintained where it was named "Invoice"
    clientId: string;
    clientName: string;
    items: InvoiceItem[];
    subtotal: number;
    tax: number; // ITBIS etc.
    total: number;
    date: string;
    status: 'paid' | 'pending' | 'cancelled' | 'invoiced' | 'delivered' | 'returned_partial' | 'returned_total';
    notes?: string;
    parentId?: string;
    rootId?: string;
}

export type AppRole = 'admin' | 'vendedor' | 'contable' | 'almacen' | 'configurador';

export interface User {
    id: string;
    username: string;
    fullName?: string;
    role: AppRole;
    permissions: string[]; // e.g. ['clients_view', 'invoices_create']
    createdAt: string;
}

export interface AuditLog {
    id: string;
    action: 'create' | 'update' | 'delete' | 'login' | 'print';
    entity: 'client' | 'product' | 'invoice' | 'system' | 'user';
    details: string;
    timestamp: string;
    user: string;
}
