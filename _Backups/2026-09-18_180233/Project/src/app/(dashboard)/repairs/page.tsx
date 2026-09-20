'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
    Plus,
    Eye,
    X,
    Search,
    Wrench,
    User,
    Phone,
    MapPin,
    Smartphone,
    CalendarDays,
    CreditCard,
    RefreshCw,
    CheckCircle2,
    Clock,
    AlertCircle,
    Ban,
} from 'lucide-react';
import toast from 'react-hot-toast';

type RepairStatus =
    | 'PENDING'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';

interface Repair {
    id: number;

    customer?: {
        id?: number;
        name: string;
        phone: string;
        address?: string;
    } | null;

    product?: {
        id?: number;
        name: string;
    } | null;

    customerName?: string;
    phoneNumber?: string;
    address?: string;
    device?: string;
    condition?: string;

    advancePayment?: number;

    expectedCompletionDate?: string | null;

    status: RepairStatus;

    createdAt: string;

    updatedAt?: string;
}

interface RepairForm {
    customerName: string;
    phoneNumber: string;
    address: string;
    device: string;
    condition: string;
    advancePayment: string;
    expectedCompletionDate: string;
}

const initialForm: RepairForm = {
    customerName: '',
    phoneNumber: '',
    address: '',
    device: '',
    condition: '',
    advancePayment: '',
    expectedCompletionDate: '',
};

export default function RepairsPage() {
    const [repairs, setRepairs] = useState<Repair[]>(
        []
    );

    const [loading, setLoading] = useState(true);

    const [showAddModal, setShowAddModal] =
        useState(false);

    const [showViewModal, setShowViewModal] =
        useState(false);

    const [selectedRepair, setSelectedRepair] =
        useState<Repair | null>(null);

    const [form, setForm] =
        useState<RepairForm>(
            initialForm
        );

    const [saving, setSaving] =
        useState(false);

    const [searchQuery, setSearchQuery] =
        useState('');

    const [statusUpdating, setStatusUpdating] =
        useState<number | null>(null);

    // ============================================================
    // LOAD REPAIRS
    // ============================================================

    const loadRepairs = async () => {
        try {
            setLoading(true);

            const res =
                await fetch('/api/repairs');

            if (!res.ok) {
                throw new Error(
                    'Failed to load repairs'
                );
            }

            const data =
                await res.json();

            setRepairs(
                Array.isArray(data)
                    ? data
                    : data.repairs || []
            );
        } catch (error) {
            console.error(
                'Load repairs error:',
                error
            );

            toast.error(
                'Failed to load repairs'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRepairs();
    }, []);

    // ============================================================
    // FORM CHANGE
    // ============================================================

    const handleFormChange = (
        field: keyof RepairForm,
        value: string
    ) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // ============================================================
    // ADD REPAIR
    // ============================================================

    const handleAddRepair = async () => {
        if (
            !form.customerName.trim()
        ) {
            toast.error(
                'Customer name is required'
            );
            return;
        }

        if (
            !form.phoneNumber.trim()
        ) {
            toast.error(
                'Phone number is required'
            );
            return;
        }

        if (!form.device.trim()) {
            toast.error(
                'Device is required'
            );
            return;
        }

        if (
            !form.expectedCompletionDate
        ) {
            toast.error(
                'Expected completion date is required'
            );
            return;
        }

        const advancePayment =
            Number(
                form.advancePayment || 0
            );

        if (
            advancePayment < 0
        ) {
            toast.error(
                'Advance payment cannot be negative'
            );
            return;
        }

        try {
            setSaving(true);

            const res =
                await fetch(
                    '/api/repairs',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json',
                        },

                        body: JSON.stringify({
                            customerName:
                                form.customerName.trim(),

                            phoneNumber:
                                form.phoneNumber.trim(),

                            address:
                                form.address.trim(),

                            device:
                                form.device.trim(),

                            condition:
                                form.condition.trim(),

                            advancePayment,

                            expectedCompletionDate:
                            form.expectedCompletionDate,

                            status: 'PENDING',
                        }),
                    }
                );

            const data =
                await res.json();

            if (!res.ok) {
                throw new Error(
                    data?.message ||
                    'Failed to add repair'
                );
            }

            toast.success(
                'Repair added successfully'
            );

            setForm(
                initialForm
            );

            setShowAddModal(false);

            await loadRepairs();
        } catch (error: any) {
            console.error(
                'Add repair error:',
                error
            );

            toast.error(
                error?.message ||
                'Failed to add repair'
            );
        } finally {
            setSaving(false);
        }
    };

    // ============================================================
    // UPDATE STATUS
    // ============================================================

    const handleStatusChange = async (
        repairId: number,
        status: RepairStatus
    ) => {
        try {
            setStatusUpdating(
                repairId
            );

            const res =
                await fetch(
                    `/api/repairs/${repairId}`,
                    {
                        method: 'PATCH',

                        headers: {
                            'Content-Type':
                                'application/json',
                        },

                        body: JSON.stringify({
                            status,
                        }),
                    }
                );

            const data =
                await res.json();

            if (!res.ok) {
                throw new Error(
                    data?.message ||
                    'Failed to update status'
                );
            }

            setRepairs(
                (prev) =>
                    prev.map(
                        (repair) =>
                            repair.id ===
                            repairId
                                ? {
                                    ...repair,
                                    status,
                                }
                                : repair
                    )
            );

            if (
                selectedRepair?.id ===
                repairId
            ) {
                setSelectedRepair(
                    (prev) =>
                        prev
                            ? {
                                ...prev,
                                status,
                            }
                            : null
                );
            }

            toast.success(
                'Status updated successfully'
            );
        } catch (error: any) {
            console.error(
                'Status update error:',
                error
            );

            toast.error(
                error?.message ||
                'Failed to update status'
            );
        } finally {
            setStatusUpdating(
                null
            );
        }
    };

    // ============================================================
    // VIEW REPAIR
    // ============================================================

    const handleViewRepair = (
        repair: Repair
    ) => {
        setSelectedRepair(
            repair
        );

        setShowViewModal(
            true
        );
    };

    // ============================================================
    // STATUS STYLE
    // ============================================================

    const getStatusStyle = (
        status: RepairStatus
    ) => {
        switch (status) {
            case 'PENDING':
                return {
                    bg: 'bg-yellow-100',
                    text: 'text-yellow-800',
                    icon: Clock,
                };

            case 'IN_PROGRESS':
                return {
                    bg: 'bg-blue-100',
                    text: 'text-blue-800',
                    icon: RefreshCw,
                };

            case 'COMPLETED':
                return {
                    bg: 'bg-green-100',
                    text: 'text-green-800',
                    icon: CheckCircle2,
                };

            case 'CANCELLED':
                return {
                    bg: 'bg-red-100',
                    text: 'text-red-800',
                    icon: Ban,
                };

            default:
                return {
                    bg: 'bg-gray-100',
                    text: 'text-gray-800',
                    icon: AlertCircle,
                };
        }
    };

    // ============================================================
    // FILTER
    // ============================================================

    const filteredRepairs =
        repairs.filter(
            (repair) => {
                const query =
                    searchQuery
                        .trim()
                        .toLowerCase();

                if (!query) {
                    return true;
                }

                const customerName =
                    repair.customer
                        ?.name ||
                    repair.customerName ||
                    '';

                const phone =
                    repair.customer
                        ?.phone ||
                    repair.phoneNumber ||
                    '';

                const device =
                    repair.product
                        ?.name ||
                    repair.device ||
                    '';

                return (
                    customerName
                        .toLowerCase()
                        .includes(query) ||
                    phone
                        .toLowerCase()
                        .includes(query) ||
                    device
                        .toLowerCase()
                        .includes(query) ||
                    String(
                        repair.id
                    ).includes(query)
                );
            }
        );

    // ============================================================
    // CUSTOMER DETAILS
    // ============================================================

    const getCustomerName = (
        repair: Repair
    ) =>
        repair.customer?.name ||
        repair.customerName ||
        'N/A';

    const getPhone = (
        repair: Repair
    ) =>
        repair.customer?.phone ||
        repair.phoneNumber ||
        'N/A';

    const getAddress = (
        repair: Repair
    ) =>
        repair.customer?.address ||
        repair.address ||
        'N/A';

    const getDevice = (
        repair: Repair
    ) =>
        repair.product?.name ||
        repair.device ||
        'N/A';

    // ============================================================
    // DASHBOARD COUNTS
    // ============================================================

    const pendingCount =
        repairs.filter(
            (r) =>
                r.status ===
                'PENDING'
        ).length;

    const progressCount =
        repairs.filter(
            (r) =>
                r.status ===
                'IN_PROGRESS'
        ).length;

    const completedCount =
        repairs.filter(
            (r) =>
                r.status ===
                'COMPLETED'
        ).length;

    return (
        <div className="p-1">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Repairs
                    </h1>

                    <p className="text-sm text-gray-500 mt-1">
                        Manage customer device repairs
                    </p>
                </div>

                <button
                    onClick={() =>
                        setShowAddModal(
                            true
                        )
                    }
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition"
                >
                    <Plus className="w-5 h-5" />
                    New Repair
                </button>

            </div>

            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm text-gray-500">
                                Total Repairs
                            </p>

                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {repairs.length}
                            </p>
                        </div>

                        <div className="w-11 h-11 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Wrench className="w-5 h-5 text-purple-600" />
                        </div>

                    </div>

                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm text-gray-500">
                                Pending
                            </p>

                            <p className="text-2xl font-bold text-yellow-600 mt-1">
                                {pendingCount}
                            </p>
                        </div>

                        <div className="w-11 h-11 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-yellow-600" />
                        </div>

                    </div>

                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm text-gray-500">
                                In Progress
                            </p>

                            <p className="text-2xl font-bold text-blue-600 mt-1">
                                {progressCount}
                            </p>
                        </div>

                        <div className="w-11 h-11 rounded-lg bg-blue-100 flex items-center justify-center">
                            <RefreshCw className="w-5 h-5 text-blue-600" />
                        </div>

                    </div>

                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">

                    <div className="flex items-center justify-between">

                        <div>
                            <p className="text-sm text-gray-500">
                                Completed
                            </p>

                            <p className="text-2xl font-bold text-green-600 mt-1">
                                {completedCount}
                            </p>
                        </div>

                        <div className="w-11 h-11 rounded-lg bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>

                    </div>

                </div>

            </div>

            {/* ==================================================
                SEARCH
            ================================================== */}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">

                <div className="relative">

                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                    <input
                        type="text"
                        placeholder="Search by customer, phone, device or repair ID..."
                        value={
                            searchQuery
                        }
                        onChange={(e) =>
                            setSearchQuery(
                                e.target.value
                            )
                        }
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                </div>

            </div>

            {/* ==================================================
                TABLE
            ================================================== */}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                {loading ? (
                    <div className="p-10 text-center">

                        <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />

                        <p className="text-gray-500">
                            Loading repairs...
                        </p>

                    </div>
                ) : filteredRepairs.length ===
                0 ? (
                    <div className="p-10 text-center">

                        <Wrench className="w-12 h-12 mx-auto text-gray-300 mb-3" />

                        <h3 className="font-semibold text-gray-700">
                            No repairs found
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                            Add a new repair to get started.
                        </p>

                    </div>
                ) : (
                    <div className="overflow-x-auto">

                        <table className="min-w-full">

                            <thead className="bg-gray-50 border-b">

                            <tr>

                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                    ID
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                    Customer
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                    Phone
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                    Device
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                    Advance
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                    Expected Date
                                </th>

                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                                    Status
                                </th>

                                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                                    Action
                                </th>

                            </tr>

                            </thead>

                            <tbody className="divide-y divide-gray-100">

                            {filteredRepairs.map(
                                (repair) => {

                                    const statusStyle =
                                        getStatusStyle(
                                            repair.status
                                        );

                                    const StatusIcon =
                                        statusStyle.icon;

                                    return (
                                        <tr
                                            key={
                                                repair.id
                                            }
                                            className="hover:bg-gray-50 transition"
                                        >

                                            {/* ID */}

                                            <td className="px-5 py-4 whitespace-nowrap">

                                                    <span className="font-semibold text-gray-800">
                                                        #
                                                        {
                                                            repair.id
                                                        }
                                                    </span>

                                            </td>

                                            {/* CUSTOMER */}

                                            <td className="px-5 py-4 whitespace-nowrap">

                                                <div className="flex items-center gap-2">

                                                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <User className="w-4 h-4 text-blue-600" />
                                                    </div>

                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {getCustomerName(
                                                                repair
                                                            )}
                                                        </p>

                                                        <p className="text-xs text-gray-500">
                                                            {format(
                                                                new Date(
                                                                    repair.createdAt
                                                                ),
                                                                'dd/MM/yyyy'
                                                            )}
                                                        </p>
                                                    </div>

                                                </div>

                                            </td>

                                            {/* PHONE */}

                                            <td className="px-5 py-4 whitespace-nowrap">

                                                <div className="flex items-center gap-1.5 text-gray-600">

                                                    <Phone className="w-4 h-4 text-gray-400" />

                                                    {
                                                        getPhone(
                                                            repair
                                                        )
                                                    }

                                                </div>

                                            </td>

                                            {/* DEVICE */}

                                            <td className="px-5 py-4 whitespace-nowrap">

                                                <div className="flex items-center gap-2">

                                                    <Smartphone className="w-4 h-4 text-gray-400" />

                                                    <span className="font-medium text-gray-800">
                                                            {getDevice(
                                                                repair
                                                            )}
                                                        </span>

                                                </div>

                                            </td>

                                            {/* ADVANCE */}

                                            <td className="px-5 py-4 whitespace-nowrap">

                                                    <span className="font-medium text-gray-800">
                                                        LKR{' '}
                                                        {Number(
                                                            repair.advancePayment ||
                                                            0
                                                        ).toFixed(
                                                            2
                                                        )}
                                                    </span>

                                            </td>

                                            {/* EXPECTED DATE */}

                                            <td className="px-5 py-4 whitespace-nowrap">

                                                {repair.expectedCompletionDate ? (
                                                    <div className="flex items-center gap-1.5 text-gray-600">

                                                        <CalendarDays className="w-4 h-4 text-gray-400" />

                                                        {format(
                                                            new Date(
                                                                repair.expectedCompletionDate
                                                            ),
                                                            'dd/MM/yyyy'
                                                        )}

                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">
                                                            N/A
                                                        </span>
                                                )}

                                            </td>

                                            {/* STATUS */}

                                            <td className="px-5 py-4 whitespace-nowrap">

                                                <div className="flex items-center gap-2">

                                                    <div
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}
                                                    >
                                                        <StatusIcon className="w-3.5 h-3.5" />

                                                        {
                                                            repair.status
                                                        }
                                                    </div>

                                                    <select
                                                        value={
                                                            repair.status
                                                        }
                                                        disabled={
                                                            statusUpdating ===
                                                            repair.id
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            handleStatusChange(
                                                                repair.id,
                                                                e.target
                                                                    .value as RepairStatus
                                                            )
                                                        }
                                                        className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                                                    >

                                                        <option value="PENDING">
                                                            Pending
                                                        </option>

                                                        <option value="IN_PROGRESS">
                                                            In Progress
                                                        </option>

                                                        <option value="COMPLETED">
                                                            Completed
                                                        </option>

                                                        <option value="CANCELLED">
                                                            Cancelled
                                                        </option>

                                                    </select>

                                                </div>

                                            </td>

                                            {/* ACTION */}

                                            <td className="px-5 py-4 whitespace-nowrap text-center">

                                                <button
                                                    onClick={() =>
                                                        handleViewRepair(
                                                            repair
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium transition"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </button>

                                            </td>

                                        </tr>
                                    );
                                }
                            )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

            {/* ==================================================
                ADD REPAIR MODAL
            ================================================== */}

            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">

                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

                        {/* MODAL HEADER */}

                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">

                            <div>

                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">

                                    <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Wrench className="w-5 h-5 text-blue-600" />
                                    </div>

                                    New Repair

                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    Enter customer and device repair details
                                </p>

                            </div>

                            <button
                                onClick={() =>
                                    setShowAddModal(
                                        false
                                    )
                                }
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>

                        </div>

                        {/* FORM */}

                        <div className="p-6 space-y-5">

                            {/* CUSTOMER SECTION */}

                            <div>

                                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                                    Customer Information
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    {/* CUSTOMER NAME */}

                                    <div>

                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Customer Name
                                            <span className="text-red-500">
                                                {' '}*
                                            </span>
                                        </label>

                                        <div className="relative">

                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                                            <input
                                                type="text"
                                                value={
                                                    form.customerName
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleFormChange(
                                                        'customerName',
                                                        e.target
                                                            .value
                                                    )
                                                }
                                                placeholder="Enter customer name"
                                                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            />

                                        </div>

                                    </div>

                                    {/* PHONE */}

                                    <div>

                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone Number
                                            <span className="text-red-500">
                                                {' '}*
                                            </span>
                                        </label>

                                        <div className="relative">

                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                                            <input
                                                type="tel"
                                                value={
                                                    form.phoneNumber
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleFormChange(
                                                        'phoneNumber',
                                                        e.target
                                                            .value
                                                    )
                                                }
                                                placeholder="07XXXXXXXX"
                                                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            />

                                        </div>

                                    </div>

                                    {/* ADDRESS */}

                                    <div className="md:col-span-2">

                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Address
                                        </label>

                                        <div className="relative">

                                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />

                                            <textarea
                                                rows={2}
                                                value={
                                                    form.address
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleFormChange(
                                                        'address',
                                                        e.target
                                                            .value
                                                    )
                                                }
                                                placeholder="Enter customer address"
                                                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                            />

                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* DEVICE SECTION */}

                            <div className="border-t pt-5">

                                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                                    Device Information
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    {/* DEVICE */}

                                    <div>

                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Device
                                            <span className="text-red-500">
                                                {' '}*
                                            </span>
                                        </label>

                                        <div className="relative">

                                            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                                            <input
                                                type="text"
                                                value={
                                                    form.device
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleFormChange(
                                                        'device',
                                                        e.target
                                                            .value
                                                    )
                                                }
                                                placeholder="e.g. iPhone 13 Pro"
                                                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            />

                                        </div>

                                    </div>

                                    {/* EXPECTED DATE */}

                                    <div>

                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Expected Completion Date
                                            <span className="text-red-500">
                                                {' '}*
                                            </span>
                                        </label>

                                        <div className="relative">

                                            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                                            <input
                                                type="date"
                                                value={
                                                    form.expectedCompletionDate
                                                }
                                                min={
                                                    new Date()
                                                        .toISOString()
                                                        .split(
                                                            'T'
                                                        )[0]
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleFormChange(
                                                        'expectedCompletionDate',
                                                        e.target
                                                            .value
                                                    )
                                                }
                                                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            />

                                        </div>

                                    </div>

                                    {/* CONDITION */}

                                    <div className="md:col-span-2">

                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Condition
                                        </label>

                                        <textarea
                                            rows={3}
                                            value={
                                                form.condition
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                handleFormChange(
                                                    'condition',
                                                    e.target
                                                        .value
                                                )
                                            }
                                            placeholder="Describe the current device condition, damage, issue, etc."
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                        />

                                    </div>

                                    {/* ADVANCE */}

                                    <div>

                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Advance Payment
                                            (LKR)
                                        </label>

                                        <div className="relative">

                                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={
                                                    form.advancePayment
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    handleFormChange(
                                                        'advancePayment',
                                                        e.target
                                                            .value
                                                    )
                                                }
                                                placeholder="0.00"
                                                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            />

                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* DEFAULT STATUS */}

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">

                                <Clock className="w-4 h-4 text-yellow-600" />

                                <p className="text-sm text-yellow-800">
                                    New repairs will automatically start with
                                    <strong>
                                        {' '}PENDING
                                    </strong>
                                    {' '}status.
                                </p>

                            </div>

                        </div>

                        {/* FOOTER */}

                        <div className="border-t px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end">

                            <button
                                onClick={() => {
                                    setShowAddModal(
                                        false
                                    );

                                    setForm(
                                        initialForm
                                    );
                                }}
                                className="px-5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={
                                    handleAddRepair
                                }
                                disabled={
                                    saving
                                }
                                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >

                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        Add Repair
                                    </>
                                )}

                            </button>

                        </div>

                    </div>

                </div>
            )}

            {/* ==================================================
                VIEW REPAIR MODAL
            ================================================== */}

            {showViewModal &&
                selectedRepair && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">

                        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">

                            {/* HEADER */}

                            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">

                                <div>

                                    <div className="flex items-center gap-2">

                                        <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <Wrench className="w-5 h-5 text-purple-600" />
                                        </div>

                                        <div>

                                            <h2 className="text-lg font-bold text-gray-900">
                                                Repair #
                                                {
                                                    selectedRepair.id
                                                }
                                            </h2>

                                            <p className="text-xs text-gray-500">
                                                {format(
                                                    new Date(
                                                        selectedRepair.createdAt
                                                    ),
                                                    'dd/MM/yyyy HH:mm'
                                                )}
                                            </p>

                                        </div>

                                    </div>

                                </div>

                                <button
                                    onClick={() =>
                                        setShowViewModal(
                                            false
                                        )
                                    }
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>

                            </div>

                            {/* CONTENT */}

                            <div className="p-6 space-y-5">

                                {/* STATUS */}

                                <div className="bg-gray-50 rounded-xl p-4">

                                    <div className="flex justify-between items-center">

                                        <span className="text-sm font-medium text-gray-600">
                                            Current Status
                                        </span>

                                        <div
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                                                getStatusStyle(
                                                    selectedRepair.status
                                                ).bg
                                            } ${
                                                getStatusStyle(
                                                    selectedRepair.status
                                                ).text
                                            }`}
                                        >
                                            {
                                                selectedRepair.status
                                            }
                                        </div>

                                    </div>

                                    <div className="mt-3">

                                        <label className="text-xs text-gray-500 block mb-1">
                                            Change Status
                                        </label>

                                        <select
                                            value={
                                                selectedRepair.status
                                            }
                                            disabled={
                                                statusUpdating ===
                                                selectedRepair.id
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                handleStatusChange(
                                                    selectedRepair.id,
                                                    e.target
                                                        .value as RepairStatus
                                                )
                                            }
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        >

                                            <option value="PENDING">
                                                Pending
                                            </option>

                                            <option value="IN_PROGRESS">
                                                In Progress
                                            </option>

                                            <option value="COMPLETED">
                                                Completed
                                            </option>

                                            <option value="CANCELLED">
                                                Cancelled
                                            </option>

                                        </select>

                                    </div>

                                </div>

                                {/* CUSTOMER */}

                                <div>

                                    <h3 className="font-semibold text-gray-900 mb-3">
                                        Customer Information
                                    </h3>

                                    <div className="space-y-3">

                                        <div className="flex items-start gap-3">

                                            <User className="w-4 h-4 text-gray-400 mt-1" />

                                            <div>

                                                <p className="text-xs text-gray-500">
                                                    Customer Name
                                                </p>

                                                <p className="font-medium text-gray-900">
                                                    {getCustomerName(
                                                        selectedRepair
                                                    )}
                                                </p>

                                            </div>

                                        </div>

                                        <div className="flex items-start gap-3">

                                            <Phone className="w-4 h-4 text-gray-400 mt-1" />

                                            <div>

                                                <p className="text-xs text-gray-500">
                                                    Phone Number
                                                </p>

                                                <p className="font-medium text-gray-900">
                                                    {getPhone(
                                                        selectedRepair
                                                    )}
                                                </p>

                                            </div>

                                        </div>

                                        <div className="flex items-start gap-3">

                                            <MapPin className="w-4 h-4 text-gray-400 mt-1" />

                                            <div>

                                                <p className="text-xs text-gray-500">
                                                    Address
                                                </p>

                                                <p className="font-medium text-gray-900">
                                                    {getAddress(
                                                        selectedRepair
                                                    )}
                                                </p>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                                {/* DEVICE */}

                                <div className="border-t pt-5">

                                    <h3 className="font-semibold text-gray-900 mb-3">
                                        Device Information
                                    </h3>

                                    <div className="space-y-3">

                                        <div className="flex items-start gap-3">

                                            <Smartphone className="w-4 h-4 text-gray-400 mt-1" />

                                            <div>

                                                <p className="text-xs text-gray-500">
                                                    Device
                                                </p>

                                                <p className="font-medium text-gray-900">
                                                    {getDevice(
                                                        selectedRepair
                                                    )}
                                                </p>

                                            </div>

                                        </div>

                                        <div className="flex items-start gap-3">

                                            <AlertCircle className="w-4 h-4 text-gray-400 mt-1" />

                                            <div>

                                                <p className="text-xs text-gray-500">
                                                    Condition
                                                </p>

                                                <p className="font-medium text-gray-900 whitespace-pre-wrap">
                                                    {selectedRepair.condition ||
                                                        'N/A'}
                                                </p>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                                {/* PAYMENT */}

                                <div className="border-t pt-5">

                                    <h3 className="font-semibold text-gray-900 mb-3">
                                        Payment & Completion
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                        <div className="bg-green-50 rounded-lg p-3">

                                            <p className="text-xs text-green-700">
                                                Advance Payment
                                            </p>

                                            <p className="text-lg font-bold text-green-800">
                                                LKR{' '}
                                                {Number(
                                                    selectedRepair.advancePayment ||
                                                    0
                                                ).toFixed(
                                                    2
                                                )}
                                            </p>

                                        </div>

                                        <div className="bg-blue-50 rounded-lg p-3">

                                            <p className="text-xs text-blue-700">
                                                Expected Completion
                                            </p>

                                            <p className="text-lg font-bold text-blue-800">

                                                {selectedRepair.expectedCompletionDate
                                                    ? format(
                                                        new Date(
                                                            selectedRepair.expectedCompletionDate
                                                        ),
                                                        'dd/MM/yyyy'
                                                    )
                                                    : 'N/A'}

                                            </p>

                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* FOOTER */}

                            <div className="border-t px-6 py-4">

                                <button
                                    onClick={() =>
                                        setShowViewModal(
                                            false
                                        )
                                    }
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium"
                                >
                                    Close
                                </button>

                            </div>

                        </div>

                    </div>
                )}

        </div>
    );
}