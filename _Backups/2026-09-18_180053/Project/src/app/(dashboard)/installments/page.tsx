'use client';
import { useEffect, useState } from 'react';
import { InstallmentContract } from '@/types';
import { format } from 'date-fns';
import { Pencil, Eye, Plus } from 'lucide-react';
import Link from 'next/link';

export default function InstallmentsPage() {
    const [contracts, setContracts] = useState<InstallmentContract[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingContract, setEditingContract] = useState<InstallmentContract | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        fetchInstallments();
    }, []);

    const fetchInstallments = async () => {
        const res = await fetch('/api/installments');
        const data = await res.json();
        setContracts(data);
        setLoading(false);
    };

    const handleEdit = (contract: InstallmentContract) => {
        setEditingContract(contract);
        setShowEditModal(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingContract) return;
        const res = await fetch(`/api/installments/${editingContract.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingContract),
        });
        if (res.ok) {
            setShowEditModal(false);
            fetchInstallments();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Installment Contracts</h1>
                <Link href="/sales" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2">
                    <Plus className="w-4 h-4" /> New Contract (from Sale)
                </Link>
            </div>
            {loading ? <p>Loading...</p> : (
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Balance</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {contracts.map(c => (
                            <tr key={c.id}>
                                <td className="px-6 py-4 whitespace-nowrap">#{c.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{c.customer?.name || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">LKR {c.totalAmount}</td>
                                <td className="px-6 py-4 whitespace-nowrap">LKR {c.remainingBalance}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        c.status === 'ACTIVE' ? 'bg-yellow-100 text-yellow-800' :
                            c.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                    }`}>
                      {c.status}
                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                                    <button
                                        onClick={() => handleEdit(c)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <Link href={`/installments/${c.id}`} className="text-gray-600 hover:text-gray-800">
                                        <Eye className="w-4 h-4" />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingContract && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Edit Installment Contract</h2>
                        <form onSubmit={handleUpdate}>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium">Status</label>
                                    <select
                                        value={editingContract.status}
                                        onChange={(e) => setEditingContract({
                                            ...editingContract,
                                            status: e.target.value as 'ACTIVE' | 'COMPLETED' | 'DEFAULTED',
                                        })}
                                        className="w-full border border-gray-300 rounded-md p-2"
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="DEFAULTED">Defaulted</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Remaining Balance (LKR)</label>
                                    <input
                                        type="number"
                                        value={editingContract.remainingBalance}
                                        onChange={(e) => setEditingContract({
                                            ...editingContract,
                                            remainingBalance: parseFloat(e.target.value) || 0,
                                        })}
                                        className="w-full border border-gray-300 rounded-md p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Monthly Installment (LKR)</label>
                                    <input
                                        type="number"
                                        value={editingContract.monthlyInstallment}
                                        onChange={(e) => setEditingContract({
                                            ...editingContract,
                                            monthlyInstallment: parseFloat(e.target.value) || 0,
                                        })}
                                        className="w-full border border-gray-300 rounded-md p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Total Amount (LKR)</label>
                                    <input
                                        type="number"
                                        value={editingContract.totalAmount}
                                        onChange={(e) => setEditingContract({
                                            ...editingContract,
                                            totalAmount: parseFloat(e.target.value) || 0,
                                        })}
                                        className="w-full border border-gray-300 rounded-md p-2"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}