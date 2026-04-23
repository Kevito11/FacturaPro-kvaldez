import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { Edit2, Trash2, Plus, Search, Package, ArrowLeft, Save, Tag, BarChart3, Database } from 'lucide-react';
import type { Product } from '../types';

const Products: React.FC = () => {
    const { products, addProduct, updateProduct, deleteProduct } = useStore();
    const { can } = useAuth();

    // View State
    const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Detalle Vista Rapida
    const [viewProduct, setViewProduct] = useState<Product | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Product>>({});

    const handleOpenForm = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData(product);
        } else {
            setEditingProduct(null);
            setFormData({
                name: '', description: '', price: 0, stock: 0, category: '', barcode: '', costPrice: 0
            });
        }
        setViewMode('form');
    };

    const handleCloseForm = () => {
        setViewMode('list');
        setEditingProduct(null);
        setFormData({});
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? Number(value) : value 
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if(!formData.name || formData.price === undefined) return;

        const productPayload = {
            name: formData.name || '',
            description: formData.description || '',
            price: formData.price || 0,
            stock: formData.stock || 0,
            category: formData.category || '',
            barcode: formData.barcode || '',
            costPrice: formData.costPrice || 0
        };

        if (editingProduct) {
            updateProduct(editingProduct.id, productPayload);
        } else {
            addProduct(productPayload);
        }
        handleCloseForm();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('¿Está seguro de eliminar este artículo?')) {
            deleteProduct(id);
        }
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.id && product.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.barcode && product.barcode.includes(searchTerm))
    );

    return (
        <div className="w-full">
            {viewProduct && <ProductDetailModal product={viewProduct} onOpenEdit={() => { handleOpenForm(viewProduct); setViewProduct(null); }} onClose={() => setViewProduct(null)} />}

            {/* VISTA MODO LISTA */}
            {viewMode === 'list' && (
                <div className="animate-in fade-in zoom-in-95 duration-500 max-w-7xl mx-auto">
                    {/* Premium Header Profile */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#2f4050] via-[#212c38] to-[#1ab394]/90 rounded-2xl p-8 mb-8 shadow-2xl shadow-[#1ab394]/20 border border-white/10">
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-white">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-semibold tracking-wider text-white/90">
                                    <Package size={14} className="text-[#1ab394]" />
                                    MÓDULO DE INVENTARIO
                                </div>
                                <h2 className="text-4xl font-extrabold tracking-tight">
                                    Catálogo Maestro
                                </h2>
                                <p className="text-blue-100/80 max-w-md font-light text-sm leading-relaxed">
                                    Gestione de forma centralizada todos sus productos y servicios, actualice precios y mantenga el control total de su inventario.
                                </p>
                            </div>
                            
                            {can('products_manage') && (
                                <button 
                                    onClick={() => handleOpenForm()} 
                                    className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-[#2f4050] font-bold rounded-xl overflow-hidden shadow-xl hover:shadow-white/20 transition-all hover:scale-105 duration-300"
                                >
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                    <Plus size={20} className="text-[#1ab394]" />
                                    Nuevo Artículo
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
                                <h3 className="font-semibold text-gray-700">Filtrar Artículos</h3>
                            </div>
                            <div className="relative group w-full sm:w-auto">
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, código o SKU..."
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
                            {products.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 px-4 text-center h-full">
                                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-1 ring-gray-100">
                                        <Package size={40} className="text-gray-300" />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-600 mb-2">Catálogo Vacío</h4>
                                    <p className="text-gray-400 max-w-sm mb-6">
                                        Aún no existen productos registrados en el sistema.
                                    </p>
                                    <button onClick={() => handleOpenForm()} className="btn btn-primary px-6 py-2.5 shadow-lg shadow-primary/30">
                                        Registrar mi primero
                                    </button>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 text-xs uppercase tracking-widest text-gray-500 font-semibold border-b border-gray-100">
                                            <th className="py-4 px-6 whitespace-nowrap">SKU / Reg.</th>
                                            <th className="py-4 px-6 whitespace-nowrap">Articulo e Identidad</th>
                                            <th className="py-4 px-6 whitespace-nowrap text-right">Precio de Venta</th>
                                            <th className="py-4 px-6 whitespace-nowrap text-center">Stock Base</th>
                                            <th className="py-4 px-6 whitespace-nowrap text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredProducts.map(product => (
                                            <tr key={product.id} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span
                                                            onClick={() => setViewProduct(product)}
                                                            className="font-mono text-xs text-[#1ab394] font-bold bg-[#1ab394]/10 px-3 py-1.5 rounded-md cursor-pointer hover:bg-[#1ab394] hover:text-white transition-all shadow-sm"
                                                            title="Ver Detalles"
                                                        >
                                                            {product.id}
                                                        </span>
                                                        {product.barcode && <span className="text-[10px] text-gray-400 font-mono tracking-wider">{product.barcode}</span>}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="font-semibold text-gray-800">{product.name}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {product.category && <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded uppercase font-bold">{product.category}</span>}
                                                        <div className="text-xs text-gray-400 line-clamp-1 max-w-[200px]">{product.description || 'Sin descripción'}</div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="font-bold text-gray-800 text-sm">
                                                        RD$ {product.price.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                                                        product.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                        {product.stock}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        {can('products_manage') && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleOpenForm(product)}
                                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                                                                    title="Editar"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(product.id)}
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
                                    <Package size={14} className="text-[#1ab394]" />
                                    Ficha de Inventario
                                </div>
                                <h2 className="text-4xl font-extrabold tracking-tight">
                                    {editingProduct ? 'Modificando Artículo' : 'Alta de Nuevo Artículo'}
                                </h2>
                                <p className="text-blue-100/80 max-w-lg font-light text-sm leading-relaxed">
                                    Asegúrese de establecer un costo preciso para el correcto cálculo del margen de utilidad comercial en sus reportes.
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
                                <Tag size={20} className="text-[#1ab394]" /> 
                                Identidad y Clasificación
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nombre Comercial del Artículo *</label>
                                    <input type="text" name="name" required value={formData.name || ''} onChange={handleFormChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1ab394]/30 focus:border-[#1ab394] transition-all font-medium" placeholder="Ej. Cable HDMI 2.0 4K 2 Metros" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Descripción Detallada <span className="text-gray-400 font-normal lowercase">(opcional)</span></label>
                                    <textarea name="description" value={formData.description || ''} onChange={handleFormChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1ab394]/30 focus:border-[#1ab394] transition-all resize-none text-sm min-h-[80px]" placeholder="Características principales del producto..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Categoría / Familia <span className="text-gray-400 font-normal lowercase">(opcional)</span></label>
                                    <input type="text" name="category" value={formData.category || ''} onChange={handleFormChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1ab394]/30 focus:border-[#1ab394] transition-all font-medium" placeholder="Ej. Electrónica" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Código de Barras (UPC/EAN) <span className="text-gray-400 font-normal lowercase">(opcional)</span></label>
                                    <input type="text" name="barcode" value={formData.barcode || ''} onChange={handleFormChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1ab394]/30 focus:border-[#1ab394] transition-all font-medium font-mono" placeholder="000000000000" />
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Precios y Rentabilidad */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                                <BarChart3 size={20} className="text-[#1ab394]" /> 
                                Rentabilidad Comercial
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Costo de Adquisición (RD$) <span className="text-gray-400 font-normal lowercase">(opcional)</span></label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                                        <input type="number" min="0" step="0.01" name="costPrice" value={formData.costPrice === undefined ? '' : formData.costPrice} onChange={handleFormChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl pl-8 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#1ab394]/30 focus:border-[#1ab394] transition-all font-medium" placeholder="0.00" />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Valor interno utilizado para reportes de margen bruto.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Precio de Venta al Público (RD$) *</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-emerald-500">$</span>
                                        <input type="number" min="0" step="0.01" name="price" required value={formData.price === undefined ? '' : formData.price} onChange={handleFormChange} className="w-full bg-emerald-50/50 border border-emerald-200 text-emerald-900 rounded-xl pl-8 pr-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-bold text-lg" placeholder="0.00" />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Este será el precio utilizado por defecto en la facturación.</p>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Control Operativo */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                                <Database size={20} className="text-[#1ab394]" /> 
                                Control de Almacén
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Existencia Actual (Stock Físico)</label>
                                    <input type="number" name="stock" value={formData.stock === undefined ? '' : formData.stock} onChange={handleFormChange} className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1ab394]/30 focus:border-[#1ab394] transition-all font-mono font-bold text-lg" placeholder="0" />
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
                                {editingProduct ? 'Actualizar Ficha de Artículo' : 'Registrar Nuevo Artículo'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

// Detail Modal (Extracted Component)
const ProductDetailModal = ({ product, onClose, onOpenEdit }: { product: Product, onClose: () => void, onOpenEdit: () => void }) => {
    if (!product) return null;
    
    // Rentabilidad simulada
    const hasMargin = product.costPrice && product.costPrice > 0;
    const margin = hasMargin ? ((product.price - product.costPrice!) / product.price) * 100 : 0;
    const profit = hasMargin ? product.price - product.costPrice! : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="bg-[#2f4050] text-white p-6 relative">
                    <button onClick={onClose} className="absolute right-4 top-4 p-1 hover:bg-white/10 rounded-full transition-colors">
                        <Trash2 className="rotate-45" size={20} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 p-3 rounded-full">
                            <Package size={32} className="text-[#1ab394]" />
                        </div>
                        <div>
                            <div className="text-xs text-white/50 tracking-wider font-mono">SKU: {product.id}</div>
                            <h2 className="text-xl font-bold">{product.name}</h2>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {product.description && (
                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                            <span className="block text-xs uppercase text-gray-500 font-bold mb-2">Descripción</span>
                            <p className="text-gray-700 leading-relaxed text-sm">{product.description}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg shadow-sm text-center">
                            <span className="block text-xs uppercase text-emerald-600 font-bold mb-1">Precio Público</span>
                            <span className="font-mono text-xl font-bold text-emerald-700">RD$ {product.price.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm text-center">
                            <span className="block text-xs uppercase text-gray-500 font-bold mb-1">Stock Físico</span>
                            <span className={`font-mono text-xl font-bold ${product.stock > 0 ? 'text-[#1ab394]' : 'text-rose-500'}`}>
                                {product.stock}
                            </span>
                        </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 px-2">
                        {product.category && (
                            <div className="flex flex-col">
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Categoría</span>
                                <span className="font-medium text-gray-700">{product.category}</span>
                            </div>
                        )}
                        {product.barcode && (
                            <div className="flex flex-col">
                                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Barras / UPC</span>
                                <span className="font-mono text-gray-700">{product.barcode}</span>
                            </div>
                        )}
                    </div>

                    {/* Margins */}
                    {hasMargin ? (
                        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl text-white text-xs flex justify-between items-center shadow-inner mt-4">
                            <div className="flex items-center gap-2">
                                <BarChart3 size={16} className="text-indigo-400"/>
                                <div className="flex flex-col">
                                    <span className="text-gray-400">Costo</span>
                                    <span className="font-mono">RD$ {product.costPrice?.toLocaleString('es-DO')}</span>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-gray-700"></div>
                            <div className="flex flex-col items-end">
                                <span className="text-gray-400">Margen Comercial</span>
                                <span className="font-mono font-bold text-emerald-400">
                                    {margin.toFixed(1)}% (+RD$ {profit.toLocaleString('es-DO')})
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 border border-gray-100 p-3 rounded text-gray-400 text-xs text-center border-dashed">
                            Sin datos de costo de adquisición para cálculo de margen.
                        </div>
                    )}

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

export default Products;
