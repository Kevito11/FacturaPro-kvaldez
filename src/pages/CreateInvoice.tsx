import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Plus, Trash2, ArrowLeft, FileText, CheckCircle2, User, Search, MapPin, Hash, Package } from 'lucide-react';
import type { InvoiceItem, Client, Product } from '../types';

// ==========================================
// COMPONENTES AUXILIARES
// ==========================================

interface SearchableSelectProps<T> {
    items: T[];
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    renderItem: (item: T) => React.ReactNode;
    filterItem: (item: T, search: string) => boolean;
    getDisplayValue: (id: string, items: T[]) => string;
}

function SearchableSelect<T extends { id: string }>(props: SearchableSelectProps<T>) {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const filtered = useMemo(() => {
        if (!search) return props.items;
        return props.items.filter(item => props.filterItem(item, search));
    }, [props.items, search, props]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const displayValue = props.value ? props.getDisplayValue(props.value, props.items) : '';

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="relative">
                <input
                    type="text"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#1ab394]/30 focus:border-[#1ab394] transition-all font-medium placeholder:font-normal"
                    placeholder={props.placeholder}
                    value={isOpen ? search : displayValue}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setIsOpen(true);
                        if (props.value) props.onChange('');
                    }}
                    onFocus={() => {
                        setSearch('');
                        setIsOpen(true);
                    }}
                />
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-[0_10px_40px_rgb(0,0,0,0.1)] border border-gray-100 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {filtered.length === 0 ? (
                        <div className="p-6 text-sm text-gray-400 text-center italic">No se encontraron resultados para "{search}"</div>
                    ) : (
                        <div className="py-2">
                            {filtered.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => {
                                        props.onChange(item.id);
                                        setSearch('');
                                        setIsOpen(false);
                                    }}
                                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors ${props.value === item.id ? 'bg-[#1ab394]/5' : ''}`}
                                >
                                    {props.renderItem(item)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}


// ==========================================
// VISTA PRINCIPAL
// ==========================================

const CreateInvoice: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { clients, products, addInvoice } = useStore();

    const [clientId, setClientId] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState<'paid' | 'pending'>('pending');
    
    const initialType = (searchParams.get('type') || 'invoice') as 'order' | 'invoice' | 'credit_note' | 'debit_note';
    const [documentType] = useState<'order' | 'invoice' | 'credit_note' | 'debit_note'>(initialType);

    const activeClient = useMemo(() => clients.find(c => c.id === clientId), [clientId, clients]);
    const selectedProduct = useMemo(() => products.find(p => p.id === selectedProductId), [selectedProductId, products]);

    const handleAddItem = () => {
        if (!selectedProduct) return;

        let maxId = 0;
        items.forEach(item => {
            if (/^\d+$/.test(item.id)) maxId = Math.max(maxId, parseInt(item.id, 10));
        });
        const newId = (maxId + 1).toString();

        const newItem: InvoiceItem = {
            id: newId,
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity: 1,
            price: selectedProduct.price,
            total: selectedProduct.price
        };

        setItems([...items, newItem]);
        setSelectedProductId('');
    };

    const updateItem = (id: string, field: keyof InvoiceItem, value: number) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updates = { [field]: value };
                if (field === 'quantity' || field === 'price') {
                    const quantity = field === 'quantity' ? value : item.quantity;
                    const price = field === 'price' ? value : item.price;
                    updates.total = quantity * price;
                }
                return { ...item, ...updates };
            }
            return item;
        }));
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.18; // 18% ITBIS
    const total = subtotal + tax;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId || items.length === 0 || !activeClient) return;

        addInvoice({
            type: documentType,
            clientId,
            clientName: activeClient.name,
            items,
            subtotal,
            tax,
            total,
            status,
            notes
        });

        navigate('/invoices');
    };

    const docTypeLabel = 
        documentType === 'order' ? 'Pedido / Cotización' : 
        documentType === 'invoice' ? 'Factura Comercial' : 
        documentType === 'credit_note' ? 'Nota de Crédito' : 
        'Nota de Débito';

    return (
        <div className="animate-in fade-in max-w-7xl mx-auto w-full pb-12 flex flex-col gap-6">
            
            {/* Premium Header Profile */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#2f4050] via-[#212c38] to-[#1ab394]/90 rounded-2xl p-8 shadow-2xl shadow-[#1ab394]/20 border border-white/10">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 text-white">
                    <button onClick={() => navigate('/invoices')} className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white hover:text-[#2f4050] transition-all shadow-sm group shrink-0">
                        <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-semibold tracking-wider text-white/90 uppercase">
                            <FileText size={14} className="text-[#1ab394]" />
                            Asistente de Emisión
                        </div>
                        <h2 className="text-4xl font-extrabold tracking-tight">
                            Nuevo {docTypeLabel}
                        </h2>
                        <p className="text-blue-100/80 max-w-lg font-light text-sm leading-relaxed">
                            Diseñe su documento de forma ágil. El sistema procesará auto-matices, deducirá inventarios si corresponde y calculará la estructuración final.
                        </p>
                    </div>
                </div>
                
                {/* Decorative background vectors */}
                <div className="absolute top-0 right-0 -translate-y-12 translate-x-20 w-96 h-96 bg-[#1ab394] blur-[100px] opacity-20 rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 translate-y-20 -translate-x-20 w-72 h-72 bg-blue-500 blur-[100px] opacity-20 rounded-full pointer-events-none"></div>
            </div>

            {/* 2. Sección Configuración General */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Selector Cliente (2/3 width) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <User size={20} className="text-[#1ab394]" /> 
                        Receptor del Documento (Cliente)
                    </h3>
                    
                    <div className="mb-4">
                        <SearchableSelect<Client>
                            items={clients}
                            value={clientId}
                            onChange={setClientId}
                            placeholder="Buscar cliente por Nombre o ID..."
                            filterItem={(client, search) => 
                                client.name.toLowerCase().includes(search.toLowerCase()) || 
                                client.id.toLowerCase().includes(search.toLowerCase())
                            }
                            getDisplayValue={(id, items) => {
                                const c = items.find(i => i.id === id);
                                return c ? `[#${c.id}] ${c.name}` : '';
                            }}
                            renderItem={(client) => (
                                <div className="flex flex-col">
                                    <div className="font-bold text-gray-800">
                                        <span className="text-[#1ab394] mr-2">#{client.id}</span>
                                        {client.name}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                        <span className="flex items-center gap-1"><MapPin size={12}/> {client.address || 'N/A'}</span>
                                    </div>
                                </div>
                            )}
                        />
                    </div>

                    {/* Ficha Rápida del Cliente Seleccionado */}
                    {activeClient && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-wrap gap-x-8 gap-y-2 mt-4 text-sm animate-in fade-in">
                            <div className="flex flex-col">
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Identificación</span>
                                <span className="font-medium text-gray-700">{activeClient.taxId || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Email</span>
                                <span className="font-medium text-gray-700">{activeClient.email || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Teléfono</span>
                                <span className="font-medium text-gray-700">{activeClient.phone || 'N/A'}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Condiciones y Notas (1/3 width) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Hash size={20} className="text-[#1ab394]" /> 
                        Parámetros Fijos
                    </h3>
                    
                    <div className="space-y-4 flex-1 flex flex-col">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Condición de Pago</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as 'paid' | 'pending')}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1ab394]/30 focus:border-[#1ab394] transition-all font-medium"
                            >
                                <option value="pending">A Crédito (Pendiente de Pago)</option>
                                <option value="paid">Al Contado (Factura Pagada)</option>
                            </select>
                        </div>

                        <div className="flex-1 flex flex-col">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Observaciones</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full flex-1 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1ab394]/30 transition-all resize-none text-sm min-h-[80px]"
                                placeholder="Escriba notas adicionales..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Sección Items & Tabla */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Package size={20} className="text-[#1ab394]" /> 
                        Detalle de Artículos / Servicios
                    </h3>
                    
                    {/* Inyector de Inventario */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <SearchableSelect<Product>
                                items={products}
                                value={selectedProductId}
                                onChange={(id) => {
                                    // Comportamiento auto-agregar si lo seleccionan
                                    setSelectedProductId(id);
                                }}
                                placeholder="Escriba el nombre o el ID del producto que busca..."
                                filterItem={(product, search) => 
                                    product.name.toLowerCase().includes(search.toLowerCase()) || 
                                    product.id.toLowerCase().includes(search.toLowerCase())
                                }
                                getDisplayValue={(id, items) => {
                                    const p = items.find(i => i.id === id);
                                    return p ? `[#${p.id}] ${p.name}` : '';
                                }}
                                renderItem={(product) => (
                                    <div className="flex justify-between items-center sm:pr-4">
                                        <div className="flex flex-col">
                                            <div className="font-bold text-gray-800">
                                                <span className="text-[#1ab394] mr-2">#{product.id}</span>
                                                {product.name}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 line-clamp-1">{product.description || 'Sin descripción'}</div>
                                        </div>
                                        <div className="font-bold text-gray-700 whitespace-nowrap bg-gray-100 px-3 py-1 rounded-lg text-sm hidden sm:block">
                                            RD$ {product.price.toLocaleString('es-DO')}
                                        </div>
                                    </div>
                                )}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            disabled={!selectedProductId}
                            className="bg-[#1ab394] text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-[#159a7f] transition-all disabled:opacity-50 shadow-md shadow-[#1ab394]/20 shrink-0"
                        >
                            <Plus size={20} /> Añadir Fila
                        </button>
                    </div>
                </div>

                {/* Tabla */}
                <div className="p-0 overflow-x-auto min-h-[250px] relative">
                    {items.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-white">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Package size={32} className="text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-medium">No se han añadido artículos.</p>
                            <p className="text-sm italic mt-1">Busque y seleccione un producto arriba para inyectarlo en la tabla.</p>
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-xs border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 w-12 text-center">#</th>
                                    <th className="px-6 py-4">Descripción del Artículo</th>
                                    <th className="px-6 py-4 w-32 text-center">Cantidad</th>
                                    <th className="px-6 py-4 w-40 text-right">Precio UND</th>
                                    <th className="px-6 py-4 w-40 text-right">Total</th>
                                    <th className="px-6 py-4 w-16 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-blue-50/20 transition-colors group">
                                        <td className="px-6 py-3 text-center text-gray-400 font-mono">{index + 1}</td>
                                        <td className="px-6 py-3 font-semibold text-gray-800">{item.productName}</td>
                                        <td className="px-6 py-3 text-center">
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                                                className="w-full max-w-[80px] mx-auto text-center bg-white border border-gray-200 focus:border-[#1ab394] focus:ring-2 focus:ring-[#1ab394]/20 rounded-lg px-2 py-1.5 outline-none transition-all font-medium text-gray-800"
                                            />
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.price}
                                                onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                                                className="w-full text-right bg-transparent border border-transparent focus:border-gray-200 focus:bg-white rounded-lg px-2 py-1.5 outline-none transition-all text-gray-600 focus:text-gray-800"
                                            />
                                        </td>
                                        <td className="px-6 py-3 text-right font-bold text-gray-800">
                                            {item.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(item.id)}
                                                className="p-2 text-rose-400 hover:text-white hover:bg-rose-500 rounded-xl transition-all"
                                                title="Eliminar línea"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer Sumarios & Boton */}
                <div className="bg-gray-50 border-t border-gray-200 p-6 flex flex-col md:flex-row justify-between items-end gap-6 relative">
                    <div className="w-full md:w-auto text-sm text-gray-500 bg-white p-4 rounded-xl border border-gray-100 shadow-sm self-start">
                        <div className="flex items-center gap-2 mb-2 font-bold text-gray-700"><CheckCircle2 size={16} className="text-emerald-500"/> Validaciones</div>
                        <ul className="space-y-1 ml-6 list-disc marker:text-gray-300">
                            <li>El I.T.B.I.S (18%) se calcula automáticamente.</li>
                            <li>Los precios unitarios pueden manipularse en la tabla.</li>
                        </ul>
                    </div>

                    <div className="w-full md:w-80 flex flex-col gap-2">
                        <div className="flex justify-between text-gray-500 px-2 font-medium">
                            <span>Subtotal:</span>
                            <span className="font-mono">RD$ {subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 px-2 font-medium">
                            <span>ITBIS (18%):</span>
                            <span className="font-mono">RD$ {tax.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="h-px bg-gray-200 my-2"></div>
                        <div className="flex justify-between text-2xl font-black text-gray-800 px-2 mb-6">
                            <span>TOTAL:</span>
                            <span className="text-[#1ab394]">RD$ {total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!clientId || items.length === 0}
                            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-lg text-white shadow-xl transition-all duration-300 ${
                                !clientId || items.length === 0
                                    ? 'bg-gray-300 cursor-not-allowed shadow-none'
                                    : 'bg-[#2f4050] hover:bg-[#1f2b36] hover:shadow-[#2f4050]/40 translate-y-[-2px]'
                            }`}
                        >
                            <FileText size={20} />
                            Guardar y Procesar
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default CreateInvoice;
