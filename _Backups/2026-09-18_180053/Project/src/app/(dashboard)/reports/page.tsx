'use client';

import { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { format } from 'date-fns';
import {
    Calendar,
    Download,
    Wallet,
    Receipt,
    Package,
    AlertCircle,
    Users,
    Truck,
    Wrench,
    TrendingUp,
    RefreshCw,
    FileSpreadsheet,
    FileText,
    Search,
} from 'lucide-react';

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

// ============================================================
// Types
// ============================================================

type ReportTabId =
    | 'sales'
    | 'customers'
    | 'installments'
    | 'repairs'
    | 'suppliers';

interface ReportTab {
    id: ReportTabId;
    label: string;
    endpoint: string;
}

interface ReportData {
    [key: string]: any;
}

// ============================================================
// Report Tabs
// ============================================================

const reportTabs: ReportTab[] = [
    {
        id: 'sales',
        label: 'Sales Report',
        endpoint: '/api/reports/sales',
    },
    {
        id: 'customers',
        label: 'Customer Report',
        endpoint: '/api/reports/customers',
    },
    {
        id: 'installments',
        label: 'Installments',
        endpoint: '/api/reports/installments',
    },
    {
        id: 'repairs',
        label: 'Repairs',
        endpoint: '/api/reports/repairs',
    },
    {
        id: 'suppliers',
        label: 'Supplier Report',
        endpoint: '/api/reports/suppliers',
    },
];

// ============================================================
// Main Reports Page
// ============================================================

export default function ReportsPage() {
    const [activeTab, setActiveTab] =
        useState<ReportTabId>('sales');

    const [reportData, setReportData] =
        useState<ReportData | null>(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');

    const [dateFrom, setDateFrom] = useState(
        format(
            new Date(new Date().setDate(1)),
            'yyyy-MM-dd'
        )
    );

    const [dateTo, setDateTo] = useState(
        format(new Date(), 'yyyy-MM-dd')
    );

    const [filter, setFilter] = useState('');

    // ========================================================
    // Fetch Report
    // ========================================================

    const fetchReport = async () => {
        try {
            setLoading(true);
            setError('');

            const tab = reportTabs.find(
                (item) => item.id === activeTab
            );

            if (!tab) {
                throw new Error('Report not found');
            }

            if (!dateFrom || !dateTo) {
                throw new Error(
                    'Please select both From and To dates'
                );
            }

            if (new Date(dateFrom) > new Date(dateTo)) {
                throw new Error(
                    'From date cannot be after To date'
                );
            }

            const url =
                `${tab.endpoint}` +
                `?from=${dateFrom}` +
                `&to=${dateTo}` +
                `&filter=${encodeURIComponent(filter)}`;

            const response = await fetch(url, {
                cache: 'no-store',
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to load report (${response.status})`
                );
            }

            const data = await response.json();

            setReportData(data);
        } catch (err: any) {
            console.error(err);

            setError(
                err?.message ||
                'Unable to load report'
            );

            setReportData(null);
        } finally {
            setLoading(false);
        }
    };

    // ========================================================
    // Load when changing report tab
    // ========================================================

    useEffect(() => {
        fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // ========================================================
    // Export PDF
    // ========================================================

    const handleExportPDF = () => {
        if (!reportData) {
            alert('Please load a report first.');
            return;
        }

        try {
            const doc = new jsPDF();

            const tab = reportTabs.find(
                (item) => item.id === activeTab
            );

            const title =
                tab?.label || 'Report';

            // ------------------------------------------------
            // Header
            // ------------------------------------------------

            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text(title, 14, 18);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            doc.text(
                `Period: ${dateFrom} to ${dateTo}`,
                14,
                26
            );

            if (filter.trim()) {
                doc.text(
                    `Filter: ${filter}`,
                    14,
                    32
                );
            }

            doc.text(
                `Generated: ${format(
                    new Date(),
                    'dd/MM/yyyy HH:mm'
                )}`,
                14,
                filter.trim() ? 38 : 32
            );

            // ------------------------------------------------
            // SALES
            // ------------------------------------------------

            if (activeTab === 'sales') {
                const summary =
                    reportData.summary || {};

                const sales =
                    reportData.sales || [];

                autoTable(doc, {
                    startY: filter.trim() ? 44 : 38,

                    head: [
                        [
                            'Invoice',
                            'Date',
                            'Customer',
                            'Payment',
                            'Amount',
                        ],
                    ],

                    body: sales.map(
                        (sale: any) => [
                            sale.invoiceNo || 'N/A',

                            sale.saleDate
                                ? format(
                                    new Date(
                                        sale.saleDate
                                    ),
                                    'dd/MM/yyyy HH:mm'
                                )
                                : 'N/A',

                            sale.customer?.name ||
                            'Walk-in',

                            sale.paymentMethod ||
                            'N/A',

                            `LKR ${Number(
                                sale.grandTotal || 0
                            ).toFixed(2)}`,
                        ]
                    ),

                    theme: 'grid',

                    headStyles: {
                        fillColor: [
                            37,
                            99,
                            235,
                        ],
                    },

                    foot: [
                        [
                            '',
                            '',
                            '',
                            'Total Sales',
                            `LKR ${Number(
                                summary.totalSales || 0
                            ).toFixed(2)}`,
                        ],
                    ],
                });

                // Summary
                const finalY =
                    (doc as any).lastAutoTable
                        ?.finalY || 45;

                doc.setFontSize(10);

                doc.text(
                    `Total Orders: ${
                        summary.totalOrders || 0
                    }`,
                    14,
                    finalY + 10
                );

                doc.text(
                    `Total Items: ${
                        summary.totalItems || 0
                    }`,
                    14,
                    finalY + 17
                );

                doc.text(
                    `Average Order Value: LKR ${Number(
                        summary.avgOrderValue || 0
                    ).toFixed(2)}`,
                    14,
                    finalY + 24
                );
            }

            // ------------------------------------------------
            // CUSTOMERS
            // ------------------------------------------------

            if (activeTab === 'customers') {
                const summary =
                    reportData.summary || {};

                const customers =
                    reportData.customers || [];

                autoTable(doc, {
                    startY: filter.trim() ? 44 : 38,

                    head: [
                        [
                            'Name',
                            'Phone',
                            'Orders',
                            'Total Spent',
                            'Loyalty Points',
                        ],
                    ],

                    body: customers.map(
                        (customer: any) => [
                            customer.name || 'N/A',

                            customer.phone || 'N/A',

                            customer.orders || 0,

                            `LKR ${Number(
                                customer.totalSpent || 0
                            ).toFixed(2)}`,

                            customer.loyaltyPoints || 0,
                        ]
                    ),

                    theme: 'grid',

                    headStyles: {
                        fillColor: [
                            37,
                            99,
                            235,
                        ],
                    },
                });

                const finalY =
                    (doc as any).lastAutoTable
                        ?.finalY || 45;

                doc.setFontSize(10);

                doc.text(
                    `Total Customers: ${
                        summary.totalCustomers || 0
                    }`,
                    14,
                    finalY + 10
                );

                doc.text(
                    `New Customers: ${
                        summary.newCustomers || 0
                    }`,
                    14,
                    finalY + 17
                );

                doc.text(
                    `Top Customer: ${
                        summary.topCustomer || 'N/A'
                    }`,
                    14,
                    finalY + 24
                );
            }

            // ------------------------------------------------
            // INSTALLMENTS
            // ------------------------------------------------

            if (activeTab === 'installments') {
                const summary =
                    reportData.summary || {};

                const installments =
                    reportData.installments || [];

                autoTable(doc, {
                    startY: filter.trim() ? 44 : 38,

                    head: [
                        [
                            'Customer',
                            'Total',
                            'Paid',
                            'Balance',
                            'Status',
                        ],
                    ],

                    body: installments.map(
                        (item: any) => [
                            item.customer?.name ||
                            'N/A',

                            `LKR ${Number(
                                item.totalAmount || 0
                            ).toFixed(2)}`,

                            `LKR ${Number(
                                item.paidAmount || 0
                            ).toFixed(2)}`,

                            `LKR ${Number(
                                item.remainingBalance || 0
                            ).toFixed(2)}`,

                            item.status || 'N/A',
                        ]
                    ),

                    theme: 'grid',

                    headStyles: {
                        fillColor: [
                            37,
                            99,
                            235,
                        ],
                    },
                });

                const finalY =
                    (doc as any).lastAutoTable
                        ?.finalY || 45;

                doc.setFontSize(10);

                doc.text(
                    `Active Installments: ${
                        summary.active || 0
                    }`,
                    14,
                    finalY + 10
                );

                doc.text(
                    `Pending Amount: LKR ${Number(
                        summary.pendingAmount || 0
                    ).toFixed(2)}`,
                    14,
                    finalY + 17
                );

                doc.text(
                    `Overdue: ${
                        summary.overdue || 0
                    }`,
                    14,
                    finalY + 24
                );
            }

            // ------------------------------------------------
            // REPAIRS
            // ------------------------------------------------

            if (activeTab === 'repairs') {
                const summary =
                    reportData.summary || {};

                const repairs =
                    reportData.repairs || [];

                autoTable(doc, {
                    startY: filter.trim() ? 44 : 38,

                    head: [
                        [
                            'Customer',
                            'Device',
                            'Status',
                            'Advance',
                            'Estimated',
                            'Actual',
                        ],
                    ],

                    body: repairs.map(
                        (repair: any) => [
                            repair.customer?.name ||
                            'N/A',

                            repair.device ||
                            'N/A',

                            repair.status ||
                            'N/A',

                            `LKR ${Number(
                                repair.advancePayment || 0
                            ).toFixed(2)}`,

                            `LKR ${Number(
                                repair.costEstimate || 0
                            ).toFixed(2)}`,

                            `LKR ${Number(
                                repair.actualCost || 0
                            ).toFixed(2)}`,
                        ]
                    ),

                    theme: 'grid',

                    headStyles: {
                        fillColor: [
                            37,
                            99,
                            235,
                        ],
                    },
                });

                const finalY =
                    (doc as any).lastAutoTable
                        ?.finalY || 45;

                doc.setFontSize(10);

                doc.text(
                    `Total Repairs: ${
                        summary.total || 0
                    }`,
                    14,
                    finalY + 10
                );

                doc.text(
                    `Pending: ${
                        summary.pending || 0
                    }`,
                    14,
                    finalY + 17
                );

                doc.text(
                    `Completed: ${
                        summary.completed || 0
                    }`,
                    14,
                    finalY + 24
                );
            }

            // ------------------------------------------------
            // SUPPLIERS
            // ------------------------------------------------

            if (activeTab === 'suppliers') {
                const summary =
                    reportData.summary || {};

                const suppliers =
                    reportData.suppliers || [];

                autoTable(doc, {
                    startY: filter.trim() ? 44 : 38,

                    head: [
                        [
                            'Supplier',
                            'Company',
                            'Phone',
                            'Email',
                            'Purchases',
                        ],
                    ],

                    body: suppliers.map(
                        (supplier: any) => [
                            supplier.name ||
                            'N/A',

                            supplier.company ||
                            '—',

                            supplier.phone ||
                            '—',

                            supplier.email ||
                            '—',

                            `LKR ${Number(
                                supplier.totalPurchases ||
                                0
                            ).toFixed(2)}`,
                        ]
                    ),

                    theme: 'grid',

                    headStyles: {
                        fillColor: [
                            37,
                            99,
                            235,
                        ],
                    },
                });

                const finalY =
                    (doc as any).lastAutoTable
                        ?.finalY || 45;

                doc.setFontSize(10);

                doc.text(
                    `Total Suppliers: ${
                        summary.totalSuppliers || 0
                    }`,
                    14,
                    finalY + 10
                );

                doc.text(
                    `Total Purchases: LKR ${Number(
                        summary.totalPurchases || 0
                    ).toFixed(2)}`,
                    14,
                    finalY + 17
                );

                doc.text(
                    `Top Supplier: ${
                        summary.topSupplier || 'N/A'
                    }`,
                    14,
                    finalY + 24
                );
            }

            // ------------------------------------------------
            // Save
            // ------------------------------------------------

            const safeTitle = title
                .replace(/\s+/g, '-')
                .toLowerCase();

            doc.save(
                `${safeTitle}-${dateFrom}-to-${dateTo}.pdf`
            );
        } catch (error) {
            console.error(
                'PDF export error:',
                error
            );

            alert(
                'Unable to export PDF. Please try again.'
            );
        }
    };

    // ========================================================
    // Export Excel
    // ========================================================

    const handleExportExcel = () => {
        if (!reportData) {
            alert('Please load a report first.');
            return;
        }

        try {
            let rows: any[] = [];

            // ------------------------------------------------
            // SALES
            // ------------------------------------------------

            if (activeTab === 'sales') {
                const sales =
                    reportData.sales || [];

                rows = sales.map(
                    (sale: any) => ({
                        Invoice:
                            sale.invoiceNo ||
                            'N/A',

                        Date: sale.saleDate
                            ? format(
                                new Date(
                                    sale.saleDate
                                ),
                                'dd/MM/yyyy HH:mm'
                            )
                            : 'N/A',

                        Customer:
                            sale.customer?.name ||
                            'Walk-in',

                        Payment:
                            sale.paymentMethod ||
                            'N/A',

                        Amount: Number(
                            sale.grandTotal || 0
                        ),
                    })
                );
            }

            // ------------------------------------------------
            // CUSTOMERS
            // ------------------------------------------------

            if (activeTab === 'customers') {
                const customers =
                    reportData.customers || [];

                rows = customers.map(
                    (customer: any) => ({
                        Name:
                            customer.name ||
                            'N/A',

                        Phone:
                            customer.phone ||
                            'N/A',

                        Orders:
                            customer.orders ||
                            0,

                        'Total Spent':
                            Number(
                                customer.totalSpent ||
                                0
                            ),

                        'Loyalty Points':
                            customer.loyaltyPoints ||
                            0,
                    })
                );
            }

            // ------------------------------------------------
            // INSTALLMENTS
            // ------------------------------------------------

            if (activeTab === 'installments') {
                const installments =
                    reportData.installments || [];

                rows = installments.map(
                    (item: any) => ({
                        Customer:
                            item.customer?.name ||
                            'N/A',

                        Phone:
                            item.customer?.phone ||
                            'N/A',

                        Total:
                            Number(
                                item.totalAmount ||
                                0
                            ),

                        Paid:
                            Number(
                                item.paidAmount ||
                                0
                            ),

                        Balance:
                            Number(
                                item.remainingBalance ||
                                0
                            ),

                        Status:
                            item.status ||
                            'N/A',
                    })
                );
            }

            // ------------------------------------------------
            // REPAIRS
            // ------------------------------------------------

            if (activeTab === 'repairs') {
                const repairs =
                    reportData.repairs || [];

                rows = repairs.map(
                    (repair: any) => ({
                        Customer:
                            repair.customer?.name ||
                            'N/A',

                        Phone:
                            repair.customer?.phone ||
                            'N/A',

                        Device:
                            repair.device ||
                            'N/A',

                        Condition:
                            repair.condition ||
                            'N/A',

                        Status:
                            repair.status ||
                            'N/A',

                        'Advance Payment':
                            Number(
                                repair.advancePayment ||
                                0
                            ),

                        'Cost Estimate':
                            Number(
                                repair.costEstimate ||
                                0
                            ),

                        'Actual Cost':
                            Number(
                                repair.actualCost ||
                                0
                            ),

                        'Expected Completion':
                            repair.expectedCompletionDate
                                ? format(
                                    new Date(
                                        repair.expectedCompletionDate
                                    ),
                                    'dd/MM/yyyy'
                                )
                                : 'N/A',
                    })
                );
            }

            // ------------------------------------------------
            // SUPPLIERS
            // ------------------------------------------------

            if (activeTab === 'suppliers') {
                const suppliers =
                    reportData.suppliers || [];

                rows = suppliers.map(
                    (supplier: any) => ({
                        Name:
                            supplier.name ||
                            'N/A',

                        Company:
                            supplier.company ||
                            '—',

                        Phone:
                            supplier.phone ||
                            '—',

                        Email:
                            supplier.email ||
                            '—',

                        'Total Purchases':
                            Number(
                                supplier.totalPurchases ||
                                0
                            ),
                    })
                );
            }

            if (rows.length === 0) {
                alert(
                    'There is no data to export.'
                );
                return;
            }

            // ------------------------------------------------
            // Create Workbook
            // ------------------------------------------------

            const worksheet =
                XLSX.utils.json_to_sheet(rows);

            const workbook =
                XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                'Report'
            );

            // ------------------------------------------------
            // Column widths
            // ------------------------------------------------

            const columnWidths =
                Object.keys(rows[0]).map(
                    (key) => ({
                        wch: Math.max(
                            key.length + 2,
                            ...rows.map((row) =>
                                String(
                                    row[key] ?? ''
                                ).length + 2
                            ),
                            12
                        ),
                    })
                );

            worksheet['!cols'] =
                columnWidths;

            // ------------------------------------------------
            // Export
            // ------------------------------------------------

            const tab = reportTabs.find(
                (item) =>
                    item.id === activeTab
            );

            const safeTitle =
                tab?.label
                    .replace(/\s+/g, '-')
                    .toLowerCase() ||
                'report';

            XLSX.writeFile(
                workbook,
                `${safeTitle}-${dateFrom}-to-${dateTo}.xlsx`
            );
        } catch (error) {
            console.error(
                'Excel export error:',
                error
            );

            alert(
                'Unable to export Excel file.'
            );
        }
    };

    // ========================================================
    // Render Content
    // ========================================================

    const renderContent = () => {
        if (loading) {
            return (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-16">
                    <div className="flex flex-col items-center justify-center">
                        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mb-4" />

                        <p className="text-gray-600 font-medium">
                            Loading report...
                        </p>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-white rounded-xl shadow-sm border border-red-100 p-10 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />

                    <h3 className="text-lg font-semibold text-gray-800">
                        Unable to Load Report
                    </h3>

                    <p className="text-gray-500 mt-2">
                        {error}
                    </p>

                    <button
                        onClick={fetchReport}
                        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                </div>
            );
        }

        if (!reportData) {
            return (
                <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-500">
                    No data available.
                </div>
            );
        }

        switch (activeTab) {
            case 'sales':
                return (
                    <SalesReport
                        data={reportData}
                    />
                );

            case 'customers':
                return (
                    <CustomerReport
                        data={reportData}
                    />
                );

            case 'installments':
                return (
                    <InstallmentReport
                        data={reportData}
                    />
                );

            case 'repairs':
                return (
                    <RepairReport
                        data={reportData}
                    />
                );

            case 'suppliers':
                return (
                    <SupplierReport
                        data={reportData}
                    />
                );

            default:
                return null;
        }
    };

    // ========================================================
    // Main UI
    // ========================================================

    return (
        <div className="min-h-full  space-y-6 p-1">
            {/* ==================================================
                Page Header
            ================================================== */}

            <div>
                <h1 className="text-2xl md:text-2xl font-bold text-gray-900">
                    Reports
                </h1>

                <p className="text-gray-500 mt-1">
                    Analyze sales, customers,
                    installments, repairs and
                    suppliers.
                </p>
            </div>

            {/* ==================================================
                Filters
            ================================================== */}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-wrap items-end gap-4">
                    {/* From */}

                    <div className="w-full sm:w-auto">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            From
                        </label>

                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) =>
                                setDateFrom(
                                    e.target.value
                                )
                            }
                            className="w-full sm:w-44 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>

                    {/* To */}

                    <div className="w-full sm:w-auto">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            To
                        </label>

                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) =>
                                setDateTo(
                                    e.target.value
                                )
                            }
                            className="w-full sm:w-44 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>

                    {/* Search */}

                    <div className="w-full sm:flex-1 min-w-[220px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search / Filter
                        </label>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                            <input
                                type="text"
                                placeholder="Customer, product, phone..."
                                value={filter}
                                onChange={(e) =>
                                    setFilter(
                                        e.target.value
                                    )
                                }
                                onKeyDown={(e) => {
                                    if (
                                        e.key ===
                                        'Enter'
                                    ) {
                                        fetchReport();
                                    }
                                }}
                                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Buttons */}

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={fetchReport}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium transition"
                        >
                            <Calendar className="w-4 h-4" />

                            {loading
                                ? 'Loading...'
                                : 'Load Report'}
                        </button>

                        <button
                            onClick={
                                handleExportPDF
                            }
                            disabled={
                                loading ||
                                !reportData
                            }
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
                        >
                            <FileText className="w-4 h-4" />
                            Export PDF
                        </button>

                        <button
                            onClick={
                                handleExportExcel
                            }
                            disabled={
                                loading ||
                                !reportData
                            }
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Export Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* ==================================================
                Report Tabs
            ================================================== */}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-blue-600" />

                        <h2 className="text-lg font-bold text-gray-800">
                            REPORTS
                        </h2>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {reportTabs.map(
                            (tab) => {
                                const active =
                                    activeTab ===
                                    tab.id;

                                return (
                                    <button
                                        key={
                                            tab.id
                                        }
                                        onClick={() =>
                                            setActiveTab(
                                                tab.id
                                            )
                                        }
                                        className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                                            active
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {
                                            tab.label
                                        }
                                    </button>
                                );
                            }
                        )}
                    </div>
                </div>
            </div>

            {/* ==================================================
                Report Content
            ================================================== */}

            <div id="report-content">
                {renderContent()}
            </div>
        </div>
    );
}

// ============================================================
// SALES REPORT
// ============================================================

function SalesReport({
                         data,
                     }: {
    data: any;
}) {
    const summary =
        data?.summary || {
            totalSales: 0,
            totalOrders: 0,
            totalItems: 0,
            avgOrderValue: 0,
        };

    const sales =
        data?.sales || [];

    const dailySales =
        data?.dailySales || [];

    const paymentMethods =
        data?.paymentMethods || {};

    const barData = {
        labels: dailySales.map(
            (item: any) =>
                format(
                    new Date(item.date),
                    'MMM dd'
                )
        ),

        datasets: [
            {
                label: 'Sales (LKR)',

                data: dailySales.map(
                    (item: any) =>
                        Number(
                            item.total || 0
                        )
                ),

                backgroundColor:
                    'rgba(59, 130, 246, 0.55)',

                borderColor:
                    '#3b82f6',

                borderWidth: 1,
            },
        ],
    };

    const paymentKeys =
        Object.keys(
            paymentMethods
        );

    const doughnutData = {
        labels:
            paymentKeys.length
                ? paymentKeys
                : ['No Data'],

        datasets: [
            {
                data:
                    paymentKeys.length
                        ? paymentKeys.map(
                            (key) =>
                                Number(
                                    paymentMethods[
                                        key
                                        ] || 0
                                )
                        )
                        : [1],

                backgroundColor: [
                    '#3b82f6',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                    '#8b5cf6',
                ],
            },
        ],
    };

    return (
        <div className="space-y-6">
            {/* Summary */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Sales"
                    value={`LKR ${Number(
                        summary.totalSales || 0
                    ).toFixed(2)}`}
                    icon={Wallet}
                    color="blue"
                />

                <MetricCard
                    title="Total Orders"
                    value={
                        summary.totalOrders ||
                        0
                    }
                    icon={Receipt}
                    color="green"
                />

                <MetricCard
                    title="Items Sold"
                    value={
                        summary.totalItems ||
                        0
                    }
                    icon={Package}
                    color="purple"
                />

                <MetricCard
                    title="Average Order"
                    value={`LKR ${Number(
                        summary.avgOrderValue ||
                        0
                    ).toFixed(2)}`}
                    icon={TrendingUp}
                    color="orange"
                />
            </div>

            {/* Charts */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-5">
                        Sales Trend
                    </h3>

                    <div className="h-[320px]">
                        <Bar
                            data={barData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                            }}
                        />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-5">
                        Payment Methods
                    </h3>

                    <div className="h-[320px] flex items-center justify-center">
                        <Doughnut
                            data={
                                doughnutData
                            }
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Sales Table */}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b">
                    <h3 className="text-lg font-bold text-gray-800">
                        Recent Sales
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                        <tr>
                            <TableHead>
                                Invoice
                            </TableHead>

                            <TableHead>
                                Date
                            </TableHead>

                            <TableHead>
                                Customer
                            </TableHead>

                            <TableHead>
                                Method
                            </TableHead>

                            <TableHead align="right">
                                Amount
                            </TableHead>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                        {sales.length ===
                        0 ? (
                            <EmptyRow
                                colSpan={5}
                                text="No sales data found."
                            />
                        ) : (
                            sales.map(
                                (
                                    sale: any
                                ) => (
                                    <tr
                                        key={
                                            sale.id
                                        }
                                        className="hover:bg-gray-50"
                                    >
                                        <TableCell>
                                            {sale.invoiceNo ||
                                                'N/A'}
                                        </TableCell>

                                        <TableCell>
                                            {sale.saleDate
                                                ? format(
                                                    new Date(
                                                        sale.saleDate
                                                    ),
                                                    'dd/MM/yyyy HH:mm'
                                                )
                                                : 'N/A'}
                                        </TableCell>

                                        <TableCell>
                                            {sale
                                                    .customer
                                                    ?.name ||
                                                'Walk-in'}
                                        </TableCell>

                                        <TableCell>
                                            <StatusBadge
                                                status={
                                                    sale.paymentMethod ||
                                                    'N/A'
                                                }
                                            />
                                        </TableCell>

                                        <TableCell align="right">
                                                <span className="font-bold text-gray-900">
                                                    LKR{' '}
                                                    {Number(
                                                        sale.grandTotal ||
                                                        0
                                                    ).toFixed(
                                                        2
                                                    )}
                                                </span>
                                        </TableCell>
                                    </tr>
                                )
                            )
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// CUSTOMER REPORT
// ============================================================

function CustomerReport({
                            data,
                        }: {
    data: any;
}) {
    const summary =
        data?.summary || {
            totalCustomers: 0,
            newCustomers: 0,
            topCustomer: 'N/A',
        };

    const customers =
        data?.customers || [];

    return (
        <div className="space-y-6">
            {/* Summary */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    title="Total Customers"
                    value={
                        summary.totalCustomers ||
                        0
                    }
                    icon={Users}
                    color="blue"
                />

                <MetricCard
                    title="New Customers"
                    value={
                        summary.newCustomers ||
                        0
                    }
                    icon={Users}
                    color="green"
                />

                <MetricCard
                    title="Top Customer"
                    value={
                        summary.topCustomer ||
                        'N/A'
                    }
                    icon={TrendingUp}
                    color="purple"
                />
            </div>

            {/* Table */}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b">
                    <h3 className="text-lg font-bold text-gray-800">
                        Customer List
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                        <tr>
                            <TableHead>
                                Name
                            </TableHead>

                            <TableHead>
                                Phone
                            </TableHead>

                            <TableHead align="right">
                                Orders
                            </TableHead>

                            <TableHead align="right">
                                Total Spent
                            </TableHead>

                            <TableHead align="right">
                                Loyalty Points
                            </TableHead>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                        {customers.length ===
                        0 ? (
                            <EmptyRow
                                colSpan={5}
                                text="No customer data found."
                            />
                        ) : (
                            customers.map(
                                (
                                    customer: any
                                ) => (
                                    <tr
                                        key={
                                            customer.id
                                        }
                                        className="hover:bg-gray-50"
                                    >
                                        <TableCell>
                                            {customer.name ||
                                                'N/A'}
                                        </TableCell>

                                        <TableCell>
                                            {customer.phone ||
                                                'N/A'}
                                        </TableCell>

                                        <TableCell align="right">
                                            {
                                                customer.orders
                                            }
                                        </TableCell>

                                        <TableCell align="right">
                                            LKR{' '}
                                            {Number(
                                                customer.totalSpent ||
                                                0
                                            ).toFixed(
                                                2
                                            )}
                                        </TableCell>

                                        <TableCell align="right">
                                            {
                                                customer.loyaltyPoints
                                            }
                                        </TableCell>
                                    </tr>
                                )
                            )
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// INSTALLMENT REPORT
// ============================================================

function InstallmentReport({
                               data,
                           }: {
    data: any;
}) {
    const summary =
        data?.summary || {
            active: 0,
            pendingAmount: 0,
            overdue: 0,
        };

    const installments =
        data?.installments || [];

    const statusDistribution =
        data?.statusDistribution ||
        {};

    const statusKeys =
        Object.keys(
            statusDistribution
        );

    const doughnutData = {
        labels:
            statusKeys.length
                ? statusKeys
                : ['No Data'],

        datasets: [
            {
                data:
                    statusKeys.length
                        ? statusKeys.map(
                            (key) =>
                                Number(
                                    statusDistribution[
                                        key
                                        ] || 0
                                )
                        )
                        : [1],

                backgroundColor: [
                    '#f59e0b',
                    '#10b981',
                    '#ef4444',
                ],
            },
        ],
    };

    return (
        <div className="space-y-6">
            {/* Summary */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    title="Active Installments"
                    value={
                        summary.active || 0
                    }
                    icon={Receipt}
                    color="blue"
                />

                <MetricCard
                    title="Pending Amount"
                    value={`LKR ${Number(
                        summary.pendingAmount ||
                        0
                    ).toFixed(2)}`}
                    icon={Wallet}
                    color="orange"
                />

                <MetricCard
                    title="Overdue"
                    value={
                        summary.overdue || 0
                    }
                    icon={AlertCircle}
                    color="red"
                />
            </div>

            {/* Chart */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-5">
                        Status Distribution
                    </h3>

                    <div className="h-[320px] flex items-center justify-center">
                        <Doughnut
                            data={
                                doughnutData
                            }
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                            }}
                        />
                    </div>
                </div>

                {/* Table */}

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b">
                        <h3 className="text-lg font-bold text-gray-800">
                            Recent Installments
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                            <tr>
                                <TableHead>
                                    Customer
                                </TableHead>

                                <TableHead align="right">
                                    Total
                                </TableHead>

                                <TableHead align="right">
                                    Balance
                                </TableHead>

                                <TableHead>
                                    Status
                                </TableHead>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                            {installments.length ===
                            0 ? (
                                <EmptyRow
                                    colSpan={4}
                                    text="No installment data found."
                                />
                            ) : (
                                installments.map(
                                    (
                                        item: any
                                    ) => (
                                        <tr
                                            key={
                                                item.id
                                            }
                                            className="hover:bg-gray-50"
                                        >
                                            <TableCell>
                                                {item
                                                        .customer
                                                        ?.name ||
                                                    'N/A'}
                                            </TableCell>

                                            <TableCell align="right">
                                                LKR{' '}
                                                {Number(
                                                    item.totalAmount ||
                                                    0
                                                ).toFixed(
                                                    2
                                                )}
                                            </TableCell>

                                            <TableCell align="right">
                                                LKR{' '}
                                                {Number(
                                                    item.remainingBalance ||
                                                    0
                                                ).toFixed(
                                                    2
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <StatusBadge
                                                    status={
                                                        item.status
                                                    }
                                                />
                                            </TableCell>
                                        </tr>
                                    )
                                )
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// REPAIR REPORT
// ============================================================

function RepairReport({
                          data,
                      }: {
    data: any;
}) {
    const summary =
        data?.summary || {
            total: 0,
            pending: 0,
            completed: 0,
            inProgress: 0,
            cancelled: 0,
            totalAdvance: 0,
            totalEstimated: 0,
            totalActual: 0,
        };

    const repairs =
        data?.repairs || [];

    const statusDistribution =
        data?.statusDistribution ||
        {};

    const statusKeys =
        Object.keys(
            statusDistribution
        );

    const doughnutData = {
        labels:
            statusKeys.length
                ? statusKeys
                : ['No Data'],

        datasets: [
            {
                data:
                    statusKeys.length
                        ? statusKeys.map(
                            (key) =>
                                Number(
                                    statusDistribution[
                                        key
                                        ] || 0
                                )
                        )
                        : [1],

                backgroundColor: [
                    '#f59e0b',
                    '#3b82f6',
                    '#10b981',
                    '#ef4444',
                ],
            },
        ],
    };

    return (
        <div className="space-y-6">
            {/* Summary */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <MetricCard
                    title="Total Repairs"
                    value={
                        summary.total || 0
                    }
                    icon={Wrench}
                    color="blue"
                />

                <MetricCard
                    title="Pending"
                    value={
                        summary.pending || 0
                    }
                    icon={AlertCircle}
                    color="orange"
                />

                <MetricCard
                    title="In Progress"
                    value={
                        summary.inProgress ||
                        0
                    }
                    icon={Wrench}
                    color="purple"
                />

                <MetricCard
                    title="Completed"
                    value={
                        summary.completed ||
                        0
                    }
                    icon={Receipt}
                    color="green"
                />

                <MetricCard
                    title="Advance Collected"
                    value={`LKR ${Number(
                        summary.totalAdvance ||
                        0
                    ).toFixed(2)}`}
                    icon={Wallet}
                    color="red"
                />
            </div>

            {/* Charts */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-5">
                        Repair Status
                    </h3>

                    <div className="h-[320px] flex items-center justify-center">
                        <Doughnut
                            data={
                                doughnutData
                            }
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                            }}
                        />
                    </div>
                </div>

                {/* Repair Table */}

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b">
                        <h3 className="text-lg font-bold text-gray-800">
                            Recent Repairs
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                            <tr>
                                <TableHead>
                                    Customer
                                </TableHead>

                                <TableHead>
                                    Device
                                </TableHead>

                                <TableHead>
                                    Status
                                </TableHead>

                                <TableHead align="right">
                                    Advance
                                </TableHead>

                                <TableHead align="right">
                                    Cost
                                </TableHead>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                            {repairs.length ===
                            0 ? (
                                <EmptyRow
                                    colSpan={5}
                                    text="No repair data found."
                                />
                            ) : (
                                repairs.map(
                                    (
                                        repair: any
                                    ) => (
                                        <tr
                                            key={
                                                repair.id
                                            }
                                            className="hover:bg-gray-50"
                                        >
                                            <TableCell>
                                                {repair
                                                        .customer
                                                        ?.name ||
                                                    'N/A'}
                                            </TableCell>

                                            <TableCell>
                                                {repair.device ||
                                                    'N/A'}
                                            </TableCell>

                                            <TableCell>
                                                <StatusBadge
                                                    status={
                                                        repair.status
                                                    }
                                                />
                                            </TableCell>

                                            <TableCell align="right">
                                                LKR{' '}
                                                {Number(
                                                    repair.advancePayment ||
                                                    0
                                                ).toFixed(
                                                    2
                                                )}
                                            </TableCell>

                                            <TableCell align="right">
                                                LKR{' '}
                                                {Number(
                                                    repair.actualCost ??
                                                    repair.costEstimate ??
                                                    0
                                                ).toFixed(
                                                    2
                                                )}
                                            </TableCell>
                                        </tr>
                                    )
                                )
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// SUPPLIER REPORT
// ============================================================

function SupplierReport({
                            data,
                        }: {
    data: any;
}) {
    const summary =
        data?.summary || {
            totalSuppliers: 0,
            totalPurchases: 0,
            topSupplier: 'N/A',
        };

    const suppliers =
        data?.suppliers || [];

    return (
        <div className="space-y-6">
            {/* Summary */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    title="Total Suppliers"
                    value={
                        summary.totalSuppliers ||
                        0
                    }
                    icon={Truck}
                    color="blue"
                />

                <MetricCard
                    title="Total Purchases"
                    value={`LKR ${Number(
                        summary.totalPurchases ||
                        0
                    ).toFixed(2)}`}
                    icon={Wallet}
                    color="green"
                />

                <MetricCard
                    title="Top Supplier"
                    value={
                        summary.topSupplier ||
                        'N/A'
                    }
                    icon={TrendingUp}
                    color="purple"
                />
            </div>

            {/* Table */}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b">
                    <h3 className="text-lg font-bold text-gray-800">
                        Supplier List
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                        <tr>
                            <TableHead>
                                Name
                            </TableHead>

                            <TableHead>
                                Company
                            </TableHead>

                            <TableHead>
                                Phone
                            </TableHead>

                            <TableHead>
                                Email
                            </TableHead>

                            <TableHead align="right">
                                Total Purchases
                            </TableHead>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                        {suppliers.length ===
                        0 ? (
                            <EmptyRow
                                colSpan={5}
                                text="No supplier data found."
                            />
                        ) : (
                            suppliers.map(
                                (
                                    supplier: any
                                ) => (
                                    <tr
                                        key={
                                            supplier.id
                                        }
                                        className="hover:bg-gray-50"
                                    >
                                        <TableCell>
                                            {supplier.name ||
                                                'N/A'}
                                        </TableCell>

                                        <TableCell>
                                            {supplier.company ||
                                                '—'}
                                        </TableCell>

                                        <TableCell>
                                            {supplier.phone ||
                                                '—'}
                                        </TableCell>

                                        <TableCell>
                                            {supplier.email ||
                                                '—'}
                                        </TableCell>

                                        <TableCell align="right">
                                                <span className="font-semibold">
                                                    LKR{' '}
                                                    {Number(
                                                        supplier.totalPurchases ||
                                                        0
                                                    ).toFixed(
                                                        2
                                                    )}
                                                </span>
                                        </TableCell>
                                    </tr>
                                )
                            )
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Metric Card
// ============================================================

function MetricCard({
                        title,
                        value,
                        icon: Icon,
                        color,
                    }: {
    title: string;
    value: string | number;
    icon: any;
    color:
        | 'blue'
        | 'green'
        | 'purple'
        | 'orange'
        | 'red';
}) {
    const colorMap: Record<
        string,
        string
    > = {
        blue:
            'bg-blue-50 text-blue-700 border-blue-100',

        green:
            'bg-green-50 text-green-700 border-green-100',

        purple:
            'bg-purple-50 text-purple-700 border-purple-100',

        orange:
            'bg-orange-50 text-orange-700 border-orange-100',

        red:
            'bg-red-50 text-red-700 border-red-100',
    };

    const iconMap: Record<
        string,
        string
    > = {
        blue: 'bg-blue-100',
        green: 'bg-green-100',
        purple: 'bg-purple-100',
        orange: 'bg-orange-100',
        red: 'bg-red-100',
    };

    return (
        <div
            className={`rounded-xl border p-5 shadow-sm ${colorMap[color]}`}
        >
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-medium opacity-80">
                        {title}
                    </p>

                    <p className="text-xl font-bold mt-1 truncate">
                        {value}
                    </p>
                </div>

                <div
                    className={`p-3 rounded-xl shrink-0 ${iconMap[color]}`}
                >
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Table Components
// ============================================================

function TableHead({
                       children,
                       align = 'left',
                   }: {
    children: React.ReactNode;
    align?: 'left' | 'right' | 'center';
}) {
    return (
        <th
            className={`px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider ${
                align === 'right'
                    ? 'text-right'
                    : align === 'center'
                        ? 'text-center'
                        : 'text-left'
            }`}
        >
            {children}
        </th>
    );
}

function TableCell({
                       children,
                       align = 'left',
                   }: {
    children: React.ReactNode;
    align?: 'left' | 'right' | 'center';
}) {
    return (
        <td
            className={`px-5 py-4 text-sm text-gray-700 whitespace-nowrap ${
                align === 'right'
                    ? 'text-right'
                    : align === 'center'
                        ? 'text-center'
                        : 'text-left'
            }`}
        >
            {children}
        </td>
    );
}

// ============================================================
// Empty Row
// ============================================================

function EmptyRow({
                      colSpan,
                      text,
                  }: {
    colSpan: number;
    text: string;
}) {
    return (
        <tr>
            <td
                colSpan={colSpan}
                className="px-5 py-12 text-center text-gray-500"
            >
                <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />

                <p>{text}</p>
            </td>
        </tr>
    );
}

// ============================================================
// Status Badge
// ============================================================

function StatusBadge({
                         status,
                     }: {
    status: string;
}) {
    const normalized =
        String(status || '')
            .toUpperCase();

    let className =
        'bg-gray-100 text-gray-700';

    if (
        normalized === 'PENDING' ||
        normalized === 'ACTIVE'
    ) {
        className =
            'bg-yellow-100 text-yellow-800';
    } else if (
        normalized === 'IN_PROGRESS'
    ) {
        className =
            'bg-blue-100 text-blue-800';
    } else if (
        normalized === 'COMPLETED'
    ) {
        className =
            'bg-green-100 text-green-800';
    } else if (
        normalized === 'CANCELLED' ||
        normalized === 'DEFAULTED' ||
        normalized === 'OVERDUE'
    ) {
        className =
            'bg-red-100 text-red-800';
    }

    return (
        <span
            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${className}`}
        >
            {String(status || 'N/A').replace(
                /_/g,
                ' '
            )}
        </span>
    );
}