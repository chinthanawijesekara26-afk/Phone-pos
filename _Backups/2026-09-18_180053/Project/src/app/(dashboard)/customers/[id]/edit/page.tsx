'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const customerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().min(1, 'Phone number is required'),
    email: z
        .string()
        .trim()
        .optional()
        .or(z.literal('')),
    address: z.string().optional(),
    loyaltyPoints: z.coerce.number().int().min(0, 'Loyalty points cannot be negative').default(0),
});

type CustomerFormInput = z.input<typeof customerSchema>;
type CustomerForm = z.output<typeof customerSchema>;

export default function EditCustomerPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();

    const id = Number(params.id);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CustomerFormInput, any, CustomerForm>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            name: '',
            phone: '',
            email: '',
            address: '',
            loyaltyPoints: 0,
        },
    });

    useEffect(() => {
        if (!Number.isInteger(id) || id <= 0) {
            setError('Invalid customer ID');
            setLoading(false);
            return;
        }

        const loadCustomer = async () => {
            try {
                setLoading(true);
                setError('');

                const res = await fetch(`/api/customers/${id}`, {
                    cache: 'no-store',
                });

                const result = await res.json().catch(() => ({}));

                if (!res.ok) {
                    throw new Error(
                        result.message || 'Customer not found'
                    );
                }

                const customer = result.data ?? result;

                reset({
                    name: customer.name ?? '',
                    phone: customer.phone ?? '',
                    email: customer.email ?? '',
                    address: customer.address ?? '',
                    loyaltyPoints: Number(customer.loyaltyPoints ?? 0),
                });
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to load customer'
                );
            } finally {
                setLoading(false);
            }
        };

        loadCustomer();
    }, [id, reset]);

    const onSubmit = async (data: CustomerForm) => {
        setError('');
        setSuccess('');

        try {
            const res = await fetch(`/api/customers/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(
                    result.message || 'Failed to update customer'
                );
            }

            setSuccess('Customer updated successfully!');

            setTimeout(() => {
                router.push('/customers');
                router.refresh();
            }, 1000);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to update customer'
            );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                    <p className="mt-4 text-gray-600">
                        Loading customer data...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Link
                        href="/customers"
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>

                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            Edit Customer
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Update customer information
                        </p>
                    </div>
                </div>
            </div>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white p-6 rounded-lg shadow space-y-5"
            >
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                        {success}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        label="Name"
                        register={register('name')}
                        error={errors.name}
                        required
                        placeholder="Enter customer name"
                    />

                    <FormInput
                        label="Phone"
                        register={register('phone')}
                        error={errors.phone}
                        required
                        placeholder="Enter phone number"
                    />

                    <FormInput
                        label="Email"
                        register={register('email')}
                        error={errors.email}
                        type="email"
                        placeholder="Enter email address"
                    />

                    <FormInput
                        label="Loyalty Points"
                        register={register('loyaltyPoints')}
                        error={errors.loyaltyPoints}
                        type="number"
                        min="0"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Address
                    </label>

                    <textarea
                        {...register('address')}
                        placeholder="Enter customer address"
                        className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                    />

                    {errors.address && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.address.message}
                        </p>
                    )}
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t">
                    <Link
                        href="/customers"
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
                    >
                        {isSubmitting ? 'Updating...' : 'Update Customer'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function FormInput({
                       label,
                       register,
                       error,
                       type = 'text',
                       required = false,
                       placeholder = '',
                       min,
                   }: {
    label: string;
    register: any;
    error: any;
    type?: string;
    required?: boolean;
    placeholder?: string;
    min?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">
                {label}{' '}
                {required && <span className="text-red-500">*</span>}
            </label>

            <input
                {...register}
                type={type}
                min={min}
                placeholder={placeholder}
                className={`mt-1 w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    error ? 'border-red-500' : 'border-gray-300'
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
