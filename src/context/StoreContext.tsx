import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Client, Product, Invoice, AuditLog } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

interface StoreState {
    clients: Client[];
    products: Product[];
    invoices: Invoice[];
    auditLogs: AuditLog[];
    isLoading: boolean;
    error: string | null;
    refreshData: () => Promise<void>;
    addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
    updateClient: (id: string, client: Partial<Client>) => Promise<void>;
    deleteClient: (id: string) => Promise<void>;
    addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
    updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    addInvoice: (invoice: Omit<Invoice, 'id' | 'date'>) => Promise<void>;
}

const StoreContext = createContext<StoreState | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [cRes, pRes, iRes, aRes] = await Promise.all([
                fetch(`${API_BASE_URL}/clients`),
                fetch(`${API_BASE_URL}/products`),
                fetch(`${API_BASE_URL}/invoices`),
                fetch(`${API_BASE_URL}/auditLogs`)
            ]);

            if (cRes.ok) setClients(await cRes.json());
            if (pRes.ok) setProducts(await pRes.json());
            if (iRes.ok) setInvoices(await iRes.json());
            if (aRes.ok) setAuditLogs(await aRes.json());
        } catch (err: unknown) {
            console.error('Error fetching data from API:', err);
            setError('Error conectando a la API. Asegurate de iniciar el servidor Node.js.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const addAuditLog = async (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
        let maxId = 0;
        auditLogs.forEach(a => {
            if (/^\d+$/.test(a.id)) maxId = Math.max(maxId, parseInt(a.id, 10));
        });
        const newId = (maxId + 1).toString();

        try {
            const newLog: AuditLog = {
                ...log,
                id: newId,
                timestamp: new Date().toISOString(),
            };
            await fetch(`${API_BASE_URL}/auditLogs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLog)
            });
            setAuditLogs(prev => [newLog, ...prev]);
        } catch (err) {
            console.error('Error adding audit log', err);
        }
    };

    const addClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
        let maxId = 0;
        clients.forEach(c => {
            if (/^\d+$/.test(c.id)) maxId = Math.max(maxId, parseInt(c.id, 10));
        });
        const newId = (maxId + 1).toString();

        const newClient: Client = {
            ...clientData,
            id: newId,
            createdAt: new Date().toISOString(),
        };
        try {
            const res = await fetch(`${API_BASE_URL}/clients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newClient)
            });
            if (res.ok) {
                setClients(prev => [...prev, newClient]);
                addAuditLog({ action: 'create', entity: 'client', details: `Created client: ${newClient.name}`, user: 'Admin' });
            }
        } catch (err) {
            console.error('API Error', err);
            alert('Error creando cliente. Revisa la consola o la API.');
        }
    };

    const updateClient = async (id: string, data: Partial<Client>) => {
        try {
            const res = await fetch(`${API_BASE_URL}/clients/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
                addAuditLog({ action: 'update', entity: 'client', details: `Updated client: ${id}`, user: 'Admin' });
            }
        } catch (err) {
            console.error('API Error', err);
        }
    };

    const deleteClient = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/clients/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setClients(prev => prev.filter(c => c.id !== id));
                addAuditLog({ action: 'delete', entity: 'client', details: `Deleted client: ${id}`, user: 'Admin' });
            }
        } catch (err) {
            console.error('API Error', err);
        }
    };

    const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
        let maxId = 0;
        products.forEach(p => {
            if (/^\d+$/.test(p.id)) {
                maxId = Math.max(maxId, parseInt(p.id, 10));
            }
        });
        const newId = (maxId + 1).toString();

        const newProduct: Product = {
            ...productData,
            id: newId,
            createdAt: new Date().toISOString(),
        };

        try {
            const res = await fetch(`${API_BASE_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduct)
            });
            if (res.ok) {
                setProducts(prev => [...prev, newProduct]);
                addAuditLog({ action: 'create', entity: 'product', details: `Created product: ${newProduct.name}`, user: 'Admin' });
            }
        } catch (err) {
            console.error('API Error', err);
            alert('Error creando producto. Revisa la consola o la API.');
        }
    };

    const updateProduct = async (id: string, data: Partial<Product>) => {
        try {
            const res = await fetch(`${API_BASE_URL}/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
                addAuditLog({ action: 'update', entity: 'product', details: `Updated product: ${id}`, user: 'Admin' });
            }
        } catch (err) {
            console.error('API Error', err);
        }
    };

    const deleteProduct = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setProducts(prev => prev.filter(p => p.id !== id));
                addAuditLog({ action: 'delete', entity: 'product', details: `Deleted product: ${id}`, user: 'Admin' });
            }
        } catch (err) {
            console.error('API Error', err);
        }
    };

    const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'date'>) => {
        let maxId = 0;
        invoices.forEach(i => {
            if (/^\d+$/.test(i.id)) maxId = Math.max(maxId, parseInt(i.id, 10));
        });
        const newId = (maxId + 1).toString();

        const newInvoice: Invoice = {
            ...invoiceData,
            id: newId,
            date: new Date().toISOString(),
        };
        try {
            const res = await fetch(`${API_BASE_URL}/invoices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newInvoice)
            });
            if (res.ok) {
                setInvoices(prev => [newInvoice, ...prev]);
                addAuditLog({ action: 'create', entity: 'invoice', details: `Created invoice for: ${newInvoice.clientName}`, user: 'Admin' });
                // Refresh products stock
                refreshData();
            }
        } catch (err) {
            console.error('API Error', err);
            alert('Error creando factura.');
        }
    };

    return (
        <StoreContext.Provider value={{
            clients,
            products,
            invoices,
            auditLogs,
            isLoading,
            error,
            refreshData,
            addClient,
            updateClient,
            deleteClient,
            addProduct,
            updateProduct,
            deleteProduct,
            addInvoice
        }}>
            {children}
        </StoreContext.Provider>
    );
};
