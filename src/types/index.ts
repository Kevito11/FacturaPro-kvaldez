export interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city?: string;
    contactPerson?: string;
    creditLimit?: number;
    taxId: string; // RNC or Cédula
    createdAt: string;
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
    status: 'paid' | 'pending' | 'cancelled';
    notes?: string;
}

export interface AuditLog {
    id: string;
    action: 'create' | 'update' | 'delete' | 'login' | 'print';
    entity: 'client' | 'product' | 'invoice' | 'system';
    details: string;
    timestamp: string;
    user: string; // "Admin" for now
}
