import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { Edit2, Trash2, Plus, Search, Users, ArrowLeft, Save, MapPin, Briefcase, CreditCard } from 'lucide-react';
import type { Client } from '../types';

const Clients: React.FC = () => {
    const { clients, addClient, updateClient, deleteClient } = useStore();
    const { can } = useAuth();

    // View State
    const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Detalle Vista Rapida (Solo temporal overlay, opcional o se quita al tener un buen row, pero mantendremos la tuya)
    const [viewClient, setViewClient] = useState<Client | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Client>>({});

    const handleOpenForm = (client?: Client) => {
        if (client) {
            setEditingClient(client);
            setFormData(client);
        } else {
            setEditingClient(null);
            setFormData({
                name: '', email: '', phone: '', address: '', taxId: '', city: '', contactPerson: '', creditLimit: 0, hasCreditEnabled: false, taxCondition: 'B02'
            });
        }
        setViewMode('form');
    };

    const handleCloseForm = () => {
        setViewMode('list');
        setEditingClient(null);
        setFormData({});
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value) 
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Simple mock of required
        if(!formData.name || !formData.taxId) return;

        const clientPayload = {
            name: formData.name || '',
            email: formData.email || '',
            phone: formData.phone || '',
            address: formData.address || '',
            taxId: formData.taxId || '',
            city: formData.city || '',
            contactPerson: formData.contactPerson || '',
            creditLimit: formData.creditLimit || 0,
            hasCreditEnabled: formData.hasCreditEnabled || false,
            taxCondition: formData.taxCondition || 'B02'
        };

        if (editingClient) {
            updateClient(editingClient.id, clientPayload);
        } else {
            addClient(clientPayload);
        }
        handleCloseForm();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('¿Está seguro de eliminar este cliente?')) {
            deleteClient(id);
        }
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.taxId.includes(searchTerm) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full">
            {viewClient && <ClientDetailModal client={viewClient} onOpenEdit={() => { handleOpenForm(viewClient); setViewClient(null); }} onClose={() => setViewClient(null)} />}

            {/* VISTA MODO LISTA */}
            {viewMode === 'list' && (
                <div className="animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto">
                    {/* Premium Header Profile */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#2f4050] via-[#212c38] to-[#1ab394]/90 rounded-2xl p-8 mb-8 shadow-2xl shadow-[#1ab394]/20 border border-white/10">
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-white">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-semibold tracking-wider text-white/90">
                                    <Users size={14} className="text-[#1ab394]" />
                                    MÓDULO DE RECEPTORES
                                </div>
                                <h2 className="text-4xl font-extrabold tracking-tight">
                                    Directorio Empresarial
                                </h2>
                                <p className="text-blue-100/80 max-w-md font-light text-sm leading-relaxed">
                                    Gestione de forma inmaculada su cartera de clientes, visualice perfiles rápidamente y mantenga los datos al día para facturar.
                                </p>
                            </div>
                            
                            {can('clients_manage') && (
                                <button 
                                    onClick={() => handleOpenForm()} 
                                    className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-[#2f4050] font-bold rounded-xl overflow-hidden shadow-xl hover:shadow-white/20 transition-all hover:scale-105 duration-300"
                                >
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                    <Plus size={20} className="text-[#1ab394]" />
                                    Nuevo Cliente
                                </button>
                            )}
                        </div>
                        
                        {/* Decorative background vectors */}
                        <div className="absolute top-0 right-0 -translate-y-12 translate-x-20 w-96 h-96 bg-[#1ab394] blur-[100px] opacity-20 rounded-full pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 translate-y-20 -translate-x-20 w-72 h-72 bg-blue-500 blur-[100px] opacity-20 rounded-full pointer-events-none"></div>
                    </div>

                    {/* Content Body - Glassmorphic Style */}
                    <div className="bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
                        
                        {/* Controls Bar */}
                        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shadow-inner">
                                    <Search size={18} />
                                </div>
                                <h3 className="font-semibold text-gray-700">Filtrar Clientes</h3>
                            </div>
                            <div className="relative group w-full sm:w-auto">
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, correo o ID..."
                                    className="w-full sm:w-80 pl-4 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 bg-white/80 focus:bg-white focus:border-[#1ab394] focus:ring-4 focus:ring-[#1ab394]/10 outline-none transition-all shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Search size={16} />
                                </div>
                            </div>
                        </div>

                        {/* Main Table Area */}
                        <div className="flex-1 p-0 overflow-x-auto">
                            {clients.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 px-4 text-center h-full">
                                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-1 ring-gray-100">
                                        <Users size={40} className="text-gray-300" />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-600 mb-2">Directorio Vacío</h4>
                                    <p className="text-gray-400 max-w-sm mb-6">
                                        Aún no existen clientes registrados en el sistema.
                                    </p>
                                    <button onClick={() => handleOpenForm()} className="btn btn-primary px-6 py-2.5 shadow-lg shadow-primary/30">
                                        Registrar mi primero
                                    </button>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 text-xs uppercase tracking-widest text-gray-500 font-semibold border-b border-gray-100">
                                            <th className="py-4 px-6 whitespace-nowrap">ID Cliente</th>
                                            <th className="py-4 px-6 whitespace-nowrap">Nombre Completo</th>
                                            <th className="py-4 px-6 whitespace-nowrap">RNC / Cédula</th>
                                            <th className="py-4 px-6 whitespace-nowrap text-right">Crédito</th>
                                            <th className="py-4 px-6 whitespace-nowrap text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredClients.map(client => (
                                            <tr key={client.id} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="py-4 px-6">
                                                    <span
                                                        onClick={() => setViewClient(client)}
                                                        className="font-mono text-xs text-[#1ab394] font-bold bg-[#1ab394]/10 px-3 py-1.5 rounded-md cursor-pointer hover:bg-[#1ab394] hover:text-white transition-all shadow-sm"
                                                        title="Ver Detalles"
                                                    >
                                                        {client.id.slice(0, 8)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="font-semibold text-gray-800">{client.name}</div>
                                                    <div className="text-xs text-gray-400 mt-0.5">{client.email}</div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="font-mono text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded text-sm">{client.taxId || 'N/A'}</span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="text-sm font-semibold text-emerald-600">
                                                        {client.creditLimit ? `RD$ ${client.creditLimit.toLocaleString()}` : 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        {can('clients_manage') && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleOpenForm(client)}
                                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                                                                    title="Editar"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(client.id)}
                                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                                                    title="Eliminar"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* VISTA MODO FORMULARIO INMERSIVO (Estilo Facturación) */}
            {viewMode === 'form' && (
                <div className="animate-in fade-in max-w-7xl mx-auto flex flex-col gap-6 pb-12 w-full">
                    {/* Premium Form Header */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#2f4050] via-[#212c38] to-[#1ab394]/90 rounded-2xl p-8 shadow-2xl shadow-[#1ab394]/20 border border-white/10">
                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 text-white">
                            <button onClick={handleCloseForm} className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white hover:text-[#2f4050] transition-all shadow-sm group shrink-0">
                                <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-semibold tracking-wider text-white/90 uppercase">
                                    <Briefcase size={14} className="text-[#1ab394]" />
                                    Registro Empresarial
                                </div>
                                <h2 className="text-4xl font-extrabold tracking-tight">
                                    {editingClient ? 'Edición de Cliente' : 'Alta de Nuevo Cliente'}
                                </h2>
                                <p className="text-blue-100/80 max-w-lg font-light text-sm leading-relaxed">
                                    Complete los datos de la ficha. Esta información estructurada le permitirá automatizar procesos contables y acelerar la facturación.
                                </p>
                            </div>
                        </div>
                        
                        {/* Decorative background vectors */}
                        <div className="absolute top-0 right-0 -translate-y-12 translate-x-20 w-96 h-96 bg-[#1ab394] blur-[100px] opacity-20 rounded-full pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 translate-y-20 -translate-x-20 w-72 h-72 bg-blue-500 blur-[100px] opacity-20 rounded-full pointer-events-none"></div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        
                        {/* Card 1: Datos Fundamentales */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                                <Users size={20} className="text-[#1ab394]" /> 
                                Identidad y Contacto Principal
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nombre Comercial o Razón Social *</label>
                                    <input type="text" name="name" required value={formData.name || ''} onChange={handleFormChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1ab394]/30 focus:border-[#1ab394] transition-all font-medium" placeholder="Ej. Inversiones Globales S.R.L." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Identificación Fiscal (RNC / Cédula) *</label>
                                    <input type="text" name="taxId" required value={formData.taxId || ''} onChange={handleFormChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1ab394]/30 focus:border-[#1ab394] transition-all font-medium" placeholder="131-XXXXX-X" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Correo Electrónico Principal</label>
                                    <input type="email" name="email" value={formData.email || ''} onChange={handleFormChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1ab394]/30 focus:border-[#1ab394] transition-all font-medium" placeholder="correo@empresa.com" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Teléfono Institucional</label>
                                    <input type="tel" name="phone" value={formData.phone || ''} onChange={handleFormChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1ab394]/30 focus:border-[#1ab394] transition-all font-medium" placeholder="809-XXX-XXXX" />
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Logistica y Representacion */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                                <MapPin size={20} className="text-[#1ab394]" /> 
                                Localidad y Representación
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Dirección Física (Facturación)</label>
                                    <input type="text" name="address" value={formData.address || ''} onChange={handleFormChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1ab394]/30 focus:border-[#1ab394] transition-all font-medium" placeholder="Av. Principal #123, Sector" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ciudad / Provincia <span className="text-gray-400 font-normal lowercase">(opcional)</span></label>
                                    <input type="text" name="city" value={formData.city || ''} onChange={handleFormChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1ab394]/30 focus:border-[#1ab394] transition-all font-medium" placeholder="Santo Domingo" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Representante / Persona de Contacto <span className="text-gray-400 font-normal lowercase">(opcional)</span></label>
                                    <input type="text" name="contactPerson" value={formData.contactPerson || ''} onChange={handleFormChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1ab394]/30 focus:border-[#1ab394] transition-all font-medium" placeholder="Lic. María López" />
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Datos Financieros */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                                <CreditCard size={20} className="text-[#1ab394]" /> 
                                Acuerdos Financieros
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Clasificación DGII (Comprobante Sugerido)</label>
                                    <select name="taxCondition" value={formData.taxCondition || 'B02'} onChange={handleFormChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1ab394]/30 focus:border-[#1ab394] transition-all font-medium">
                                        <option value="B01">Crédito Fiscal (B01) - Empresas/Negocios</option>
                                        <option value="B02">Consumo Final (B02) - Personas Físicas</option>
                                        <option value="B14">Regímenes Especiales (B14) - Zonas Francas/Embajadas</option>
                                        <option value="B15">Gubernamental (B15) - Instituciones Públicas</option>
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Configuración de Crédito</label>
                                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" name="hasCreditEnabled" checked={formData.hasCreditEnabled || false} onChange={handleFormChange} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1ab394]"></div>
                                        </label>
                                        <span className="text-sm font-bold text-gray-700">Habilitar Ventas a Crédito</span>
                                    </div>
                                    
                                    {formData.hasCreditEnabled && (
                                        <div className="animate-in slide-in-from-top-2 duration-300">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Límite de Crédito RD$</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                                                <input type="number" min="0" name="creditLimit" value={formData.creditLimit || ''} onChange={handleFormChange} className="w-full bg-white border border-gray-200 text-gray-800 rounded-xl pl-8 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#1ab394]/30 focus:border-[#1ab394] transition-all font-bold" placeholder="0.00" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="flex justify-end gap-4 mt-4">
                            <button type="button" onClick={handleCloseForm} className="px-6 py-3.5 rounded-xl font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all">
                                Cancelar
                            </button>
                            <button type="submit" className="px-8 py-3.5 rounded-xl font-bold text-white bg-[#2f4050] hover:bg-[#1f2b36] shadow-xl hover:shadow-[#2f4050]/40 transition-all flex items-center gap-2">
                                <Save size={20} />
                                {editingClient ? 'Actualizar Ficha de Cliente' : 'Registrar Nuevo Cliente'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

// Detail Modal (Extracted Component)
const ClientDetailModal = ({ client, onClose, onOpenEdit }: { client: Client, onClose: () => void, onOpenEdit: () => void }) => {
    if (!client) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="bg-[#2f4050] text-white p-6 relative">
                    <button onClick={onClose} className="absolute right-4 top-4 p-1 hover:bg-white/10 rounded-full transition-colors">
                        <Trash2 className="rotate-45" size={20} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 p-3 rounded-full">
                            <Users size={32} className="text-[#1ab394]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{client.name}</h2>
                            <p className="text-blue-200 text-sm">RNC: {client.taxId}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded border border-gray-100">
                            <span className="block text-xs uppercase text-gray-500 font-bold mb-1">ID Cliente</span>
                            <span className="font-mono text-[#1ab394] font-bold select-all">{client.id}</span>
                        </div>
                        <div className="p-4 bg-gray-50 rounded border border-gray-100">
                            <span className="block text-xs uppercase text-gray-500 font-bold mb-1">Crédito</span>
                            <span className="font-bold text-gray-700">
                                {client.creditLimit ? `RD$ ${client.creditLimit.toLocaleString()}` : "No asig."}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded transition-colors border-b border-gray-100">
                            <span className="text-gray-400 w-6">📍</span>
                            <div>
                                <span className="block text-xs text-gray-500">Dirección</span>
                                <span className="text-gray-800 font-medium">
                                    {client.address} {client.city ? `(${client.city})` : ''}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded transition-colors border-b border-gray-100">
                            <span className="text-gray-400 w-6">📞</span>
                            <div>
                                <span className="block text-xs text-gray-500">Contacto</span>
                                <span className="text-gray-800 font-medium">
                                    {client.phone} {client.contactPerson ? `- Ref: ${client.contactPerson}` : ''}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded transition-colors border-b border-gray-100">
                            <span className="text-gray-400 w-6">✉️</span>
                            <div>
                                <span className="block text-xs text-gray-500">Correo Electrónico</span>
                                <span className="text-[#1ab394] font-medium cursor-pointer">{client.email || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button onClick={onOpenEdit} className="px-4 py-2 border border-gray-200 text-gray-600 rounded flex items-center gap-2 hover:bg-gray-50 font-bold transition-all text-sm">
                            <Edit2 size={14} /> Editar
                        </button>
                        <button onClick={onClose} className="px-6 py-2 bg-[#2f4050] text-white rounded hover:bg-[#1f2b36] font-bold transition-all text-sm shadow-md">
                            Cerrar Ficha
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Clients;
