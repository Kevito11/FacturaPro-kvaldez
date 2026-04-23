import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import type { Client, Product, Invoice, AuditLog, User, Payment } from '../types';

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
    updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>;
    // Payments
    payments: Payment[];
    addPayment: (payment: Omit<Payment, 'id'>) => Promise<void>;
    // User Management (Admin only)
    users: User[];
    addUser: (user: Omit<User, 'id' | 'createdAt'> & { password?: string }) => Promise<void>;
    updateUser: (id: string, user: Partial<User> & { password?: string }) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
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
    const { user: currentUser } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [cRes, pRes, iRes, payRes, aRes, uRes] = await Promise.all([
                fetch(`${API_BASE_URL}/clients`),
                fetch(`${API_BASE_URL}/products`),
                fetch(`${API_BASE_URL}/invoices`),
                fetch(`${API_BASE_URL}/payments`),
                fetch(`${API_BASE_URL}/auditLogs`),
                fetch(`${API_BASE_URL}/users`)
            ]);

            if (cRes.ok) setClients(await cRes.json().catch(() => []));
            if (pRes.ok) setProducts(await pRes.json().catch(() => []));
            if (iRes.ok) setInvoices(await iRes.json().catch(() => []));
            if (payRes.ok) setPayments(await payRes.json().catch(() => []));
            if (aRes.ok) setAuditLogs(await aRes.json().catch(() => []));
            if (uRes.ok) setUsers(await uRes.json().catch(() => []));
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
                addAuditLog({ action: 'create', entity: 'client', details: `Created client: ${newClient.name}`, user: currentUser?.username || 'System' });
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
                addAuditLog({ action: 'create', entity: 'product', details: `Created product: ${newProduct.name}`, user: currentUser?.username || 'System' });
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
                addAuditLog({ action: 'create', entity: 'invoice', details: `Created ${newInvoice.type} #${newInvoice.id} for: ${newInvoice.clientName}`, user: 'System' });
                
                // Actualización Automática de Estados de Origen
                if (newInvoice.parentId) {
                    if (newInvoice.type === 'invoice') {
                        // Si es factura desde pedido
                        await updateInvoiceStatus(newInvoice.parentId, 'invoiced');
                    } else if (newInvoice.type === 'credit_note') {
                        // Si es nota de crédito desde factura
                        // Simplificamos a devuelto total por ahora, o podrías comparar totales
                        await updateInvoiceStatus(newInvoice.parentId, 'returned_total');
                    }
                }

                refreshData();
            } else {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error al crear el documento');
            }
        } catch (err) {
            console.error('API Error', err);
            throw err;
        }
    };

    const updateInvoiceStatus = async (id: string, status: Invoice['status']) => {
        try {
            const res = await fetch(`${API_BASE_URL}/invoices/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
                addAuditLog({ action: 'update', entity: 'invoice', details: `Updated status of document ${id} to ${status}`, user: 'System' });
            } else {
                throw new Error('Error al actualizar el estado');
            }
        } catch (err) {
            console.error('API Error', err);
            throw err;
        }
    };

    const addUser = async (userData: Omit<User, 'id' | 'createdAt'> & { password?: string }) => {
        const newId = Math.random().toString(36).substr(2, 9);
        const newUser = { ...userData, id: newId, createdAt: new Date().toISOString() };
        try {
            const res = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            if (res.ok) {
                setUsers(prev => [...prev, newUser as User]);
                addAuditLog({ action: 'create', entity: 'user', details: `Created user: ${userData.username}`, user: currentUser?.username || 'Admin' });
            }
        } catch (err) {
            console.error('API Error', err);
        }
    };

    const updateUser = async (id: string, data: Partial<User> & { password?: string }) => {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u) as User[]);
            }
        } catch (err) {
            console.error('API Error', err);
        }
    };

    const deleteUser = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== id));
            }
        } catch (err) {
            console.error('API Error', err);
        }
    };

    const addPayment = async (paymentData: Omit<Payment, 'id'>) => {
        const newId = Math.random().toString(36).substr(2, 9);
        const newPayment: Payment = { ...paymentData, id: newId };
        
        try {
            const res = await fetch(`${API_BASE_URL}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPayment)
            });

            if (res.ok) {
                setPayments(prev => [newPayment, ...prev]);
                addAuditLog({ action: 'create', entity: 'payment', details: `Payment of RD$ ${newPayment.amount} from ${newPayment.clientName}`, user: currentUser?.username || 'System' });

                // 1. Actualizar Facturas a 'paid' (Pagadas)
                if (newPayment.invoiceIds && newPayment.invoiceIds.length > 0) {
                    for (const invId of newPayment.invoiceIds) {
                        await updateInvoiceStatus(invId, 'paid');
                    }
                }

                // 2. Gestionar Saldo a Favor / Liquidación de Deuda
                // Calculamos cuánto del pago sobró después de liquidar facturas específicas
                const invoicesTotal = invoices
                    .filter(inv => newPayment.invoiceIds?.includes(inv.id))
                    .reduce((sum, inv) => sum + inv.total, 0);
                
                const remainder = newPayment.amount - invoicesTotal;
                
                // Actualizar el creditBalance del cliente
                const client = clients.find(c => c.id === newPayment.clientId);
                if (client) {
                    const newBalance = (client.creditBalance || 0) + remainder;
                    await updateClient(client.id, { creditBalance: newBalance });
                }

                refreshData();
            }
        } catch (err) {
            console.error('API Error', err);
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
            addInvoice,
            updateInvoiceStatus,
            payments,
            addPayment,
            users,
            addUser,
            updateUser,
            deleteUser
        }}>
            {children}
        </StoreContext.Provider>
    );
};
