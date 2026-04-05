import React, { useState } from 'react';
import type { Product } from '../../types';

interface ProductFormProps {
    initialData?: Product | null;
    onSubmit: (data: Omit<Product, 'id' | 'createdAt'>) => void;
    onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        price: initialData?.price || 0,
        stock: initialData?.stock || 0
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' || name === 'stock' ? Number(value) : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
                <label className="block text-sm font-medium mb-1 text-text-muted">Nombre del Producto/Servicio</label>
                <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="input"
                    placeholder="Ej: Mantenimiento Preventivo"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 text-text-muted">Descripción</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="input min-h-[100px]"
                    placeholder="Detalles del producto o servicio..."
                />
            </div>

            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-1 text-text-muted">Precio</label>
                    <input
                        type="number"
                        name="price"
                        min="0"
                        step="0.01"
                        required
                        value={formData.price}
                        onChange={handleChange}
                        className="input"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-1 text-text-muted">Stock Inicial</label>
                    <input
                        type="number"
                        name="stock"
                        min="0"
                        required
                        value={formData.stock}
                        onChange={handleChange}
                        className="input"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={onCancel} className="btn btn-ghost">
                    Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                    {initialData ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
            </div>
        </form>
    );
};

export default ProductForm;
