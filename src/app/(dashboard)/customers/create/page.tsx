'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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

export default function CreateCustomerPage() {
    const router = useRouter();
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
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

    const onSubmit = async (data: CustomerForm) => {
        setError('');

        try {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(result.message || 'Failed to create customer');
            }

            router.push('/customers');
            router.refresh();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to create customer'
            );
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Add New Customer
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Create a new customer record
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                    Back
                </button>
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
                        {isSubmitting ? 'Saving...' : 'Save Customer'}
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
