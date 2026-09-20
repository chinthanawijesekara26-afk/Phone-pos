'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';

const productSchema = z.object({
    name: z.string().min(1, 'Name is required'),

    barcode: z.string().optional(),
    imei: z.string().optional(),
    serialNumber: z.string().optional(),

    brandId: z.number().optional(),
    categoryId: z.number().optional(),

    storage: z.string().optional(),
    ram: z.string().optional(),
    color: z.string().optional(),

    purchasePrice: z
        .number()
        .positive('Purchase price must be positive'),

    sellingPrice: z
        .number()
        .positive('Selling price must be positive'),

    discountPrice: z
        .number()
        .optional(),

    tax: z
        .number()
        .min(0, 'Tax cannot be negative'),

    stock: z
        .number()
        .int()
        .min(0, 'Stock cannot be negative'),

    reorderLevel: z
        .number()
        .int()
        .min(0, 'Reorder level cannot be negative'),

    warrantyMonths: z
        .number()
        .int()
        .min(0, 'Warranty months cannot be negative'),

    description: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();

    const id = parseInt(params.id, 10);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [brands, setBrands] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ProductForm>({
        resolver: zodResolver(productSchema),

        defaultValues: {
            name: '',
            barcode: '',
            imei: '',
            serialNumber: '',
            brandId: undefined,
            categoryId: undefined,
            storage: '',
            ram: '',
            color: '',
            purchasePrice: 0,
            sellingPrice: 0,
            discountPrice: undefined,
            tax: 0,
            stock: 0,
            reorderLevel: 5,
            warrantyMonths: 12,
            description: '',
        },
    });

    // --------------------------------------------------
    // LOAD PRODUCT
    // --------------------------------------------------
    useEffect(() => {
        if (!Number.isInteger(id) || id <= 0) {
            setError('Invalid product ID');
            setLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                setLoading(true);
                setError('');

                const [productRes, brandRes, categoryRes] =
                    await Promise.all([
                        fetch(`/api/products/${id}`, {
                            cache: 'no-store',
                        }),
                        fetch('/api/brands', {
                            cache: 'no-store',
                        }),
                        fetch('/api/categories', {
                            cache: 'no-store',
                        }),
                    ]);

                if (!productRes.ok) {
                    throw new Error('Product not found');
                }

                const productData = await productRes.json();
                const brandData = await brandRes.json();
                const categoryData = await categoryRes.json();

                const brandList = Array.isArray(brandData)
                    ? brandData
                    : brandData.data ?? [];

                const categoryList = Array.isArray(categoryData)
                    ? categoryData
                    : categoryData.data ?? [];

                setBrands(brandList);
                setCategories(categoryList);

                reset({
                    name: productData.name ?? '',
                    barcode: productData.barcode ?? '',
                    imei: productData.imei ?? '',
                    serialNumber: productData.serialNumber ?? '',

                    brandId:
                        productData.brandId != null
                            ? Number(productData.brandId)
                            : undefined,

                    categoryId:
                        productData.categoryId != null
                            ? Number(productData.categoryId)
                            : undefined,

                    storage: productData.storage ?? '',
                    ram: productData.ram ?? '',
                    color: productData.color ?? '',

                    purchasePrice: Number(
                        productData.purchasePrice ?? 0
                    ),

                    sellingPrice: Number(
                        productData.sellingPrice ?? 0
                    ),

                    discountPrice:
                        productData.discountPrice != null
                            ? Number(productData.discountPrice)
                            : undefined,

                    tax: Number(productData.tax ?? 0),

                    stock: Number(productData.stock ?? 0),

                    reorderLevel: Number(
                        productData.reorderLevel ?? 5
                    ),

                    warrantyMonths: Number(
                        productData.warrantyMonths ?? 12
                    ),

                    description: productData.description ?? '',
                });
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to load product data'
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, reset]);

    // --------------------------------------------------
    // UPDATE PRODUCT
    // --------------------------------------------------
    const onSubmit = async (data: ProductForm) => {
        setError('');
        setSuccess('');

        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(
                    result.message || 'Failed to update product'
                );
            }

            setSuccess('Product updated successfully!');

            setTimeout(() => {
                router.push('/products');
                router.refresh();
            }, 1000);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to update product'
            );
        }
    };

    // --------------------------------------------------
    // PRINT STICKER
    // --------------------------------------------------
    const handlePrintSticker = () => {
        router.push(`/products/sticker/${id}`);
    };

    // --------------------------------------------------
    // LOADING
    // --------------------------------------------------
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />

                    <p className="mt-4 text-gray-600">
                        Loading product data...
                    </p>
                </div>
            </div>
        );
    }

    // --------------------------------------------------
    // PAGE
    // --------------------------------------------------
    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">
                    Edit Product
                </h1>
            </div>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white p-6 rounded-lg shadow space-y-5"
            >
                {/* ERROR */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* SUCCESS */}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                        {success}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* NAME */}
                    <FormInput
                        label="Name"
                        register={register('name')}
                        error={errors.name}
                        required
                    />

                    {/* BRAND */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Brand
                        </label>

                        <select
                            {...register('brandId', {
                                setValueAs: (value) =>
                                    value === ''
                                        ? undefined
                                        : Number(value),
                            })}
                            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">
                                Select Brand
                            </option>

                            {brands.map((brand) => (
                                <option
                                    key={brand.id}
                                    value={brand.id}
                                >
                                    {brand.name}
                                </option>
                            ))}
                        </select>

                        {errors.brandId && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.brandId.message}
                            </p>
                        )}
                    </div>

                    {/* CATEGORY */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Category
                        </label>

                        <select
                            {...register('categoryId', {
                                setValueAs: (value) =>
                                    value === ''
                                        ? undefined
                                        : Number(value),
                            })}
                            className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">
                                Select Category
                            </option>

                            {categories.map((category) => (
                                <option
                                    key={category.id}
                                    value={category.id}
                                >
                                    {category.name}
                                </option>
                            ))}
                        </select>

                        {errors.categoryId && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.categoryId.message}
                            </p>
                        )}
                    </div>

                    {/* BARCODE */}
                    <FormInput
                        label="Barcode"
                        register={register('barcode')}
                        error={errors.barcode}
                    />

                    {/* IMEI */}
                    <FormInput
                        label="IMEI"
                        register={register('imei')}
                        error={errors.imei}
                    />

                    {/* SERIAL */}
                    <FormInput
                        label="Serial Number"
                        register={register('serialNumber')}
                        error={errors.serialNumber}
                    />

                    {/* STORAGE */}
                    <FormInput
                        label="Storage"
                        register={register('storage')}
                        error={errors.storage}
                    />

                    {/* RAM */}
                    <FormInput
                        label="RAM"
                        register={register('ram')}
                        error={errors.ram}
                    />

                    {/* COLOR */}
                    <FormInput
                        label="Color"
                        register={register('color')}
                        error={errors.color}
                    />

                    {/* PURCHASE PRICE */}
                    <FormInput
                        label="Purchase Price (LKR)"
                        register={register('purchasePrice', {
                            valueAsNumber: true,
                        })}
                        error={errors.purchasePrice}
                        type="number"
                        required
                    />

                    {/* SELLING PRICE */}
                    <FormInput
                        label="Selling Price (LKR)"
                        register={register('sellingPrice', {
                            valueAsNumber: true,
                        })}
                        error={errors.sellingPrice}
                        type="number"
                        required
                    />

                    {/* DISCOUNT PRICE */}
                    <FormInput
                        label="Discount Price"
                        register={register('discountPrice', {
                            setValueAs: (value) =>
                                value === ''
                                    ? undefined
                                    : Number(value),
                        })}
                        error={errors.discountPrice}
                        type="number"
                    />

                    {/* TAX */}
                    <FormInput
                        label="Tax (%)"
                        register={register('tax', {
                            valueAsNumber: true,
                        })}
                        error={errors.tax}
                        type="number"
                    />

                    {/* STOCK */}
                    <FormInput
                        label="Stock"
                        register={register('stock', {
                            valueAsNumber: true,
                        })}
                        error={errors.stock}
                        type="number"
                        required
                    />

                    {/* REORDER LEVEL */}
                    <FormInput
                        label="Reorder Level"
                        register={register('reorderLevel', {
                            valueAsNumber: true,
                        })}
                        error={errors.reorderLevel}
                        type="number"
                        required
                    />

                    {/* WARRANTY */}
                    <FormInput
                        label="Warranty (months)"
                        register={register('warrantyMonths', {
                            valueAsNumber: true,
                        })}
                        error={errors.warrantyMonths}
                        type="number"
                        required
                    />
                </div>

                {/* DESCRIPTION */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Description
                    </label>

                    <textarea
                        {...register('description')}
                        className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md"
                        rows={3}
                        placeholder="Enter product description"
                    />
                </div>

                {/* BUTTONS */}
                <div className="flex justify-end gap-4 flex-wrap pt-4 border-t">

                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
                    >
                        {isSubmitting
                            ? 'Saving...'
                            : 'Update Product'}
                    </button>

                    <button
                        type="button"
                        onClick={handlePrintSticker}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md flex items-center gap-2"
                    >
                        Print Sticker
                    </button>
                </div>
            </form>
        </div>
    );
}

// --------------------------------------------------
// FORM INPUT COMPONENT
// --------------------------------------------------

function FormInput({
                       label,
                       register,
                       error,
                       type = 'text',
                       required = false,
                   }: {
    label: string;
    register: any;
    error: any;
    type?: string;
    required?: boolean;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">
                {label}{' '}
                {required && (
                    <span className="text-red-500">*</span>
                )}
            </label>

            <input
                {...register}
                type={type}
                className={`mt-1 w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    error
                        ? 'border-red-500'
                        : 'border-gray-300'
                }`}
            />

            {error && (
                <p className="mt-1 text-sm text-red-600">
                    {error.message}
                </p>
            )}
        </div>
    );
}