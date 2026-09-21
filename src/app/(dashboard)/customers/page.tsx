'use client'
import { useEffect, useState } from 'react'
import { Customer } from '@/types'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetch('/api/customers')
            .then(res => res.json())
            .then(data => { setCustomers(data); setLoading(false) })
    }, [])

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    )

    const handleDelete = async (id: number) => {
    if (!confirm('Delete this customer?')) {
        return;
    }

    try {
        const res = await fetch(`/api/customers/${id}`, {
            method: 'DELETE',
        });

        const data = await res.json();

        console.log('DELETE RESPONSE:', data);

        if (!res.ok) {
            alert(
                data.error ||
                'Failed to delete customer.'
            );
            return;
        }

        // Remove deleted customer immediately from UI
        setCustomers(prev =>
            prev.filter(customer => customer.id !== id)
        );

        alert('Customer deleted successfully.');

    } catch (error) {
        console.error(
            'DELETE CUSTOMER ERROR:',
            error
        );

        alert(
            'Something went wrong while deleting the customer.'
        );
    }
};
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Customers</h1>
                <Link href="/customers/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Customer
                </Link>
            </div>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by name or phone..."
                    className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            {loading ? <p>Loading...</p> : (
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filtered.map(c => (
                            <tr key={c.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{c.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{c.phone}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{c.loyaltyPoints}</td>
                                <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                                    <Link href={`/customers/${c.id}/edit`} className="text-blue-600 hover:text-blue-800">
                                        <Pencil className="w-4 h-4" />
                                    </Link>
                                    <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-800">
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
    )
}