import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('factura_token');
        const storedUser = localStorage.getItem('factura_user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('factura_token', newToken);
        localStorage.setItem('factura_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem('factura_token');
        localStorage.removeItem('factura_user');
        setToken(null);
        setUser(null);
    };

    const can = (permission: string) => {
        if (!user) return false;
        if (user.role === 'admin' || user.permissions.includes('all')) return true;
        return user.permissions.includes(permission);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f3f3f4]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#1ab394] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#676a6c] font-bold">Iniciando Sistema Seguro...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, can }}>
            {children}
        </AuthContext.Provider>
    );
};
