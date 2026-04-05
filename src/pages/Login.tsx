import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Acceso denegado');
            }

            // Exitoso
            login(data.token, data.user);
            navigate('/'); // Ir al Dashboard

        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Error conectando al servidor.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f3f3f4] animate-fade-in">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md animate-scale-in border border-[#e7eaec]">
                
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-[#1ab394]/10 rounded-full flex items-center justify-center mb-4">
                        <Lock size={32} className="text-[#1ab394]" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#676a6c]">Acceso Restringido</h1>
                    <p className="text-sm text-[#888888] mt-1">Ingresa tus credenciales para continuar</p>
                </div>

                {error && (
                    <div className="bg-danger/10 border border-danger/20 text-danger p-3 rounded-lg mb-6 flex items-center gap-2 text-sm">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-[#676a6c] mb-2">Usuario</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User size={18} className="text-[#a7b1c2]" />
                            </div>
                            <input
                                type="text"
                                className="input !pl-10 h-11 text-base w-full bg-[#f8f8f8] border border-[#e7eaec] focus:bg-white focus:border-[#1ab394] transition-all rounded"
                                placeholder="nombre de usuario"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#676a6c] mb-2">Contraseña</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={18} className="text-[#a7b1c2]" />
                            </div>
                            <input
                                type="password"
                                className="input !pl-10 h-11 text-base w-full bg-[#f8f8f8] border border-[#e7eaec] focus:bg-white focus:border-[#1ab394] transition-all rounded"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-primary w-full h-11 text-base shadow-lg shadow-primary/20 mt-2 flex justify-center items-center"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-[#e7eaec] pt-6">
                    <p className="text-xs text-[#a7b1c2]">Sistema de Gestión Administrativa Segura</p>
                    <p className="text-xs text-[#a7b1c2] font-mono mt-1">v.1.0 SQL Encrypted</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
