import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, FileText, Printer, ArrowRight, Undo2, GitBranch, X, CheckCircle2, Eye, PackageCheck } from 'lucide-react';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import type { Invoice, DocumentType } from '../types';

const Invoices: React.FC = () => {
    const navigate = useNavigate();
    const { invoices, clients, updateInvoiceStatus } = useStore();
    const { can } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchParams] = useSearchParams();
    
    // Read from URL, fallback to invoice
    const urlTab = searchParams.get('tab') as DocumentType | null;
    const activeTab: DocumentType = urlTab || 'invoice';



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

    const [selectedHistory, setSelectedHistory] = useState<string | null>(null);
    const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

    // Bloquear scroll al mostrar historial
    useEffect(() => {
        if (selectedHistory) {
            document.body.style.overflow = 'hidden';
            const scrollContainer = document.querySelector('.overflow-y-auto');
            if (scrollContainer) (scrollContainer as HTMLElement).style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            const scrollContainer = document.querySelector('.overflow-y-auto');
            if (scrollContainer) (scrollContainer as HTMLElement).style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
            const scrollContainer = document.querySelector('.overflow-y-auto');
            if (scrollContainer) (scrollContainer as HTMLElement).style.overflow = '';
        };
    }, [selectedHistory]);

    const handlePrint = (invoice: Invoice) => {
        const client = clients.find(c => c.id === invoice.clientId);
        generateInvoicePDF(invoice, client);
    };

    const handleConvert = (invoice: Invoice) => {
        if (invoice.type === 'order') {
            navigate(`/invoices/new?type=invoice&fromId=${invoice.id}`);
        } else if (invoice.type === 'invoice') {
            navigate(`/invoices/new?type=credit_note&fromId=${invoice.id}`);
        }
    };

    const relatedFlow = selectedHistory ? invoices.filter(inv => 
        inv.id === selectedHistory || 
        inv.parentId === selectedHistory || 
        inv.rootId === selectedHistory ||
        (inv.rootId && inv.rootId === invoices.find(i => i.id === selectedHistory)?.rootId)
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : [];

// ==========================================
// COMPONENTE: DocumentFlow (Nodos Interactivos)
// ==========================================
interface FlowNode {
    id: string;
    x: number;
    y: number;
    data: Invoice;
}

const DocumentFlow: React.FC<{ 
    documents: Invoice[], 
    activeId: string | null, 
    onNodeDoubleClick: (inv: Invoice) => void 
}> = ({ documents, activeId, onNodeDoubleClick }) => {
    const [nodes, setNodes] = useState<FlowNode[]>([]);
    const [dragging, setDragging] = useState<{ id: string, offsetX: number, offsetY: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Inicializar posiciones
    useEffect(() => {
        if (documents.length === 0) return;

        const initialNodes: FlowNode[] = [];
        const root = documents.find(d => !d.parentId || d.type === 'order') || documents[0];
        if (!root) return;
        
        const levels: Record<string, number> = {};
        const getLevel = (id: string, depth: number) => {
            levels[id] = depth;
            documents.filter(d => d.parentId === id).forEach(child => getLevel(child.id, depth + 1));
        };
        getLevel(root.id, 0);

        const levelCounts: Record<number, number> = {};
        documents.forEach(doc => {
            const lvl = levels[doc.id] || 0;
            const count = levelCounts[lvl] || 0;
            
            initialNodes.push({
                id: doc.id,
                x: 50 + lvl * 320,
                y: 50 + count * 180,
                data: doc
            });
            levelCounts[lvl] = count + 1;
        });

        setNodes(initialNodes);
    }, [documents]);

    const handleMouseDown = (id: string) => (e: React.MouseEvent) => {
        const node = nodes.find(n => n.id === id);
        if (!node || !containerRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - node.x;
        const offsetY = e.clientY - rect.top - node.y;
        
        setDragging({ id, offsetX, offsetY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - dragging.offsetX;
        const y = e.clientY - rect.top - dragging.offsetY;

        setNodes(prev => prev.map(node => 
            node.id === dragging.id ? { ...node, x, y } : node
        ));
    };

    const handleMouseUp = () => setDragging(null);

    return (
        <div 
            ref={containerRef}
            className="w-full h-[600px] relative bg-white rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing border border-slate-100 shadow-inner"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* SVG para las líneas conectoras */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                    </marker>
                </defs>
                {nodes.map(node => {
                    const children = nodes.filter(child => child.data.parentId === node.id);
                    return children.map(child => {
                        // Conectar desde el centro derecho del padre al centro izquierdo del hijo
                        const startX = node.x + 256; // Ancho del nodo w-64
                        const startY = node.y + 60;  // Mitad aprox de la altura
                        const endX = child.x;
                        const endY = child.y + 60;
                        
                        // Curva Bezier para suavizar
                        const cp1x = startX + (endX - startX) / 2;
                        const cp2x = startX + (endX - startX) / 2;

                        return (
                            <path
                                key={`${node.id}-${child.id}`}
                                d={`M ${startX} ${startY} C ${cp1x} ${startY}, ${cp2x} ${endY}, ${endX} ${endY}`}
                                stroke="#cbd5e1"
                                strokeWidth="3"
                                fill="none"
                                markerEnd="url(#arrowhead)"
                                strokeDasharray="8,5"
                                className="animate-[dash_20s_linear_infinite]"
                            />
                        );
                    });
                })}
            </svg>

            {/* Nodos (Documentos) */}
            {nodes.map(node => {
                const isActive = node.id === activeId;
                const type = node.data.type;
                const isDragging = dragging?.id === node.id;

                return (
                    <div
                        key={node.id}
                        onMouseDown={handleMouseDown(node.id)}
                        onDoubleClick={() => onNodeDoubleClick(node.data)}
                        style={{ left: node.x, top: node.y }}
                        className={`
                            absolute w-64 p-6 rounded-[2.5rem] shadow-2xl select-none transition-all cursor-move
                            ${isActive ? 'ring-4 ring-primary ring-offset-4 z-20 scale-105' : 'z-10'}
                            ${isDragging ? 'scale-110 rotate-2 z-30 opacity-90 shadow-primary/20' : ''}
                            ${type === 'order' ? 'bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200' : 
                              type === 'invoice' ? 'bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200' : 
                              'bg-gradient-to-br from-rose-50 to-white border-2 border-rose-200'}
                            hover:shadow-primary/10 hover:border-primary/30
                        `}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`
                                w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg
                                ${type === 'order' ? 'bg-blue-500' : type === 'invoice' ? 'bg-[#1ab394]' : 'bg-rose-500'}
                            `}>
                                {type === 'order' ? <FileText size={22} /> : 
                                 type === 'invoice' ? <CheckCircle2 size={22} /> : 
                                 <Undo2 size={22} />}
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    {type === 'order' ? 'Pedido' : type === 'invoice' ? 'Factura' : 'Nota'}
                                </div>
                                <div className="font-bold text-gray-800 text-lg">#{node.id}</div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-sm font-black text-gray-800 truncate">{node.data.clientName}</div>
                            <div className="flex justify-between items-end">
                                <div className="text-[10px] text-gray-400 font-bold uppercase">{new Date(node.data.date).toLocaleDateString()}</div>
                                <div className="text-base font-black text-[#1ab394]">RD$ {node.data.total.toLocaleString()}</div>
                            </div>
                        </div>
                        {isActive && (
                            <div className="absolute -top-3 -right-3 bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-xl ring-2 ring-white">
                                ORIGEN
                            </div>
                        )}
                    </div>
                );
            })}
            <style>{`
                @keyframes dash {
                    to { stroke-dashoffset: -1000; }
                }
            `}</style>
        </div>
    );
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
                    
                    {activeTab === 'invoice' ? (
                        <div className="flex flex-col items-end gap-2">
                            <button 
                                disabled
                                className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gray-400 text-white font-bold rounded-xl cursor-not-allowed opacity-70"
                            >
                                Nuevo Documento
                            </button>
                            <span className="text-[10px] text-white/60 uppercase tracking-tighter font-bold">Cree un pedido primero para facturar</span>
                        </div>
                    ) : (
                        can(activeTab === 'order' ? 'orders_create' : 'invoices_create') && (
                            <button 
                                onClick={() => navigate(`/invoices/new?type=${activeTab}`)} 
                                className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-[#2f4050] font-bold rounded-xl overflow-hidden shadow-xl hover:shadow-white/20 transition-all hover:scale-105 duration-300"
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                <Plus size={20} className="text-[#1ab394]" />
                                Nuevo Documento
                            </button>
                        )
                    )}
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
                                    <tr 
                                        key={invoice.id} 
                                        onClick={() => setViewingInvoice(invoice)}
                                        className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                                    >
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
                                                invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                                invoice.status === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                invoice.status === 'invoiced' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                                invoice.status === 'delivered' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                                invoice.status === 'returned_total' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                                'bg-gray-100 text-gray-700 border border-gray-200'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    invoice.status === 'paid' ? 'bg-emerald-500' :
                                                    invoice.status === 'pending' ? 'bg-amber-500' :
                                                    invoice.status === 'invoiced' ? 'bg-blue-500' :
                                                    invoice.status === 'delivered' ? 'bg-purple-500' :
                                                    'bg-gray-500'
                                                }`}></span>
                                                {invoice.status === 'invoiced' ? 'Facturado' : 
                                                 invoice.status === 'delivered' ? 'Entregado' : 
                                                 invoice.status === 'returned_total' ? 'Devuelto' : 
                                                 invoice.status === 'paid' ? 'Pagado' : 
                                                 invoice.status === 'pending' ? 'Pendiente' : invoice.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="font-bold text-gray-800 text-base">
                                                RD$ {invoice.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex justify-center items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setViewingInvoice(invoice); }}
                                                    className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-blue-500 hover:border-blue-500 hover:shadow-md transition-all group-hover:bg-blue-50"
                                                    title="Ver Detalle"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handlePrint(invoice); }}
                                                    className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#1ab394] hover:border-[#1ab394] hover:shadow-md transition-all group-hover:bg-[#1ab394]/5"
                                                    title="Descargar Documento"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                                
                                                {(invoice.type === 'order' && can('invoices_create')) && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleConvert(invoice); }}
                                                        className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-blue-500 hover:border-blue-500 transition-all group-hover:bg-blue-50"
                                                        title="Convertir a Factura"
                                                    >
                                                        <ArrowRight size={16} />
                                                    </button>
                                                )}

                                                {(invoice.type === 'invoice' && can('credit_notes_create')) && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleConvert(invoice); }}
                                                        className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-rose-500 hover:border-rose-500 transition-all group-hover:bg-rose-50"
                                                        title="Crear Nota de Crédito"
                                                    >
                                                        <Undo2 size={16} />
                                                    </button>
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

            {/* Modal de Historial mediante Portal */}
            {selectedHistory && createPortal(
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#2f4050]/60 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 my-auto">
                        {/* Header Modal */}
                        <div className="px-8 py-6 bg-gradient-to-r from-[#2f4050] to-[#1ab394] text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <GitBranch size={20} /> Historial del Documento
                                </h3>
                                <p className="text-white/70 text-xs mt-1">Trazabilidad completa desde el pedido original</p>
                            </div>
                            <button 
                                onClick={() => setSelectedHistory(null)}
                                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        {/* Flowchart Content Interactivo */}
                        <div className="p-8 bg-slate-50/50">
                            <DocumentFlow 
                                documents={relatedFlow} 
                                activeId={viewingInvoice?.id || selectedHistory}
                                onNodeDoubleClick={(inv) => {
                                    setViewingInvoice(inv);
                                    setSelectedHistory(null);
                                }}
                            />
                            <div className="mt-6 flex items-center justify-center gap-8 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div> Pedido
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#1ab394]"></div> Factura
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-rose-500"></div> Nota de Crédito
                                </div>
                                <div className="ml-4 flex items-center gap-2 italic normal-case font-medium">
                                    * Doble clic para entrar • Arrastrar para organizar
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button 
                                onClick={() => setSelectedHistory(null)}
                                className="px-6 py-2.5 bg-[#2f4050] text-white font-bold rounded-xl hover:bg-[#1f2b36] transition-all shadow-lg shadow-[#2f4050]/20"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>,
                document.getElementById('modal-root')!
            )}

            {/* Modal de Detalle de Documento */}
            {viewingInvoice && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2f4050]/60 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 my-auto">
                        <div className="px-8 py-6 bg-gradient-to-r from-[#2f4050] to-[#212c38] text-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <FileText size={24} className="text-[#1ab394]" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Detalle de {viewingInvoice.type === 'order' ? 'Pedido' : viewingInvoice.type === 'invoice' ? 'Factura' : 'Nota'} #{viewingInvoice.id}</h3>
                                    <p className="text-white/60 text-xs">Emitido el {new Date(viewingInvoice.date).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {viewingInvoice.type === 'invoice' && viewingInvoice.status !== 'delivered' && can('mark_delivered') && (
                                    <button 
                                        onClick={() => {
                                            updateInvoiceStatus(viewingInvoice.id, 'delivered');
                                            setViewingInvoice(null);
                                        }}
                                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 text-white"
                                    >
                                        <PackageCheck size={16} /> Marcar Entregada
                                    </button>
                                )}
                                {viewingInvoice.type === 'order' && can('invoices_create') && (
                                    <button 
                                        onClick={() => {
                                            handleConvert(viewingInvoice);
                                            setViewingInvoice(null);
                                        }}
                                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        <ArrowRight size={16} /> Facturar Pedido
                                    </button>
                                )}
                                {viewingInvoice.type === 'invoice' && can('credit_notes_create') && (
                                    <button 
                                        onClick={() => {
                                            handleConvert(viewingInvoice);
                                            setViewingInvoice(null);
                                        }}
                                        className="px-4 py-2 bg-rose-500 hover:bg-rose-600 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-rose-500/20"
                                    >
                                        <Undo2 size={16} /> Nota de Crédito
                                    </button>
                                )}
                                <button 
                                    onClick={() => setSelectedHistory(viewingInvoice.rootId || viewingInvoice.id)}
                                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20 text-white"
                                >
                                    <GitBranch size={16} /> Ver Histórico
                                </button>
                                <button 
                                    onClick={() => setViewingInvoice(null)}
                                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Cliente</label>
                                        <p className="text-lg font-bold text-gray-800">{viewingInvoice.clientName}</p>
                                        <p className="text-sm text-gray-500">ID Cliente: {viewingInvoice.clientId}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Estado</label>
                                        <div className="mt-1">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize ${
                                                viewingInvoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                                                viewingInvoice.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                viewingInvoice.status === 'invoiced' ? 'bg-blue-100 text-blue-700' :
                                                viewingInvoice.status === 'delivered' ? 'bg-purple-100 text-purple-700' :
                                                'bg-rose-100 text-rose-700'
                                            }`}>
                                                {viewingInvoice.status === 'invoiced' ? 'Facturado' : 
                                                 viewingInvoice.status === 'delivered' ? 'Entregado' : 
                                                 viewingInvoice.status === 'returned_total' ? 'Devuelto' : 
                                                 viewingInvoice.status === 'paid' ? 'Pagado' : 
                                                 viewingInvoice.status === 'pending' ? 'Pendiente' : viewingInvoice.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right space-y-4">
                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Totales</label>
                                        <div className="mt-1 space-y-1">
                                            <div className="text-sm text-gray-500">Subtotal: RD$ {viewingInvoice.subtotal.toLocaleString()}</div>
                                            <div className="text-sm text-gray-500">ITBIS (18%): RD$ {viewingInvoice.tax.toLocaleString()}</div>
                                            <div className="text-2xl font-black text-[#1ab394]">Total: RD$ {viewingInvoice.total.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-gray-100 rounded-2xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                                        <tr>
                                            <th className="px-6 py-4">Producto</th>
                                            <th className="px-6 py-4 text-center">Cant.</th>
                                            <th className="px-6 py-4 text-right">Precio</th>
                                            <th className="px-6 py-4 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {viewingInvoice.items.map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-4 font-semibold text-gray-700">{item.productName}</td>
                                                <td className="px-6 py-4 text-center">{item.quantity}</td>
                                                <td className="px-6 py-4 text-right">RD$ {item.price.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right font-bold text-gray-800">RD$ {item.total.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {viewingInvoice.notes && (
                                <div className="mt-8 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-blue-400 block mb-2">Observaciones</label>
                                    <p className="text-sm text-blue-800 leading-relaxed italic">"{viewingInvoice.notes}"</p>
                                </div>
                            )}
                        </div>

                        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                            <div className="text-xs text-gray-400">
                                {viewingInvoice.parentId && <span>Vinculado al documento #{viewingInvoice.parentId}</span>}
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => handlePrint(viewingInvoice)}
                                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
                                >
                                    <Printer size={18} /> Imprimir PDF
                                </button>
                                <button 
                                    onClick={() => setViewingInvoice(null)}
                                    className="px-6 py-2.5 bg-[#2f4050] text-white font-bold rounded-xl hover:bg-[#1f2b36] transition-all shadow-lg"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Invoices;
