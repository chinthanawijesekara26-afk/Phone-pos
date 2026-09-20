'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Product } from '@/types'
import { Pencil, Trash2, Plus, Eye } from 'lucide-react'

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [minPrice, setMinPrice] = useState('')
    const [maxPrice, setMaxPrice] = useState('')

    useEffect(() => {
        fetch('/api/products')
            .then(res => res.json())
            .then(data => {
                setProducts(data)
                setLoading(false)
            })
    }, [])

    const filtered = products.filter(p => {
        const nameMatch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.barcode?.includes(search)
        const price = p.sellingPrice
        const min = minPrice ? parseFloat(minPrice) : 0
        const max = maxPrice ? parseFloat(maxPrice) : Infinity
        return nameMatch && price >= min && price <= max
    })

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this product?')) return
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
        if (res.ok) {
            setProducts(products.filter(p => p.id !== id))
        }
    }

    const getStockStatus = (stock: number, reorderLevel: number) => {
        if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' }
        if (stock <= reorderLevel) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' }
        return { label: 'In Stock', color: 'bg-green-100 text-green-800' }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Products</h1>
                <Link
                    href="/products/create"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Add Product
                </Link>
            </div>

            <div className="flex flex-wrap gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Search by name or barcode..."
                    className="px-4 py-2 border border-gray-300 rounded-md flex-1 min-w-[200px]"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className="flex items-center gap-2">
                    <span className="text-sm">Price:</span>
                    <input
                        type="number"
                        placeholder="Min"
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <span>–</span>
                    <input
                        type="number"
                        placeholder="Max"
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filtered.map((product) => {
                            const status = getStockStatus(product.stock, product.reorderLevel)
                            return (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">{product.barcode || '—'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">LKR {product.sellingPrice}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={product.stock <= product.reorderLevel ? 'text-red-600 font-bold' : ''}>
                                                {product.stock}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                                                {status.label}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                                        <Link
                                            href={`/products/${product.id}/view`}
                                            className="text-green-600 hover:text-green-800"
                                            title="View Product"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                        <Link
                                            href={`/products/${product.id}/edit`}
                                            className="text-blue-600 hover:text-blue-800"
                                            title="Edit Product"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="text-red-600 hover:text-red-800"
                                            title="Delete Product"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}