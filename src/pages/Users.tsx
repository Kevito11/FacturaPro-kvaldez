import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, Shield, Plus, Trash2, Key, Check, X, ShieldCheck, AlertCircle } from 'lucide-react';
import type { User, AppRole } from '../types';

const PERMISSIONS_LIST = [
    { id: 'clients_view', label: 'Ver Clientes', group: 'Clientes' },
    { id: 'clients_manage', label: 'Gestionar Clientes', group: 'Clientes' },
    { id: 'products_view', label: 'Ver Artículos', group: 'Artículos' },
    { id: 'products_manage', label: 'Gestionar Artículos', group: 'Artículos' },
    { id: 'orders_view', label: 'Ver Pedidos', group: 'Ventas' },
    { id: 'orders_create', label: 'Crear Pedidos', group: 'Ventas' },
    { id: 'invoices_view', label: 'Ver Facturas', group: 'Ventas' },
    { id: 'invoices_create', label: 'Emitir Facturas', group: 'Ventas' },
    { id: 'invoices_cancel', label: 'Anular Facturas', group: 'Ventas' },
    { id: 'credit_notes_create', label: 'Emitir Notas de Crédito', group: 'Finanzas' },
    { id: 'reports_view', label: 'Ver Reportes', group: 'Sistema' },
    { id: 'users_manage', label: 'Gestionar Usuarios', group: 'Sistema' },
];

const Users: React.FC = () => {
    const { users, addUser, updateUser, deleteUser } = useStore();
    const { user: currentUser, can } = useAuth();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        password: '',
        role: 'vendedor' as AppRole,
        permissions: [] as string[]
    });

    if (!can('users_manage')) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
                    <Shield size={40} />
                </div>
                <h1 className="text-2xl font-black text-gray-800 mb-2">Acceso Denegado</h1>
                <p className="text-gray-500 max-w-md">No tienes los permisos suficientes para gestionar el sistema de seguridad y usuarios.</p>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            await updateUser(editingUser.id, {
                fullName: formData.fullName,
                role: formData.role,
                permissions: formData.permissions,
                ...(formData.password ? { password: formData.password } : {})
            });
        } else {
            await addUser({
                username: formData.username,
                fullName: formData.fullName,
                password: formData.password,
                role: formData.role,
                permissions: formData.permissions
            });
        }
        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setFormData({ username: '', fullName: '', password: '', role: 'vendedor', permissions: [] });
        setEditingUser(null);
    };

    const togglePermission = (permId: string) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permId)
                ? prev.permissions.filter(p => p !== permId)
                : [...prev.permissions, permId]
        }));
    };

    const openEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            fullName: user.fullName || '',
            password: '',
            role: user.role,
            permissions: user.permissions
        });
        setIsModalOpen(true);
    };

    const handleRoleChange = (role: AppRole) => {
        // Sugerir permisos basados en rol
        let suggested: string[] = [];
        if (role === 'admin') suggested = ['all'];
        else if (role === 'vendedor') suggested = ['clients_view', 'products_view', 'orders_view', 'orders_create', 'invoices_view'];
        else if (role === 'contable') suggested = ['invoices_view', 'reports_view', 'credit_notes_create'];
        else if (role === 'almacen') suggested = ['products_view', 'invoices_view', 'orders_view'];
        
        setFormData(prev => ({ ...prev, role, permissions: suggested }));
    };

    return (
        <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                        <ShieldCheck className="text-primary" size={32} /> Gestión de Seguridad
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Administra roles, permisos y accesos de usuarios al sistema.</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="btn btn-primary flex items-center gap-2 px-6 py-3 rounded-2xl shadow-lg shadow-primary/20"
                >
                    <Plus size={20} /> Nuevo Usuario
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(u => (
                    <div key={u.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${u.role === 'admin' ? 'bg-amber-400' : 'bg-primary'}`}></div>
                        
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <UserIcon size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 capitalize leading-tight">{u.fullName || u.username}</h3>
                                    <div className="text-[10px] text-gray-400 mb-1 font-mono">{u.username}</div>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                        u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {u.role}
                                    </span>
                                </div>
                            </div>
                            {u.id !== '1' && (
                                <button 
                                    onClick={() => deleteUser(u.id)}
                                    className="text-gray-300 hover:text-rose-500 transition-colors p-2"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-1.5">
                                {u.permissions.includes('all') ? (
                                    <span className="text-[10px] bg-amber-50 text-amber-600 font-bold px-2 py-1 rounded-lg border border-amber-100 flex items-center gap-1">
                                        <Shield size={10} /> Control Total
                                    </span>
                                ) : u.permissions.slice(0, 3).map(p => (
                                    <span key={p} className="text-[10px] bg-slate-50 text-slate-500 font-bold px-2 py-1 rounded-lg border border-slate-100">
                                        {p.replace('_', ' ')}
                                    </span>
                                ))}
                                {u.permissions.length > 3 && !u.permissions.includes('all') && (
                                    <span className="text-[10px] bg-slate-50 text-slate-400 font-bold px-2 py-1 rounded-lg border border-slate-100">
                                        +{u.permissions.length - 3} más
                                    </span>
                                )}
                            </div>
                            
                            <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                                <div className="text-[10px] text-gray-400 font-medium">Creado: {new Date(u.createdAt).toLocaleDateString()}</div>
                                <button 
                                    onClick={() => openEdit(u)}
                                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                >
                                    <Key size={14} /> Editar Accesos
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Usuario */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2f4050]/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/20">
                        <div className="px-8 py-6 bg-gradient-to-r from-[#2f4050] to-[#212c38] text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                                    <p className="text-white/60 text-xs mt-0.5">Configura privilegios y credenciales</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2 block">Nombre Completo (Empleado)</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-gray-700"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                            placeholder="ej. Juan Pérez"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2 block">Nombre de Usuario (Login)</label>
                                        <input 
                                            type="text" 
                                            disabled={!!editingUser}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-primary/20 outline-none font-bold text-gray-700 disabled:opacity-50"
                                            value={formData.username}
                                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                                            placeholder="ej. jdoe"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2 block">
                                            {editingUser ? 'Cambiar Contraseña' : 'Contraseña'}
                                        </label>
                                        <input 
                                            type="password" 
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-primary/20 outline-none font-mono"
                                            value={formData.password}
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            placeholder={editingUser ? '•••••••• (dejar vacío para no cambiar)' : '••••••••'}
                                            required={!editingUser}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2 block">Rol Sugerido</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {(['admin', 'vendedor', 'contable', 'almacen'] as AppRole[]).map(r => (
                                                <button
                                                    key={r}
                                                    type="button"
                                                    onClick={() => handleRoleChange(r)}
                                                    className={`px-4 py-3 rounded-2xl text-sm font-bold text-left transition-all border-2 ${
                                                        formData.role === r 
                                                        ? 'bg-primary/5 border-primary text-primary' 
                                                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                                    }`}
                                                >
                                                    <span className="capitalize">{r}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-6">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 block">Personalizar Permisos Detallados</label>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                                        {Array.from(new Set(PERMISSIONS_LIST.map(p => p.group))).map(group => (
                                            <div key={group} className="space-y-3">
                                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-tighter border-b border-gray-200 pb-2">{group}</h4>
                                                {PERMISSIONS_LIST.filter(p => p.group === group).map(perm => (
                                                    <label key={perm.id} className="flex items-center gap-3 cursor-pointer group">
                                                        <div 
                                                            onClick={() => togglePermission(perm.id)}
                                                            className={`w-10 h-6 rounded-full transition-all relative ${
                                                                formData.permissions.includes(perm.id) || formData.permissions.includes('all')
                                                                ? 'bg-primary' : 'bg-gray-200'
                                                            }`}
                                                        >
                                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                                                                formData.permissions.includes(perm.id) || formData.permissions.includes('all')
                                                                ? 'left-5' : 'left-1'
                                                            }`}></div>
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-600 group-hover:text-primary transition-colors">{perm.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                                        <AlertCircle className="text-amber-600 shrink-0" size={20} />
                                        <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                                            <strong>Seguridad Enterprise:</strong> Los cambios en los permisos se aplicarán la próxima vez que el usuario inicie sesión. Ten cuidado al asignar permisos de nivel "Gestionar" o "Anular".
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </form>

                        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                            <button 
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 bg-white text-gray-500 font-bold rounded-xl border border-gray-200 hover:bg-gray-100 transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSubmit}
                                className="px-8 py-2.5 bg-[#2f4050] text-white font-bold rounded-xl hover:bg-[#1f2b36] transition-all shadow-lg shadow-[#2f4050]/20 flex items-center gap-2"
                            >
                                <Check size={18} /> {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
