import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ShoppingCart, ArrowRight, CornerUpLeft, Truck, Activity, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
    const { invoices } = useStore();

    // Calculations
    const totalRevenue = invoices.reduce((sum, inv) => {
        const type = inv.type || 'invoice';
        // Only sum revenue if the document is an invoice or debit note, and it's paid.
        // Also subtract credit notes as they are refunds.
        // Ignoring 'pending' for cash-flow realism or just accumulating? Let's just follow previous logic but with types.
        if (type === 'invoice' || type === 'debit_note') {
            return sum + inv.total;
        } else if (type === 'credit_note') {
            return sum - inv.total;
        }
        return sum; // orders do not sum to revenue
    }, 0);

    const activeOrders = invoices.filter(i => i.type === 'order').length;
    const creditNotes = invoices.filter(i => i.type === 'credit_note').length;

    // Chart Data (Only actual sales)
    const clientSales = invoices.filter(i => (i.type || 'invoice') === 'invoice').reduce((acc, inv) => {
        acc[inv.clientName] = (acc[inv.clientName] || 0) + inv.total;
        return acc;
    }, {} as Record<string, number>);

    const salesData = Object.entries(clientSales)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    // Recent Data
    const recentInvoices = [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    return (
        <div className="flex flex-col space-y-6">
            {/* Header Section - Clean & Simple */}
            <div className="bg-white border-b border-[#e7eaec] p-5 mb-2 shadow-sm flex justify-between items-center -mx-6 -mt-6 lg:-mx-8 lg:-mt-8">
                <div>
                    <h2 className="text-2xl font-light text-[#676a6c]">Panel de Control</h2>
                    <ol className="flex items-center gap-2 text-sm text-[#676a6c] mt-1">
                        <li>Inicio</li>
                        <li className="text-[#a7b1c2] text-xs">/</li>
                        <li className="font-bold">Dashboard</li>
                    </ol>
                </div>
                <div className="hidden sm:block text-right">
                    <span className="bg-[#1ab394] text-white px-3 py-1 text-xs font-bold rounded-sm shadow-sm">{new Date().toLocaleDateString()}</span>
                </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="animate-fade-in-up">
                    <StatCard type="success" icon={ShoppingCart} value={`RD$ ${totalRevenue.toLocaleString()}`} label="Ingresos Totales" link="/invoices" subLabel="Facturación Acumulada" />
                </div>
                <div className="animate-fade-in-up delay-100">
                    <StatCard type="info" icon={Activity} value={activeOrders} label="Pedidos Activos" link="/invoices" subLabel="Cotizaciones emitidas" />
                </div>
                <div className="animate-fade-in-up delay-200">
                    <StatCard type="warning" icon={Truck} value="12" label="Envíos Pendientes" subLabel="Requieren atención" />
                </div>
                <div className="animate-fade-in-up delay-300">
                    <StatCard type="danger" icon={CornerUpLeft} value={creditNotes} label="Notas C. / Devoluciones" link="/invoices" subLabel="Notas procesadas" />
                </div>
            </div>

            {/* Content Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[400px]">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-white border border-[#e7eaec] p-0 flex flex-col h-full">
                    <div className="border-b border-[#e7eaec] px-5 py-3 flex items-center justify-between">
                        <h5 className="font-bold text-[#676a6c] uppercase text-sm">Ventas por Cliente</h5>
                        <span className="label bg-primary text-white text-[10px] px-2 py-0.5 rounded-sm">Mensual</span>
                    </div>
                    <div className="p-5 flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7eaec" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} tickLine={false} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                                <Tooltip cursor={{ fill: '#f8f8f8' }} contentStyle={{ border: '1px solid #e7eaec', boxShadow: 'none' }} />
                                <Bar dataKey="value" fill="#1ab394" barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Notifications / List */}
                <div className="bg-white border border-[#e7eaec] flex flex-col h-full">
                    <div className="border-b border-[#e7eaec] px-5 py-3">
                        <h5 className="font-bold text-[#676a6c] uppercase text-sm">Actividad Reciente</h5>
                    </div>
                    <div className="p-0 overflow-y-auto flex-1 bg-white">
                        <ul className="divide-y divide-[#e7eaec]">
                            {recentInvoices.map(inv => (
                                <li key={inv.id} className="p-4 hover:bg-[#fcfcfc] flex items-center gap-3">
                                    <div className="text-[#1ab394] bg-[#1ab394]/10 p-2 rounded-full">
                                        <FileText size={16} />
                                    </div>
                                    <div className="flex-1">
                                        <small className="float-right text-muted text-[10px]">{new Date(inv.date).toLocaleDateString()}</small>
                                        <strong className="block text-sm text-[#676a6c]">
                                            {inv.type === 'order' ? 'Pedido Creado' : 
                                            inv.type === 'credit_note' ? 'Nota Crédito Emitida' : 
                                            inv.type === 'debit_note' ? 'Nota Débito Emitida' : 'Factura Generada'}
                                        </strong>
                                        <div className="text-xs text-[#888888]">{inv.clientName} - <span className={inv.type === 'credit_note' ? 'text-danger' : 'text-[#1ab394]'}>RD$ {inv.total.toLocaleString()}</span></div>
                                    </div>
                                </li>
                            ))}
                            {recentInvoices.length === 0 && (
                                <li className="p-8 text-center text-muted italic text-sm">No hay actividad reciente.</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Extracted Component
const StatCard = ({ type, icon: Icon, value, label, subLabel, link }: { type: string, icon: React.ElementType, value: string | number, label: string, subLabel?: string, link?: string }) => {
    const navigate = useNavigate();
    let iconColor = 'text-gray-400';

    // Theme Colors
    if (type === 'success') { iconColor = 'text-[#1ab394]'; }
    if (type === 'info') { iconColor = 'text-[#23c6c8]'; }
    if (type === 'warning') { iconColor = 'text-[#f8ac59]'; }
    if (type === 'danger') { iconColor = 'text-[#ed5565]'; }

    return (
        <div className="bg-white p-5 border-t-4 shadow-sm h-full flex flex-col justify-between relative hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer group" style={{ borderColor: type === 'success' ? '#1ab394' : type === 'info' ? '#23c6c8' : type === 'warning' ? '#f8ac59' : type === 'danger' ? '#ed5565' : '#e7eaec' }}>
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-3xl font-bold text-[#676a6c] mb-1">{value}</h3>
                <Icon size={40} className={`opacity-30 ${iconColor} absolute right-4 top-4`} />
            </div>
            <div>
                <span className="font-bold text-sm text-[#676a6c]">{label}</span>
                {subLabel && <div className="text-xs text-[#888888] mt-1">{subLabel}</div>}
            </div>
            {link && (
                <div onClick={() => navigate(link)} className="mt-4 pt-2 border-t border-[#e7eaec] text-xs text-[#1ab394] cursor-pointer hover:underline flex items-center gap-1">
                    Ver detalles <ArrowRight size={10} />
                </div>
            )}
        </div>
    );
};

export default Dashboard;
