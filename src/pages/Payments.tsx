import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { 
    Plus, 
    Search, 
    CreditCard, 
    Calendar, 
    User, 
    CheckCircle2, 
    AlertCircle, 
    DollarSign,
    FileText,
    ArrowDownLeft,
    Clock,
    X,
    Check
} from 'lucide-react';
import type { Payment } from '../types';

const Payments: React.FC = () => {
    const { payments, clients, invoices, addPayment } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [clientId, setClientId] = useState('');
    const [amount, setAmount] = useState<number>(0);
    const [method, setMethod] = useState<Payment['method']>('cash');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

    const filteredPayments = useMemo(() => {
        return payments.filter(p => 
            p.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.reference?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [payments, searchTerm]);

    const activeClient = useMemo(() => clients.find(c => c.id === clientId), [clientId, clients]);
    
    const pendingInvoices = useMemo(() => {
        if (!clientId) return [];
        return invoices.filter(inv => inv.clientId === clientId && inv.status === 'pending' && (inv.type === 'invoice' || inv.type === 'debit_note'));
    }, [clientId, invoices]);

    const totalSelectedInvoices = useMemo(() => {
        return pendingInvoices
            .filter(inv => selectedInvoices.includes(inv.id))
            .reduce((sum, inv) => sum + inv.total, 0);
    }, [selectedInvoices, pendingInvoices]);

    const handleOpenModal = () => {
        setClientId('');
        setAmount(0);
        setMethod('cash');
        setReference('');
        setNotes('');
        setSelectedInvoices([]);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId || amount <= 0) return;

        await addPayment({
            clientId,
            clientName: activeClient?.name || 'Cliente Desconocido',
            amount,
            date: new Date().toISOString().split('T')[0],
            method,
            reference,
            notes,
            invoiceIds: selectedInvoices
        });

        setIsModalOpen(false);
    };

    return (
        <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header Premium */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#2f4050] via-[#212c38] to-indigo-900 rounded-[2.5rem] p-10 shadow-2xl shadow-indigo-500/10 border border-white/10">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-black tracking-widest text-white/80">
                            <CreditCard size={14} className="text-indigo-400" /> GESTIÓN DE COBROS Y PAGOS
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tight leading-none">Caja y Créditos</h1>
                        <p className="text-blue-100/60 max-w-lg font-light text-lg">Administre el flujo de efectivo, salde facturas pendientes y gestione el crédito a favor de sus clientes.</p>
                    </div>
                    
                    <button 
                        onClick={handleOpenModal}
                        className="group flex items-center gap-3 bg-[#1ab394] text-white px-8 py-5 rounded-2xl font-black text-lg hover:bg-[#159a7f] transition-all hover:scale-105 shadow-xl shadow-[#1ab394]/30"
                    >
                        <Plus size={24} /> Registrar Cobro
                    </button>
                </div>
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-indigo-500 blur-[150px] opacity-10 rounded-full pointer-events-none"></div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard 
                    icon={ArrowDownLeft} 
                    label="Ingresos Hoy" 
                    value={`RD$ ${payments.filter(p => p.date === new Date().toISOString().split('T')[0]).reduce((s, p) => s + p.amount, 0).toLocaleString()}`} 
                    color="emerald" 
                />
                <SummaryCard 
                    icon={CreditCard} 
                    label="Saldo a Favor Clientes" 
                    value={`RD$ ${clients.reduce((s, c) => s + (c.creditBalance || 0), 0).toLocaleString()}`} 
                    color="indigo" 
                />
                <SummaryCard 
                    icon={Clock} 
                    label="Total Transacciones" 
                    value={payments.length.toString()} 
                    color="blue" 
                />
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar cobros por cliente o referencia..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-[10px] font-black tracking-widest text-gray-400 uppercase border-b border-gray-50">
                            <tr>
                                <th className="px-8 py-5">Fecha</th>
                                <th className="px-8 py-5">Cliente</th>
                                <th className="px-8 py-5 text-center">Método</th>
                                <th className="px-8 py-5">Referencia</th>
                                <th className="px-8 py-5 text-right">Monto</th>
                                <th className="px-8 py-5 text-center">Facturas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredPayments.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50/30 transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                <Calendar size={18} />
                                            </div>
                                            <span className="text-sm font-bold text-gray-600">{p.date}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="font-bold text-gray-800">{p.clientName}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pago Recibido</div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                                            p.method === 'cash' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            p.method === 'transfer' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                            'bg-purple-50 text-purple-600 border-purple-100'
                                        }`}>
                                            {p.method}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-sm font-mono text-gray-400">{p.reference || 'S/N'}</span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="text-lg font-black text-gray-900">RD$ {p.amount.toLocaleString()}</div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="flex justify-center -space-x-2">
                                            {p.invoiceIds?.map((iid, i) => (
                                                <div key={iid} title={iid} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-white ${i % 2 === 0 ? 'bg-indigo-500' : 'bg-[#1ab394]'}`}>
                                                    #{iid.slice(-2)}
                                                </div>
                                            ))}
                                            {(!p.invoiceIds || p.invoiceIds.length === 0) && (
                                                <span className="text-[9px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">CRÉDITO A FAVOR</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Registrar Cobro */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-black/40 animate-in fade-in duration-300 overflow-y-auto">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500 my-8">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-gray-800">Registrar Nuevo Cobro</h3>
                                <p className="text-sm text-gray-400 font-medium">Complete los detalles de la recepción de efectivo o transferencia.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-gray-400 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Seleccionar Cliente</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <select 
                                            value={clientId} 
                                            onChange={(e) => {
                                                setClientId(e.target.value);
                                                setSelectedInvoices([]);
                                            }}
                                            required
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 appearance-none"
                                        >
                                            <option value="">Buscar Cliente...</option>
                                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Monto del Pago</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                                        <input 
                                            type="number" 
                                            value={amount} 
                                            onChange={(e) => setAmount(Number(e.target.value))}
                                            required
                                            min="1"
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-lg font-black outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            {clientId && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="flex justify-between items-end">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Aplicar a Facturas Pendientes</label>
                                        <span className="text-[10px] font-bold text-gray-400">Seleccionado: RD$ {totalSelectedInvoices.toLocaleString()}</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto pr-2">
                                        {pendingInvoices.length > 0 ? (
                                            pendingInvoices.map(inv => (
                                                <button
                                                    key={inv.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedInvoices(prev => 
                                                            prev.includes(inv.id) ? prev.filter(id => id !== inv.id) : [...prev, inv.id]
                                                        );
                                                    }}
                                                    className={`p-4 rounded-2xl border-2 transition-all flex justify-between items-center ${
                                                        selectedInvoices.includes(inv.id) 
                                                        ? 'bg-indigo-50 border-indigo-500' 
                                                        : 'bg-white border-gray-100 hover:border-gray-200'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedInvoices.includes(inv.id) ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                            {selectedInvoices.includes(inv.id) ? <Check size={14} /> : <FileText size={14} />}
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="text-xs font-bold text-gray-800">#{inv.id}</div>
                                                            <div className="text-[10px] text-gray-400 font-medium">{inv.date}</div>
                                                        </div>
                                                    </div>
                                                    <div className="font-black text-gray-800 text-sm">RD$ {inv.total.toLocaleString()}</div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                                                <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                                                <p className="text-xs font-bold text-gray-400">Cliente sin facturas pendientes.</p>
                                                <p className="text-[10px] text-gray-400 mt-1 uppercase">El monto se guardará como Crédito a Favor.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Método de Pago</label>
                                    <div className="flex gap-2">
                                        {(['cash', 'transfer', 'check', 'card'] as const).map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setMethod(m)}
                                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${
                                                    method === m 
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' 
                                                    : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                                                }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">No. Referencia / Comprobante</label>
                                    <input 
                                        type="text" 
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value)}
                                        className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                                        placeholder="Ej: Transf-100293"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-6 pt-4 border-t border-gray-50">
                                <div className="flex-1">
                                    {amount > totalSelectedInvoices && totalSelectedInvoices > 0 && (
                                        <div className="flex items-center gap-2 p-3 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold animate-in zoom-in-95 duration-300">
                                            <AlertCircle size={14} />
                                            Sobrante de RD$ {(amount - totalSelectedInvoices).toLocaleString()} se aplicará como saldo a favor.
                                        </div>
                                    )}
                                </div>
                                <button 
                                    type="submit" 
                                    className="px-12 py-5 bg-gray-900 text-white rounded-2xl font-black text-lg hover:bg-black transition-all shadow-2xl shadow-black/20"
                                >
                                    Confirmar Pago
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const SummaryCard = ({ icon: Icon, label, value, color }: any) => {
    const colors: any = {
        emerald: 'bg-emerald-50 text-emerald-600 shadow-emerald-200/20',
        indigo: 'bg-indigo-50 text-indigo-600 shadow-indigo-200/20',
        blue: 'bg-blue-50 text-blue-600 shadow-blue-200/20'
    };
    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all duration-500">
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${colors[color]}`}>
                <Icon size={32} />
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                <h4 className="text-2xl font-black text-gray-800 mt-1">{value}</h4>
            </div>
        </div>
    );
};

export default Payments;
