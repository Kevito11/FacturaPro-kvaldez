import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Plus, Search, FileText, Printer } from 'lucide-react';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import type { Invoice, DocumentType } from '../types';

const Invoices: React.FC = () => {
    const navigate = useNavigate();
    const { invoices, clients } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Read from URL, fallback to invoice
    const urlTab = searchParams.get('tab') as DocumentType | null;
    const activeTab: DocumentType = urlTab || 'invoice';

    const setActiveTab = (type: DocumentType) => {
        setSearchParams({ tab: type });
    };

    const filteredInvoices = invoices.filter(invoice => {
        const matchesTab = (invoice.type || 'invoice') === activeTab;
        const matchesSearch = invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              invoice.id.includes(searchTerm);
        return matchesTab && matchesSearch;
    });

    const getTabName = (type: DocumentType) => {
        if (type === 'order') return 'Pedidos';
        if (type === 'invoice') return 'Facturas';
        if (type === 'credit_note') return 'Notas de Crédito';
        if (type === 'debit_note') return 'Notas de Débito';
        return '';
    };

    const handlePrint = (invoice: Invoice) => {
        const client = clients.find(c => c.id === invoice.clientId);
        generateInvoicePDF(invoice, client);
    };

    return (
        <div className="animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto">
            {/* Premium Header Profile */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#2f4050] via-[#212c38] to-[#1ab394]/90 rounded-2xl p-8 mb-8 shadow-2xl shadow-[#1ab394]/20 border border-white/10">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-white">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-semibold tracking-wider text-white/90">
                            <FileText size={14} className="text-[#1ab394]" />
                            MÓDULO DE EMISIÓN
                        </div>
                        <h2 className="text-4xl font-extrabold tracking-tight">
                            {getTabName(activeTab)}
                        </h2>
                        <p className="text-blue-100/80 max-w-md font-light text-sm leading-relaxed">
                            Gestione de forma inmaculada su historial de {getTabName(activeTab).toLowerCase()}, emita nuevos documentos y realice su contabilidad con un solo clic.
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => navigate(`/invoices/new?type=${activeTab}`)} 
                        className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-[#2f4050] font-bold rounded-xl overflow-hidden shadow-xl hover:shadow-white/20 transition-all hover:scale-105 duration-300"
                    >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                        <Plus size={20} className="text-[#1ab394]" />
                        Nuevo Documento
                    </button>
                </div>
                
                {/* Decorative background vectors */}
                <div className="absolute top-0 right-0 -translate-y-12 translate-x-20 w-96 h-96 bg-[#1ab394] blur-[100px] opacity-20 rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 translate-y-20 -translate-x-20 w-72 h-72 bg-blue-500 blur-[100px] opacity-20 rounded-full pointer-events-none"></div>
            </div>

            {/* Content Body - Glassmorphic / Polished Style */}
            <div className="bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden flex flex-col min-h-[500px]">
                
                {/* Controls Bar */}
                <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shadow-inner">
                            <Search size={18} />
                        </div>
                        <h3 className="font-semibold text-gray-700">Filtrar Documentos</h3>
                    </div>
                    <div className="relative group w-full sm:w-auto">
                        <input
                            type="text"
                            placeholder="Buscar por cliente o ID..."
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
                    {filteredInvoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center h-full">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-1 ring-gray-100">
                                <FileText size={40} className="text-gray-300" />
                            </div>
                            <h4 className="text-xl font-bold text-gray-600 mb-2">Bandeja Vacía</h4>
                            <p className="text-gray-400 max-w-sm mb-6">
                                Aún no existen registros de {getTabName(activeTab).toLowerCase()} en el sistema para estos parámetros de búsqueda.
                            </p>
                            <button onClick={() => navigate(`/invoices/new?type=${activeTab}`)} className="btn btn-primary px-6 py-2.5 shadow-lg shadow-primary/30">
                                Generar mi primero
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 text-xs uppercase tracking-widest text-gray-500 font-semibold border-b border-gray-100">
                                    <th className="py-4 px-6 whitespace-nowrap">Emisión</th>
                                    <th className="py-4 px-6 whitespace-nowrap">Cliente</th>
                                    <th className="py-4 px-6 whitespace-nowrap">Estado</th>
                                    <th className="py-4 px-6 whitespace-nowrap text-right">Monto Total</th>
                                    <th className="py-4 px-6 whitespace-nowrap text-center">Exportar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredInvoices.map(invoice => (
                                    <tr key={invoice.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="font-semibold text-gray-700">
                                                {new Date(invoice.date).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                            <div className="text-xs text-gray-400 font-mono mt-0.5">
                                                ID: {invoice.id}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="font-medium text-gray-800">{invoice.clientName}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize shadow-sm ${
                                                invoice.status === 'paid' ? 'bg-emerald-100/80 text-emerald-700 border border-emerald-200' :
                                                invoice.status === 'pending' ? 'bg-amber-100/80 text-amber-700 border border-amber-200' :
                                                'bg-rose-100/80 text-rose-700 border border-rose-200'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    invoice.status === 'paid' ? 'bg-emerald-500' :
                                                    invoice.status === 'pending' ? 'bg-amber-500' :
                                                    'bg-rose-500'
                                                }`}></span>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="font-bold text-gray-800 text-base">
                                                RD$ {invoice.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 flex justify-center">
                                            <button
                                                onClick={() => handlePrint(invoice)}
                                                className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#1ab394] hover:border-[#1ab394] hover:shadow-md transition-all group-hover:bg-[#1ab394]/5"
                                                title="Descargar Documento Generado"
                                            >
                                                <Printer size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Invoices;
