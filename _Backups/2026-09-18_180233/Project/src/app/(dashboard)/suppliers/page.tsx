'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Supplier } from '@/types';
import { Pencil, Trash2, Plus, Truck } from 'lucide-react';

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('/api/suppliers')
            .then((res) => res.json())
            .then((data) => {
                setSuppliers(data);
                setLoading(false);
            });
    }, []);

    const filtered = suppliers.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.company?.toLowerCase().includes(search.toLowerCase()) ||
        s.phone?.includes(search)
    );

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this supplier?')) return;
        const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setSuppliers(suppliers.filter((s) => s.id !== id));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Truck className="w-6 h-6" /> Suppliers
                </h1>
                <Link
                    href="/suppliers/create"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Add Supplier
                </Link>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by name, company or phone..."
                    className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filtered.map((supplier) => (
                            <tr key={supplier.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{supplier.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{supplier.company || '—'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{supplier.phone || '—'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{supplier.email || '—'}</td>
                                <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                                    <Link
                                        href={`/suppliers/${supplier.id}/edit`}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(supplier.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}