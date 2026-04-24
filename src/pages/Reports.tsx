import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { 
    Download, 
    AlertTriangle, 
    ChevronRight,
    CreditCard,
    FileText,
    ShoppingCart,
    RefreshCw,
    PieChart,
    BarChart3,
    ArrowLeft,
    Search
} from 'lucide-react';

type ReportType = 'credits' | 'orders' | 'invoices' | 'credit_notes' | 'reconciliation';

interface ReportOption {
    id: ReportType;
    title: string;
    description: string;
    icon: any;
    color: string;
}

const Reports: React.FC = () => {
    const { clients, invoices } = useStore();
    const { can } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
    const [dateRange, setDateRange] = useState(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
            start: firstDay.toISOString().split('T')[0],
            end: lastDay.toISOString().split('T')[0]
        };
    });

    const reportOptions: ReportOption[] = [
        { 
            id: 'invoices', 
            title: 'Reporte de Facturación', 
            description: 'Ventas consolidadas, estados de pago e impuestos generados.',
            icon: FileText,
            color: 'bg-blue-500'
        },
        { 
            id: 'orders', 
            title: 'Reporte de Pedidos', 
            description: 'Listado de cotizaciones y órdenes de compra en proceso.',
            icon: ShoppingCart,
            color: 'bg-[#1ab394]'
        },
        { 
            id: 'credit_notes', 
            title: 'Notas de Crédito', 
            description: 'Análisis de devoluciones, retornos y créditos aplicados.',
            icon: RefreshCw,
            color: 'bg-purple-500'
        },
        { 
            id: 'credits', 
            title: 'Análisis de Crédito', 
            description: 'Monitoreo de límites de crédito, deudas y riesgo de cartera.',
            icon: CreditCard,
            color: 'bg-rose-500'
        },
        { 
            id: 'reconciliation', 
            title: 'Pedidos vs Facturado', 
            description: 'Conciliación de pedidos para verificar qué falta por facturar.',
            icon: PieChart,
            color: 'bg-amber-500'
        }
    ];

    // --- Data Calculation Logic ---
    const creditReportData = useMemo(() => {
        if (selectedReport !== 'credits') return [];
        return clients.map(client => {
            const clientInvoices = invoices.filter(inv => inv.clientId === client.id && inv.status === 'pending' && (inv.type === 'invoice' || inv.type === 'debit_note'));
            const totalDebt = clientInvoices.reduce((sum, inv) => sum + inv.total, 0);
            const limit = client.creditLimit || 0;
            const percentageUsed = limit > 0 ? (totalDebt / limit) * 100 : (totalDebt > 0 ? 100 : 0);
            let status: 'ok' | 'near' | 'exceeded' = 'ok';
            if (totalDebt > limit && limit > 0) status = 'exceeded';
            else if (percentageUsed >= 80 && limit > 0) status = 'near';
            return { ...client, totalDebt, limit, overage: totalDebt > limit ? totalDebt - limit : 0, percentageUsed, status, invoiceCount: clientInvoices.length };
        }).filter(item => {
            const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            return item.totalDebt > 0 && matchSearch;
        }).sort((a, b) => b.totalDebt - a.totalDebt);
    }, [clients, invoices, selectedReport, searchTerm]);

    const generalReportData = useMemo(() => {
        if (!selectedReport || selectedReport === 'reconciliation' || selectedReport === 'credits') return [];
        let type: any = selectedReport === 'orders' ? 'order' : selectedReport === 'invoices' ? 'invoice' : 'credit_note';
        return invoices.filter(inv => {
            const matchType = inv.type === type;
            const matchDate = inv.date >= dateRange.start && inv.date <= dateRange.end;
            const matchSearch = inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                               inv.id.toLowerCase().includes(searchTerm.toLowerCase());
            return matchType && matchDate && matchSearch;
        }).sort((a, b) => b.date.localeCompare(a.date));
    }, [invoices, selectedReport, dateRange, searchTerm]);

    const reconciliationData = useMemo(() => {
        if (selectedReport !== 'reconciliation') return [];
        const orders = invoices.filter(inv => inv.type === 'order' && inv.date >= dateRange.start && inv.date <= dateRange.end);
        return orders.map(order => {
            const relatedInvoices = invoices.filter(inv => inv.parentId === order.id && inv.type === 'invoice');
            const totalInvoiced = relatedInvoices.reduce((sum, inv) => sum + inv.total, 0);
            return { orderId: order.id, clientName: order.clientName, date: order.date, orderTotal: order.total, invoicedTotal: totalInvoiced, pending: order.total - totalInvoiced, status: totalInvoiced >= order.total ? 'completado' : (totalInvoiced > 0 ? 'parcial' : 'pendiente') };
        }).filter(item => 
            item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            item.orderId.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [invoices, selectedReport, dateRange, searchTerm]);

    const exportToPDF = () => {
        if (!selectedReport) return;
        const doc = new jsPDF();
        const option = reportOptions.find(o => o.id === selectedReport);
        doc.setFontSize(20);
        doc.text(option?.title || 'Reporte', 14, 22);
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 30);
        
        let head, body;
        if (selectedReport === 'credits') {
            head = [['Cliente', 'Estado', 'Límite', 'Deuda']];
            body = creditReportData.map(r => [r.name, r.status, r.limit, r.totalDebt]);
        } else if (selectedReport === 'reconciliation') {
            head = [['Pedido', 'Cliente', 'Pedido Total', 'Facturado']];
            body = reconciliationData.map(r => [r.orderId, r.clientName, r.orderTotal, r.invoicedTotal]);
        } else {
            head = [['ID', 'Fecha', 'Cliente', 'Total']];
            body = generalReportData.map(r => [r.id, r.date, r.clientName, r.total]);
        }

        (doc as any).autoTable({ startY: 40, head, body, theme: 'grid', headStyles: { fillColor: [47, 64, 80] } });
        doc.save(`Reporte_${selectedReport}.pdf`);
    };

    if (!can('reports_view')) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
                <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6"><AlertTriangle size={40} /></div>
                <h1 className="text-2xl font-black text-gray-800 mb-2">Acceso No Autorizado</h1>
                <p className="text-gray-500 max-w-md">Su perfil no cuenta con permisos para visualizar reportes financieros.</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto w-full pb-12">
            
            {/* 1. MAIN MENU (If no report selected) */}
            {!selectedReport ? (
                <div className="space-y-10">
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#2f4050] via-[#212c38] to-[#1ab394]/90 rounded-[2.5rem] p-12 shadow-2xl shadow-[#1ab394]/20 border border-white/10 text-white">
                        <div className="relative z-10 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-black tracking-widest mb-6">
                                <BarChart3 size={14} className="text-[#1ab394]" /> SISTEMA DE INTELIGENCIA FACTURAPRO
                            </div>
                            <h1 className="text-5xl font-black tracking-tight mb-4 leading-tight">Centro de Reportes Financieros</h1>
                            <p className="text-blue-100/70 text-lg font-light">Seleccione el análisis que desea realizar. Todas nuestras herramientas están optimizadas para brindarle la visión más clara de su negocio.</p>
                        </div>
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-[#1ab394] blur-[150px] opacity-20 rounded-full pointer-events-none"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reportOptions.map((opt) => (
                            <button 
                                key={opt.id}
                                onClick={() => setSelectedReport(opt.id)}
                                className="group relative bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 text-left overflow-hidden"
                            >
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl ${opt.color} group-hover:scale-110 transition-transform duration-500`}>
                                    <opt.icon size={32} />
                                </div>
                                <h3 className="text-xl font-black text-gray-800 mb-2">{opt.title}</h3>
                                <p className="text-sm text-gray-400 font-medium leading-relaxed mb-6">{opt.description}</p>
                                <div className="flex items-center gap-2 text-[#1ab394] font-bold text-sm">
                                    Generar Reporte <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                                    <opt.icon size={120} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                /* 2. SPECIFIC REPORT VIEW */
                <div className="space-y-6">
                    {/* Header del Reporte Seleccionado */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-6">
                            <button 
                                onClick={() => setSelectedReport(null)}
                                className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-900 hover:text-white transition-all shadow-sm group"
                            >
                                <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${reportOptions.find(o => o.id === selectedReport)?.color}`}>
                                    {React.createElement(reportOptions.find(o => o.id === selectedReport)?.icon || FileText, { size: 28 })}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-800 leading-none mb-1">{reportOptions.find(o => o.id === selectedReport)?.title}</h2>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Vista Detallada del Análisis</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                            {selectedReport !== 'credits' && (
                                <>
                                    <div className="flex flex-col px-3">
                                        <span className="text-[10px] text-gray-400 font-black uppercase">Desde</span>
                                        <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent text-gray-700 text-sm outline-none font-bold" />
                                    </div>
                                    <div className="w-px h-8 bg-gray-200"></div>
                                    <div className="flex flex-col px-3">
                                        <span className="text-[10px] text-gray-400 font-black uppercase">Hasta</span>
                                        <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent text-gray-700 text-sm outline-none font-bold" />
                                    </div>
                                </>
                            )}
                            <button onClick={exportToPDF} className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center hover:bg-black transition-all shadow-lg shadow-black/10">
                                <Download size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Table Area */}
                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/20 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Resultados del Periodo</h3>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por cliente o ID..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all w-60" 
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto min-h-[400px]">
                            {selectedReport === 'credits' ? (
                                <CreditTable data={creditReportData} />
                            ) : selectedReport === 'reconciliation' ? (
                                <ReconciliationTable data={reconciliationData} />
                            ) : (
                                <GeneralTable data={generalReportData} />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Sub-Tables Components ---

const GeneralTable = ({ data }: { data: any[] }) => (
    <table className="w-full text-left">
        <thead className="bg-gray-50/50 text-[10px] font-black tracking-widest text-gray-400 uppercase border-b border-gray-50">
            <tr>
                <th className="px-8 py-5 text-center">Referencia</th>
                <th className="px-8 py-5">Fecha Emisión</th>
                <th className="px-8 py-5">Cliente / Razón Social</th>
                <th className="px-8 py-5 text-right">Monto Total</th>
                <th className="px-8 py-5 text-center">Estado</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
            {data.map(row => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5 text-center font-mono text-xs font-bold text-primary group-hover:scale-110 transition-transform">#{row.id.slice(0, 8)}</td>
                    <td className="px-8 py-5 text-xs font-medium text-gray-500">{row.date}</td>
                    <td className="px-8 py-5 font-bold text-gray-800">{row.clientName}</td>
                    <td className="px-8 py-5 text-right font-black text-gray-800">RD$ {row.total.toLocaleString()}</td>
                    <td className="px-8 py-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${row.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {row.status}
                        </span>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);

const CreditTable = ({ data }: { data: any[] }) => (
    <table className="w-full text-left">
        <thead className="bg-gray-50/50 text-[10px] font-black tracking-widest text-gray-400 uppercase border-b border-gray-50">
            <tr>
                <th className="px-8 py-5">Cliente</th>
                <th className="px-8 py-5 text-right">Límite</th>
                <th className="px-8 py-5 text-right">Deuda</th>
                <th className="px-8 py-5 text-right">Exceso</th>
                <th className="px-8 py-5">Uso de Línea</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
            {data.map(row => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-gray-800">{row.name}</td>
                    <td className="px-8 py-5 text-right font-bold text-gray-400">RD$ {row.limit.toLocaleString()}</td>
                    <td className="px-8 py-5 text-right font-black text-gray-800">RD$ {row.totalDebt.toLocaleString()}</td>
                    <td className={`px-8 py-5 text-right font-bold ${row.overage > 0 ? 'text-rose-600' : 'text-gray-200'}`}>
                        {row.overage > 0 ? `+RD$ ${row.overage.toLocaleString()}` : '0.00'}
                    </td>
                    <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                            <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-1000 ${row.percentageUsed > 100 ? 'bg-rose-500' : 'bg-primary'}`} style={{ width: `${Math.min(row.percentageUsed, 100)}%` }}></div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-500">{row.percentageUsed.toFixed(0)}%</span>
                        </div>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);

const ReconciliationTable = ({ data }: { data: any[] }) => (
    <table className="w-full text-left">
        <thead className="bg-gray-50/50 text-[10px] font-black tracking-widest text-gray-400 uppercase border-b border-gray-50">
            <tr>
                <th className="px-8 py-5 text-center">Ref. Pedido</th>
                <th className="px-8 py-5">Cliente</th>
                <th className="px-8 py-5 text-right">Original</th>
                <th className="px-8 py-5 text-right">Facturado</th>
                <th className="px-8 py-5 text-center">Estado</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
            {data.map(row => (
                <tr key={row.orderId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5 text-center font-mono text-xs font-bold text-primary">#{row.orderId.slice(0, 8)}</td>
                    <td className="px-8 py-5 font-bold text-gray-800">{row.clientName}</td>
                    <td className="px-8 py-5 text-right font-bold text-gray-400">RD$ {row.orderTotal.toLocaleString()}</td>
                    <td className="px-8 py-5 text-right font-black text-[#1ab394]">RD$ {row.invoicedTotal.toLocaleString()}</td>
                    <td className="px-8 py-5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase ${row.status === 'completado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                            {row.status}
                        </span>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);

export default Reports;
