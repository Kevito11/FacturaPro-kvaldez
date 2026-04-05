import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Package, FileText, Menu, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const { isLoading, error } = useStore();
    const { user, logout } = useAuth();

    return (
        <div className="flex h-screen bg-[#f3f3f4] text-[#676a6c] overflow-hidden font-sans">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Solid Dark */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-30 w-[220px] flex flex-col transition-transform duration-300 ease-in-out
                    lg:relative lg:translate-x-0 bg-[#2f4050] text-[#a7b1c2]
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* Profile / Header Area - Distinctive Style */}
                <div className="p-6 bg-[#212c38] flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 mb-3 grayscale-[30%]">
                        <img src={`https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=1ab394&color=fff&size=80`} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <div className="relative group cursor-pointer text-white font-semibold block w-full px-2 truncate capitalize">
                        {user?.username || 'Usuario'}
                    </div>
                    <div className="text-xs text-[#8095a8] mt-1 capitalize">{user?.role || 'Sistema'}</div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-2">
                    <NavItem to="/" icon={LayoutDashboard} label="Inicio" onClick={() => setIsSidebarOpen(false)} />
                    <NavItem to="/clients" icon={Users} label="Clientes" onClick={() => setIsSidebarOpen(false)} />
                    <NavItem to="/products" icon={Package} label="Artículos" onClick={() => setIsSidebarOpen(false)} />
                    
                    {/* Collapsible Section for Facturación */}
                    <DropdownNav icon={FileText} label="Facturación" basePath="/invoices" setIsSidebarOpen={setIsSidebarOpen}>
                        <SubNavItem to="/invoices" label="Facturas" />
                        <SubNavItem to="/invoices?tab=order" label="Pedidos" />
                        <SubNavItem to="/invoices?tab=credit_note" label="Notas de Crédito" />
                        <SubNavItem to="/invoices?tab=debit_note" label="Notas de Débito" />
                    </DropdownNav>
                </nav>

                <div className="p-4 bg-[#23303d] text-center">
                    {/* Generic Branding */}
                    <h1 className="text-white font-bold tracking-widest text-lg">FACTURAPRO</h1>
                    <p className="text-[10px] text-gray-500">v.1.0 Stable</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden bg-[#f3f3f4] flex flex-col h-screen w-full relative z-0">
                {/* Top Header - White & Clean */}
                <header className="bg-white border-b border-[#e7eaec] h-14 px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="bg-primary text-white p-1.5 rounded-sm hover:bg-primary-hover transition-colors lg:hidden"
                        >
                            <Menu size={20} />
                        </button>
                        <button className="bg-primary text-white p-1.5 rounded-sm hover:bg-primary-hover transition-colors hidden lg:block">
                            <Menu size={20} />
                        </button>
                        <h2 className="text-lg font-light hidden sm:block">Dashboard</h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={logout} className="text-[#999c9e] hover:text-[#676a6c] text-sm font-medium flex items-center gap-2">
                            <ArrowRight size={14} /> <span>Cerrar sesión</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-0 w-full flex flex-col">
                    {isLoading && (
                        <div className="p-6 flex-1 flex flex-col justify-center items-center min-h-full">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                            <div className="text-text-muted font-medium animate-pulse text-sm">Sincronizando con SQL Server...</div>
                        </div>
                    )}
                    {!isLoading && error && (
                        <div className="p-6 flex-1 flex flex-col justify-center items-center min-h-full text-center">
                            <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 max-w-md shadow-sm">
                                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                                <div className="font-bold text-lg mb-2">Error de Conexión</div>
                                <div className="text-red-500/80 text-sm">{error}</div>
                                <p className="text-xs text-red-400 mt-4">Asegúrate de configurar `.env` e iniciar `npm run dev` en la carpeta `server/`.</p>
                            </div>
                        </div>
                    )}
                    {!isLoading && !error && (
                        <div className="p-6 w-full flex-1 flex flex-col min-h-full mx-auto animate-page-enter" key={location.pathname}>
                            <Outlet />
                        </div>
                    )}
                    <footer className="bg-white p-4 text-right text-xs text-text-muted border-t border-[#e7eaec]">
                        <strong>Copyright</strong> FacturaPro &copy; 2026
                    </footer>
                </div>
            </main>
        </div>
    );
};

// Helper Component - Flat Style
interface NavItemProps {
    to: string;
    icon: React.ElementType;
    label: string;
    onClick?: () => void;
}
const NavItem = ({ to, icon: Icon, label, onClick }: NavItemProps) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `flex items-center gap-3 px-6 py-3.5 transition-all duration-200 border-l-4 group ${isActive
                ? 'bg-[#293846] text-white border-primary'
                : 'border-transparent text-[#a7b1c2] hover:bg-[#293846] hover:text-white hover:border-[#293846]'
            }`
        }
    >
        <Icon size={18} className="transition-transform duration-200 group-hover:scale-110" />
        <span className="text-[13px] font-medium transition-transform duration-200 group-hover:translate-x-1">{label}</span>
    </NavLink>
);

// Helper Component - Dropdown Flat Style
interface DropdownNavProps {
    icon: React.ElementType;
    label: string;
    basePath: string;
    children: React.ReactNode;
    setIsSidebarOpen: (v: boolean) => void;
}
const DropdownNav = ({ icon: Icon, label, basePath, children, setIsSidebarOpen }: DropdownNavProps) => {
    const location = useLocation();
    const isActiveParent = location.pathname.startsWith(basePath);
    const [isOpen, setIsOpen] = useState(isActiveParent);

    // Keep open if currently active
    React.useEffect(() => {
        if (isActiveParent) setIsOpen(true);
    }, [isActiveParent]);

    return (
        <div className="flex flex-col">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between px-6 py-3.5 transition-all duration-200 border-l-4 group w-full text-left ${isActiveParent
                    ? 'bg-[#293846] text-white border-primary'
                    : 'border-transparent text-[#a7b1c2] hover:bg-[#293846] hover:text-white hover:border-[#293846]'
                }`}
            >
                <div className="flex items-center gap-3">
                    <Icon size={18} className="transition-transform duration-200 group-hover:scale-110" />
                    <span className="text-[13px] font-medium transition-transform duration-200 group-hover:translate-x-1">{label}</span>
                </div>
                <span className={`text-[10px] opacity-70 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="flex flex-col border-l-2 border-[#1ab394]/30 ml-8 pl-4 pr-2 py-2 gap-1 my-1">
                        {React.Children.map(children, (child) => {
                            if (React.isValidElement(child)) {
                                return React.cloneElement(child, { onClick: () => setIsSidebarOpen(false) } as any);
                            }
                            return child;
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface SubNavItemProps {
    to: string;
    label: string;
    onClick?: () => void;
}
const SubNavItem = ({ to, label, onClick }: SubNavItemProps) => {
    const location = useLocation();
    // Determinamos si este sub-item es el activo buscando el param
    const currentSearch = location.search;
    const targetSearch = to.includes('?') ? '?' + to.split('?')[1] : '';
    const isActive = location.pathname === to.split('?')[0] && (currentSearch === targetSearch || (!targetSearch && (!currentSearch || currentSearch === '?tab=invoice')));

    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={`py-2 px-4 transition-all duration-200 text-xs rounded-lg my-0.5 w-full flex items-center gap-2 ${
                isActive 
                ? 'text-white font-bold bg-white/5' 
                : 'text-[#8095a8] hover:text-white hover:bg-white/5'
            }`}
        >
            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-primary' : 'bg-transparent'}`}></div>
            {label}
        </NavLink>
    );
};

export default Layout;
