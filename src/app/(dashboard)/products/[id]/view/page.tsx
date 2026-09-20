'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Printer, Package, Barcode, Tag, Hash, Layers, HardDrive, Cpu, Palette, DollarSign, ShoppingBag, AlertTriangle, Calendar, FileText } from 'lucide-react';

interface Product {
    id: number;
    name: string;
    barcode: string | null;
    imei: string | null;
    serialNumber: string | null;
    brandId: number | null;
    categoryId: number | null;
    storage: string | null;
    ram: string | null;
    color: string | null;
    purchasePrice: number;
    sellingPrice: number;
    discountPrice: number | null;
    tax: number;
    stock: number;
    reorderLevel: number;
    warrantyMonths: number;
    description: string | null;
    brand: { id: number; name: string } | null;
    category: { id: number; name: string } | null;
    createdAt: string;
    updatedAt: string;
}

export default function ViewProductPage() {
    const router = useRouter();
    const params = useParams();
    const id = parseInt(params.id as string);
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadProduct = async () => {
            try {
                const res = await fetch(`/api/products/${id}`);
                if (!res.ok) throw new Error('Product not found');
                const data = await res.json();
                setProduct(data);
                setLoading(false);
            } catch (err: any) {
                setError(err.message);
                setLoading(false);
            }
        };
        loadProduct();
    }, [id]);

    const handlePrintSticker = () => {
        router.push(`/products/sticker/${id}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading product details...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="text-center py-10">
                <div className="text-red-600 text-xl">Error: {error || 'Product not found'}</div>
                <Link href="/products" className="mt-4 inline-block text-blue-600 hover:underline">
                    ← Back to Products
                </Link>
            </div>
        );
    }

    const getStockStatus = (stock: number, reorderLevel: number) => {
        if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
        if (stock <= reorderLevel) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
        return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
    };

    const stockStatus = getStockStatus(product.stock, product.reorderLevel);

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href="/products"
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold">{product.name}</h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${stockStatus.color}`}>
                        {stockStatus.label}
                    </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={handlePrintSticker}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                    >
                        <Printer className="w-4 h-4" /> Print Sticker
                    </button>

                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Product Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info Card */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-gray-500" />
                            Basic Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoItem
                                label="Product Name"
                                value={product.name}
                                icon={<Tag className="w-4 h-4" />}
                            />
                            <InfoItem
                                label="Barcode"
                                value={product.barcode || '—'}
                                icon={<Barcode className="w-4 h-4" />}
                            />
                            <InfoItem
                                label="IMEI"
                                value={product.imei || '—'}
                                icon={<Hash className="w-4 h-4" />}
                            />
                            <InfoItem
                                label="Serial Number"
                                value={product.serialNumber || '—'}
                                icon={<Hash className="w-4 h-4" />}
                            />
                            <InfoItem
                                label="Brand"
                                value={product.brand?.name || '—'}
                                icon={<Layers className="w-4 h-4" />}
                            />
                            <InfoItem
                                label="Category"
                                value={product.category?.name || '—'}
                                icon={<Layers className="w-4 h-4" />}
                            />
                        </div>
                    </div>

                    {/* Specifications Card */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <HardDrive className="w-5 h-5 text-gray-500" />
                            Specifications
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InfoItem
                                label="Storage"
                                value={product.storage || '—'}
                                icon={<HardDrive className="w-4 h-4" />}
                            />
                            <InfoItem
                                label="RAM"
                                value={product.ram || '—'}
                                icon={<Cpu className="w-4 h-4" />}
                            />
                            <InfoItem
                                label="Color"
                                value={product.color || '—'}
                                icon={<Palette className="w-4 h-4" />}
                            />
                        </div>
                    </div>

                    {/* Description Card */}
                    {product.description && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-gray-500" />
                                Description
                            </h2>
                            <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
                        </div>
                    )}
                </div>

                {/* Right Column - Pricing & Stock */}
                <div className="space-y-6">
                    {/* Pricing Card */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-gray-500" />
                            Pricing
                        </h2>
                        <div className="space-y-3">
                            <InfoItem
                                label="Purchase Price"
                                value={`LKR ${product.purchasePrice.toFixed(2)}`}
                                icon={<DollarSign className="w-4 h-4" />}
                            />
                            <InfoItem
                                label="Selling Price"
                                value={`LKR ${product.sellingPrice.toFixed(2)}`}
                                icon={<DollarSign className="w-4 h-4" />}
                            />
                            {product.discountPrice && (
                                <InfoItem
                                    label="Discount Price"
                                    value={`LKR ${product.discountPrice.toFixed(2)}`}
                                    icon={<DollarSign className="w-4 h-4" />}
                                />
                            )}
                            <InfoItem
                                label="Tax"
                                value={`${product.tax}%`}
                                icon={<Tag className="w-4 h-4" />}
                            />
                        </div>
                    </div>

                    {/* Stock Card */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-gray-500" />
                            Stock Information
                        </h2>
                        <div className="space-y-3">
                            <InfoItem
                                label="Current Stock"
                                value={product.stock}
                                icon={<ShoppingBag className="w-4 h-4" />}
                                valueClassName={`font-bold ${
                                    product.stock === 0
                                        ? 'text-red-600'
                                        : product.stock <= product.reorderLevel
                                            ? 'text-yellow-600'
                                            : 'text-green-600'
                                }`}
                            />
                            <InfoItem
                                label="Reorder Level"
                                value={product.reorderLevel}
                                icon={<AlertTriangle className="w-4 h-4" />}
                            />
                            <InfoItem
                                label="Warranty"
                                value={`${product.warrantyMonths} months`}
                                icon={<Calendar className="w-4 h-4" />}
                            />
                            <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className={`h-2.5 rounded-full ${
                                            product.stock === 0
                                                ? 'bg-red-600'
                                                : product.stock <= product.reorderLevel
                                                    ? 'bg-yellow-500'
                                                    : 'bg-green-600'
                                        }`}
                                        style={{
                                            width: `${Math.min((product.stock / (product.reorderLevel * 2)) * 100, 100)}%`,
                                        }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Stock level: {product.stock} / {product.reorderLevel * 2} (reorder at {product.reorderLevel})
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Card */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold mb-4">Metadata</h2>
                        <div className="space-y-2 text-sm text-gray-600">
                            <p>
                                <span className="font-medium">Created:</span>{' '}
                                {new Date(product.createdAt).toLocaleString()}
                            </p>
                            <p>
                                <span className="font-medium">Last Updated:</span>{' '}
                                {new Date(product.updatedAt).toLocaleString()}
                            </p>
                            <p>
                                <span className="font-medium">Product ID:</span> #{product.id}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 flex flex-wrap gap-4 justify-end border-t pt-6">
                <Link
                    href="/products"
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                >
                    Back to Products
                </Link>

            </div>
        </div>
    );
}

// Reusable Info Item Component
function InfoItem({ label, value, icon, valueClassName = '' }: any) {
    return (
        <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-gray-400 mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className={`text-sm truncate ${valueClassName || 'text-gray-900'}`}>
                    {value !== undefined && value !== null ? value : '—'}
                </p>
            </div>
        </div>
    );
}