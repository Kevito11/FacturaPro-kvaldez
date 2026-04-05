import React, { useState } from 'react';
import type { Client } from '../../types';

interface ClientFormProps {
    initialData?: Client | null;
    onSubmit: (data: Omit<Client, 'id' | 'createdAt'>) => void;
    onCancel: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        address: initialData?.address || '',
        taxId: initialData?.taxId || ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
                <label className="block text-sm font-medium mb-1 text-text-muted">Nombre Completo</label>
                <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="input"
                    placeholder="Juan Pérez"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 text-text-muted">Identificación (RNC/Cédula)</label>
                <input
                    type="text"
                    name="taxId"
                    value={formData.taxId}
                    onChange={handleChange}
                    className="input"
                    placeholder="001-0000000-0"
                />
            </div>

            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-1 text-text-muted">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="input"
                        placeholder="juan@email.com"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-1 text-text-muted">Teléfono</label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="input"
                        placeholder="809-555-5555"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 text-text-muted">Dirección</label>
                <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="input"
                    placeholder="Dirección completa"
                />
            </div>

            <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={onCancel} className="btn btn-ghost">
                    Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                    {initialData ? 'Guardar Cambios' : 'Crear Cliente'}
                </button>
            </div>
        </form>
    );
};

export default ClientForm;
