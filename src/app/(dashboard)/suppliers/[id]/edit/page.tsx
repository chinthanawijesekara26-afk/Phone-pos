'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';

const supplierSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    company: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Invalid email').optional(),
    address: z.string().optional(),
});

type SupplierForm = z.infer<typeof supplierSchema>;

export default function EditSupplierPage() {
    const router = useRouter();
    const params = useParams();
    const id = parseInt(params.id as string);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<SupplierForm>({
        resolver: zodResolver(supplierSchema),
    });

    useEffect(() => {
        fetch(`/api/suppliers/${id}`)
            .then((res) => res.json())
            .then((data) => {
                reset(data);
                setLoading(false);
            });
    }, [id, reset]);

    const onSubmit = async (data: SupplierForm) => {
        try {
            const res = await fetch(`/api/suppliers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Failed to update supplier');
            }
            router.push('/suppliers');
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Edit Supplier</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow space-y-4">
                {error && <p className="text-red-600">{error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput label="Name" register={register('name')} error={errors.name} required />
                    <FormInput label="Company" register={register('company')} error={errors.company} />
                    <FormInput label="Phone" register={register('phone')} error={errors.phone} />
                    <FormInput label="Email" register={register('email')} error={errors.email} type="email" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <textarea {...register('address')} className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md" rows={3} />
                </div>
                <div className="flex justify-end gap-4">
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
                        {isSubmitting ? 'Saving...' : 'Update Supplier'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function FormInput({ label, register, error, type = 'text', required = false }: any) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                {...register}
                type={type}
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
        </div>
    );
}