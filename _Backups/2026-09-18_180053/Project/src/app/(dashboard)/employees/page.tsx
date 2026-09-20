'use client';

import { useEffect, useState } from 'react';
import {
    UserPlus,
    Pencil,
    Trash2,
    Search,
    X,
    ShieldCheck,
    UserCheck,
    UserX,
    RefreshCw,
} from 'lucide-react';

type EmployeeRole =
    | 'ADMIN'
    | 'CASHIER';

interface Employee {
    id: number;
    name: string;
    email: string;
    role: EmployeeRole;
    isActive: boolean;
    createdAt: string;
}

interface EmployeeForm {
    name: string;
    email: string;
    password: string;
    role: EmployeeRole;
    isActive: boolean;
}

const emptyForm: EmployeeForm = {
    name: '',
    email: '',
    password: '',
    role: 'CASHIER',
    isActive: true,
};

export default function EmployeesPage() {
    const [employees, setEmployees] =
        useState<Employee[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [search, setSearch] =
        useState('');

    const [showModal, setShowModal] =
        useState(false);

    const [editingId, setEditingId] =
        useState<number | null>(null);

    const [form, setForm] =
        useState<EmployeeForm>(
            emptyForm
        );

    // ========================================================
    // Load Employees
    // ========================================================

    const loadEmployees = async () => {
        try {
            setLoading(true);

            const response =
                await fetch(
                    '/api/employees',
                    {
                        cache: 'no-store',
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    'Failed to load employees'
                );
            }

            setEmployees(data);
        } catch (error: any) {
            console.error(error);

            alert(
                error.message ||
                'Failed to load employees'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEmployees();
    }, []);

    // ========================================================
    // Open Add
    // ========================================================

    const openAddModal = () => {
        setEditingId(null);

        setForm({
            ...emptyForm,
        });

        setShowModal(true);
    };

    // ========================================================
    // Open Edit
    // ========================================================

    const openEditModal = (
        employee: Employee
    ) => {
        setEditingId(employee.id);

        setForm({
            name: employee.name,
            email: employee.email,
            password: '',
            role: employee.role,
            isActive:
            employee.isActive,
        });

        setShowModal(true);
    };

    // ========================================================
    // Close Modal
    // ========================================================

    const closeModal = () => {
        if (saving) return;

        setShowModal(false);
        setEditingId(null);
        setForm({
            ...emptyForm,
        });
    };

    // ========================================================
    // Form Change
    // ========================================================

    const updateForm = (
        field: keyof EmployeeForm,
        value: string | boolean
    ) => {
        setForm(
            (previous) => ({
                ...previous,
                [field]: value,
            })
        );
    };

    // ========================================================
    // Save Employee
    // ========================================================

    const handleSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        if (!form.name.trim()) {
            alert(
                'Please enter employee name.'
            );
            return;
        }

        if (!form.email.trim()) {
            alert(
                'Please enter email.'
            );
            return;
        }

        if (
            !editingId &&
            !form.password
        ) {
            alert(
                'Please enter password.'
            );
            return;
        }

        try {
            setSaving(true);

            const payload: any = {
                name: form.name,
                email: form.email,
                role: form.role,
                isActive:
                form.isActive,
            };

            if (
                form.password.trim()
            ) {
                payload.password =
                    form.password;
            }

            const url = editingId
                ? `/api/employees/${editingId}`
                : '/api/employees';

            const response =
                await fetch(url, {
                    method: editingId
                        ? 'PATCH'
                        : 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',
                    },

                    body: JSON.stringify(
                        payload
                    ),
                });

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    'Operation failed'
                );
            }

            alert(
                editingId
                    ? 'Employee updated successfully.'
                    : 'Employee created successfully.'
            );

            closeModal();

            await loadEmployees();
        } catch (error: any) {
            console.error(error);

            alert(
                error.message ||
                'Something went wrong.'
            );
        } finally {
            setSaving(false);
        }
    };

    // ========================================================
    // Change Status
    // ========================================================

    const toggleStatus = async (
        employee: Employee
    ) => {
        const newStatus =
            !employee.isActive;

        const confirmed =
            window.confirm(
                `Are you sure you want to ${
                    newStatus
                        ? 'activate'
                        : 'deactivate'
                } ${employee.name}?`
            );

        if (!confirmed) return;

        try {
            const response =
                await fetch(
                    `/api/employees/${employee.id}`,
                    {
                        method: 'PATCH',

                        headers: {
                            'Content-Type':
                                'application/json',
                        },

                        body: JSON.stringify({
                            isActive:
                            newStatus,
                        }),
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    'Failed to change status'
                );
            }

            await loadEmployees();
        } catch (error: any) {
            console.error(error);

            alert(
                error.message ||
                'Failed to change status.'
            );
        }
    };

    // ========================================================
    // Delete
    // ========================================================

    const handleDelete = async (
        employee: Employee
    ) => {
        const confirmed =
            window.confirm(
                `Are you sure you want to delete ${employee.name}?\n\nThis action cannot be undone.`
            );

        if (!confirmed) return;

        try {
            const response =
                await fetch(
                    `/api/employees/${employee.id}`,
                    {
                        method: 'DELETE',
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    'Failed to delete employee'
                );
            }

            alert(
                'Employee deleted successfully.'
            );

            await loadEmployees();
        } catch (error: any) {
            console.error(error);

            alert(
                error.message ||
                'Failed to delete employee.'
            );
        }
    };

    // ========================================================
    // Search
    // ========================================================

    const filteredEmployees =
        employees.filter(
            (employee) => {
                const text =
                    `${employee.name} ${employee.email} ${employee.role}`
                        .toLowerCase();

                return text.includes(
                    search.toLowerCase()
                );
            }
        );

    // ========================================================
    // Statistics
    // ========================================================

    const total =
        employees.length;

    const active =
        employees.filter(
            (employee) =>
                employee.isActive
        ).length;

    const inactive =
        employees.filter(
            (employee) =>
                !employee.isActive
        ).length;

    const cashiers =
        employees.filter(
            (employee) =>
                employee.role ===
                'CASHIER'
        ).length;

    return (
        <div className="min-h-full  p-1 space-y-6">
            {/* =================================================
                Header
            ================================================= */}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-2xl font-bold text-gray-900">
                        Employees
                    </h1>

                    <p className="text-gray-500 mt-1">
                        Manage Admin and Cashier
                        accounts.
                    </p>
                </div>

                <button
                    onClick={
                        openAddModal
                    }
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm"
                >
                    <UserPlus className="w-5 h-5" />
                    Add Employee
                </button>
            </div>

            {/* =================================================
                Statistics
            ================================================= */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Employees"
                    value={total}
                    icon={
                        ShieldCheck
                    }
                    type="blue"
                />

                <StatCard
                    title="Active"
                    value={active}
                    icon={
                        UserCheck
                    }
                    type="green"
                />

                <StatCard
                    title="Inactive"
                    value={inactive}
                    icon={UserX}
                    type="red"
                />

                <StatCard
                    title="Cashiers"
                    value={cashiers}
                    icon={UserCheck}
                    type="purple"
                />
            </div>

            {/* =================================================
                Search
            ================================================= */}

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                    <input
                        type="text"
                        placeholder="Search employee..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* =================================================
                Employee Table
            ================================================= */}

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">
                            Employee List
                        </h2>

                        <p className="text-sm text-gray-500 mt-1">
                            {filteredEmployees.length}{' '}
                            employee(s)
                        </p>
                    </div>

                    <button
                        onClick={
                            loadEmployees
                        }
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Refresh"
                    >
                        <RefreshCw
                            className={`w-5 h-5 text-gray-600 ${
                                loading
                                    ? 'animate-spin'
                                    : ''
                            }`}
                        />
                    </button>
                </div>

                {loading ? (
                    <div className="py-16 text-center">
                        <RefreshCw className="w-8 h-8 mx-auto text-blue-600 animate-spin" />

                        <p className="mt-3 text-gray-500">
                            Loading employees...
                        </p>
                    </div>
                ) : filteredEmployees.length ===
                0 ? (
                    <div className="py-16 text-center">
                        <UserX className="w-12 h-12 mx-auto text-gray-300" />

                        <p className="mt-3 text-gray-500">
                            No employees found.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">
                                    Employee
                                </th>

                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">
                                    Email
                                </th>

                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">
                                    Role
                                </th>

                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">
                                    Status
                                </th>

                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                            {filteredEmployees.map(
                                (
                                    employee
                                ) => (
                                    <tr
                                        key={
                                            employee.id
                                        }
                                        className="hover:bg-gray-50"
                                    >
                                        {/* Employee */}

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                                                    {employee.name
                                                        ?.charAt(
                                                            0
                                                        )
                                                        .toUpperCase()}
                                                </div>

                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {
                                                            employee.name
                                                        }
                                                    </p>

                                                    <p className="text-xs text-gray-500">
                                                        ID: #
                                                        {
                                                            employee.id
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Email */}

                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {
                                                employee.email
                                            }
                                        </td>

                                        {/* Role */}

                                        <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                                        employee.role ===
                                                        'ADMIN'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                    }`}
                                                >
                                                    {
                                                        employee.role
                                                    }
                                                </span>
                                        </td>

                                        {/* Status */}

                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() =>
                                                    toggleStatus(
                                                        employee
                                                    )
                                                }
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                                    employee.isActive
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                }`}
                                            >
                                                {employee.isActive ? (
                                                    <>
                                                        <UserCheck className="w-3.5 h-3.5" />
                                                        Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserX className="w-3.5 h-3.5" />
                                                        Inactive
                                                    </>
                                                )}
                                            </button>
                                        </td>

                                        {/* Actions */}

                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() =>
                                                        openEditModal(
                                                            employee
                                                        )
                                                    }
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleDelete(
                                                            employee
                                                        )
                                                    }
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* =================================================
                Add / Edit Modal
            ================================================= */}

            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}

                        <div className="p-5 border-b flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingId
                                        ? 'Edit Employee'
                                        : 'Add New Employee'}
                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    {editingId
                                        ? 'Update employee details'
                                        : 'Create a new Admin or Cashier account'}
                                </p>
                            </div>

                            <button
                                onClick={
                                    closeModal
                                }
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="p-5 space-y-5"
                        >
                            {/* Name */}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Full Name *
                                </label>

                                <input
                                    type="text"
                                    value={
                                        form.name
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        updateForm(
                                            'name',
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Enter full name"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            {/* Email */}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Email *
                                </label>

                                <input
                                    type="email"
                                    value={
                                        form.email
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        updateForm(
                                            'email',
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="employee@example.com"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            {/* Password */}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Password{' '}
                                    {!editingId &&
                                        '*'}
                                </label>

                                <input
                                    type="password"
                                    value={
                                        form.password
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        updateForm(
                                            'password',
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder={
                                        editingId
                                            ? 'Leave blank to keep current password'
                                            : 'Minimum 6 characters'
                                    }
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    required={
                                        !editingId
                                    }
                                />
                            </div>

                            {/* Role */}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Role *
                                </label>

                                <select
                                    value={
                                        form.role
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        updateForm(
                                            'role',
                                            e
                                                .target
                                                .value as EmployeeRole
                                        )
                                    }
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="CASHIER">
                                        CASHIER
                                    </option>

                                    <option value="ADMIN">
                                        ADMIN
                                    </option>
                                </select>
                            </div>

                            {/* Status */}

                            <div className="flex items-center justify-between border rounded-lg p-4">
                                <div>
                                    <p className="font-semibold text-gray-800">
                                        Account Status
                                    </p>

                                    <p className="text-xs text-gray-500 mt-1">
                                        Inactive employees
                                        cannot use the
                                        account.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        updateForm(
                                            'isActive',
                                            !form.isActive
                                        )
                                    }
                                    className={`relative w-12 h-6 rounded-full transition ${
                                        form.isActive
                                            ? 'bg-green-500'
                                            : 'bg-gray-300'
                                    }`}
                                >
                                    <span
                                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition ${
                                            form.isActive
                                                ? 'left-7'
                                                : 'left-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Buttons */}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        saving
                                    }
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        saving
                                    }
                                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                                >
                                    {saving && (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    )}

                                    {editingId
                                        ? 'Save Changes'
                                        : 'Create Employee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// Statistic Card
// ============================================================

function StatCard({
                      title,
                      value,
                      icon: Icon,
                      type,
                  }: {
    title: string;
    value: number;
    icon: any;
    type:
        | 'blue'
        | 'green'
        | 'red'
        | 'purple';
}) {
    const styles = {
        blue: {
            wrapper:
                'bg-blue-50 border-blue-100',
            icon:
                'bg-blue-100 text-blue-700',
        },

        green: {
            wrapper:
                'bg-green-50 border-green-100',
            icon:
                'bg-green-100 text-green-700',
        },

        red: {
            wrapper:
                'bg-red-50 border-red-100',
            icon:
                'bg-red-100 text-red-700',
        },

        purple: {
            wrapper:
                'bg-purple-50 border-purple-100',
            icon:
                'bg-purple-100 text-purple-700',
        },
    };

    return (
        <div
            className={`rounded-xl border p-5 shadow-sm ${styles[type].wrapper}`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">
                        {title}
                    </p>

                    <p className="text-2xl font-bold text-gray-900 mt-1">
                        {value}
                    </p>
                </div>

                <div
                    className={`p-3 rounded-xl ${styles[type].icon}`}
                >
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}