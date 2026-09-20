// src/app/(dashboard)/dashboard/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Tooltip,
    Legend,
} from "chart.js";
import {
    AlertTriangle,
    Banknote,
    Boxes,
    CalendarClock,
    ClipboardList,
    CreditCard,
    DollarSign,
    RefreshCw,
    ShoppingCart,
    TrendingUp,
    Users,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachWeekOfInterval, eachMonthOfInterval, eachYearOfInterval, isWithinInterval } from "date-fns";
import { useAuth } from "@/src/hooks/useAuth";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Tooltip,
    Legend
);

type GroupType = "Weekly" | "Monthly" | "Yearly";

const money = (v: unknown) =>
    `Rs. ${Number(v ?? 0).toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

function ChartBox({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="bg-white rounded-xl shadow p-5">
            <h2 className="font-bold text-lg mb-4">{title}</h2>
            <div className="h-72">{children}</div>
        </div>
    );
}

function StatCard({
                      title,
                      value,
                      icon: Icon,
                      kind = "blue",
                      sub,
                  }: {
    title: string;
    value: string;
    icon: any;
    kind?: string;
    sub?: string;
}) {
    const colors: Record<string, string> = {
        blue: "bg-blue-100 text-blue-700",
        green: "bg-green-100 text-green-700",
        purple: "bg-purple-100 text-purple-700",
        orange: "bg-orange-100 text-orange-700",
        red: "bg-red-100 text-red-700",
        indigo: "bg-indigo-100 text-indigo-700",
    };

    return (
        <div className={`rounded-xl p-4 shadow ${colors[kind] || colors.blue}`}>
            <div className="flex justify-between gap-3">
                <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xl font-bold mt-1">{value}</p>
                    {sub && <p className="text-xs mt-1 opacity-75">{sub}</p>}
                </div>
                <Icon className="w-8 h-8 opacity-50" />
            </div>
        </div>
    );
}

function PaymentBox({
                        title,
                        value,
                        icon: Icon,
                    }: {
    title: string;
    value: number;
    icon: any;
}) {
    return (
        <div className="border rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Icon size={17} />
                <span>{title}</span>
            </div>
            <p className="font-bold mt-1">{money(value)}</p>
        </div>
    );
}

function groupSales(
    sales: any[],
    group: GroupType,
    from: Date,
    to: Date
) {
    const groups: Record<string, number> = {};

    let dates: Date[] = [];
    if (group === "Weekly") {
        dates = eachWeekOfInterval({ start: from, end: to });
    } else if (group === "Monthly") {
        dates = eachMonthOfInterval({ start: from, end: to });
    } else {
        dates = eachYearOfInterval({ start: from, end: to });
    }

    dates.forEach((date) => {
        const start =
            group === "Weekly"
                ? startOfWeek(date)
                : group === "Monthly"
                    ? startOfMonth(date)
                    : startOfYear(date);

        const end =
            group === "Weekly"
                ? endOfWeek(date)
                : group === "Monthly"
                    ? endOfMonth(date)
                    : endOfYear(date);

        const label =
            group === "Weekly"
                ? format(start, "MMM dd")
                : group === "Monthly"
                    ? format(start, "MMM yyyy")
                    : format(start, "yyyy");

        groups[label] = 0;

        for (const sale of sales) {
            const saleDate = new Date(sale.saleDate);
            if (isWithinInterval(saleDate, { start, end })) {
                groups[label] += Number(sale.grandTotal || 0);
            }
        }
    });

    return Object.entries(groups).map(([label, value]) => ({ label, value }));
}

export default function DashboardPage() {
    const { user, loading } = useAuth();

    const [stats, setStats] = useState<any>(null);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState("");

    const [from, setFrom] = useState(
        format(startOfMonth(new Date()), "yyyy-MM-dd")
    );
    const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
    const [salesGroup, setSalesGroup] = useState<GroupType>("Weekly");
    const [chartType, setChartType] = useState<"Bar" | "Line">("Bar");

    // IMPORTANT: this hook is always called, before any role-based return.
    const rawSales = stats?.rawSales ?? [];
    const fromDate = useMemo(() => new Date(`${from}T00:00:00`), [from]);
    const toDate = useMemo(() => new Date(`${to}T23:59:59.999`), [to]);

    const trend = useMemo(
        () => groupSales(rawSales, salesGroup, fromDate, toDate),
        [rawSales, salesGroup, fromDate, toDate]
    );

    const loadDashboard = useCallback(async () => {
        try {
            setFetching(true);
            setError("");

            const response = await fetch(
                `/api/dashboard/stats?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
                { cache: "no-store" }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Dashboard error");
            }

            setStats(result);
        } catch (err) {
            console.error("Dashboard error:", err);
            setStats(null);
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load dashboard data."
            );
        } finally {
            setFetching(false);
        }
    }, [from, to]);

    useEffect(() => {
        if (!loading) loadDashboard();
    }, [loading, loadDashboard]);

    if (loading || fetching) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="mx-auto mb-3 animate-spin" size={40} />
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-6">
                <div className="bg-white rounded-xl shadow p-8 text-center max-w-lg w-full">
                    <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
                    <h2 className="text-xl font-bold mb-2">Dashboard Error</h2>
                    <p className="text-gray-600 mb-5">
                        {error || "No dashboard data available."}
                    </p>
                    <button
                        onClick={loadDashboard}
                        className="bg-blue-600 text-white px-5 py-2 rounded-lg"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const top = stats.topSellingProducts ?? [];
    const slow = stats.slowSellingProducts ?? [];
    const low = stats.lowStockItems ?? [];

    const categories = stats.categorySales ?? {};
    const smartDevice = Number(categories.smartDevice ?? 0);
    const accessories = Number(categories.accessories ?? 0);

    // CASH / CARD / INSTALLMENT only.
    // The Prisma enum does NOT contain SPLIT, so SPLIT must not be sent by /sales.
    const cash = Number(stats.paymentMethods?.CASH ?? 0);
    const card = Number(stats.paymentMethods?.CARD ?? 0);
    const installment = Number(stats.paymentMethods?.INSTALLMENT ?? 0);

    // ------------------------------------------------------------
    // COLOURS
    // ------------------------------------------------------------
    const chartColors = [
        "#2563EB",
        "#16A34A",
        "#F59E0B",
        "#9333EA",
        "#EF4444",
        "#06B6D4",
        "#F97316",
        "#14B8A6",
        "#8B5CF6",
        "#EC4899",
    ];

    const topChart = {
        labels: top.slice(0, 10).map((p: any) => p.name),
        datasets: [
            {
                label: "Units Sold",
                data: top.slice(0, 10).map((p: any) => Number(p.totalSold ?? 0)),
                backgroundColor: chartColors,
                borderColor: chartColors,
                borderWidth: 1,
            },
        ],
    };

    const slowChart = {
        labels: slow.slice(0, 10).map((p: any) => p.name),
        datasets: [
            {
                label: "Units Sold",
                data: slow.slice(0, 10).map((p: any) => Number(p.totalSold ?? 0)),
                backgroundColor: chartColors,
                borderColor: chartColors,
                borderWidth: 1,
            },
        ],
    };

    // IMPORTANT: only two categories are displayed.
    // Smart Device contains Phone + Tablet.
    const categoryChart = {
        labels: ["Smart Device", "Accessories"],
        datasets: [
            {
                label: "Sales (LKR)",
                data: [smartDevice, accessories],
                backgroundColor: ["#2563EB", "#F59E0B"],
                borderColor: ["#1D4ED8", "#D97706"],
                borderWidth: 1,
            },
        ],
    };

    const commonBarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                ticks: { precision: 0 },
            },
            x: {
                ticks: {
                    autoSkip: false,
                    maxRotation: 35,
                    minRotation: 0,
                },
            },
        },
        plugins: {
            legend: { position: "top" as const },
            tooltip: { enabled: true },
        },
    };

    const salesTrendData = {
        labels: trend.map((x) => x.label),
        datasets: [
            {
                label: "Sales (LKR)",
                data: trend.map((x) => x.value),
                backgroundColor: "rgba(37, 99, 235, 0.65)",
                borderColor: "#2563EB",
                pointBackgroundColor: "#1D4ED8",
                pointBorderColor: "#1D4ED8",
                borderWidth: 2,
                tension: 0.3,
                fill: chartType === "Line",
            },
        ],
    };

    const paymentChart = {
        labels: ["Cash", "Card", "Installment"],
        datasets: [
            {
                data: [cash, card, installment],
                backgroundColor: ["#16A34A", "#2563EB", "#9333EA"],
                borderColor: ["#15803D", "#1D4ED8", "#7E22CE"],
                borderWidth: 2,
                hoverOffset: 8,
            },
        ],
    };

    const repairChart = {
        labels: ["Pending", "In Progress", "Completed"],
        datasets: [
            {
                data: [
                    Number(stats.repairs?.pending ?? 0),
                    Number(stats.repairs?.inProgress ?? 0),
                    Number(stats.repairs?.completed ?? 0),
                ],
                backgroundColor: ["#F59E0B", "#2563EB", "#16A34A"],
                borderColor: ["#D97706", "#1D4ED8", "#15803D"],
                borderWidth: 2,
                hoverOffset: 8,
            },
        ],
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "58%",
        plugins: {
            legend: { position: "bottom" as const },
            tooltip: { enabled: true },
        },
    };

    // =========================
    // CASHIER DASHBOARD
    // =========================
    if (user?.role === "CASHIER") {
        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-3">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">
                            Cashier Dashboard
                        </h1>
                        <p className="text-gray-500">Welcome to Phone Shop POS</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <input
                            type="date"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                            className="border rounded-lg px-3 py-2"
                        />
                        <input
                            type="date"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="border rounded-lg px-3 py-2"
                        />
                        <button
                            onClick={loadDashboard}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                            <RefreshCw size={17} />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        title="Today's Sales"
                        value={money(stats.todaySales)}
                        icon={TrendingUp}
                    />
                    <StatCard
                        title="Today's Orders"
                        value={String(stats.todayOrders ?? 0)}
                        icon={ShoppingCart}
                        kind="green"
                    />
                    <StatCard
                        title="Customers"
                        value={String(stats.totalCustomers ?? 0)}
                        icon={Users}
                        kind="purple"
                    />
                </div>

                {/* REQUIRED CASHIER GRAPHS */}
                <div className="grid lg:grid-cols-2 gap-6">
                    <ChartBox title="Top Selling Products">
                        {top.length ? (
                            <Bar data={topChart} options={commonBarOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                No top-selling data available.
                            </div>
                        )}
                    </ChartBox>

                    <ChartBox title="Slow Selling Products">
                        {slow.length ? (
                            <Bar data={slowChart} options={commonBarOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                No slow-selling data available.
                            </div>
                        )}
                    </ChartBox>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    <ChartBox title="Sales by Category">
                        <Bar data={categoryChart} options={commonBarOptions} />
                    </ChartBox>

                    <ChartBox title="Pending Repair Status">
                        <Doughnut
                            data={repairChart}
                            options={doughnutOptions}
                        />
                    </ChartBox>
                </div>

                {/* LOW STOCK TABLE */}
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="p-5 border-b flex justify-between items-center">
                        <h2 className="font-bold text-lg flex items-center gap-2">
                            <AlertTriangle className="text-red-500" size={20} />
                            Low Stock Items
                        </h2>
                        <span className="text-sm text-gray-500">
              {low.length} items
            </span>
                    </div>

                    {low.length === 0 ? (
                        <p className="p-8 text-center text-gray-500">
                            All products have sufficient stock.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50">
                                <tr>
                                    {["Product", "Category", "Stock", "Reorder", "Status"].map(
                                        (h) => (
                                            <th
                                                key={h}
                                                className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
                                            >
                                                {h}
                                            </th>
                                        )
                                    )}
                                </tr>
                                </thead>
                                <tbody className="divide-y">
                                {low.map((item: any) => (
                                    <tr key={item.id}>
                                        <td className="px-5 py-4 font-medium">
                                            {item.name}
                                            {item.brand && (
                                                <div className="text-xs text-gray-500">
                                                    {item.brand}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            {item.category || "-"}
                                        </td>
                                        <td className="px-5 py-4 font-bold">
                                            {Number(item.stock ?? 0)}
                                        </td>
                                        <td className="px-5 py-4">
                                            {Number(item.reorderLevel ?? 5)}
                                        </td>
                                        <td className="px-5 py-4">
                        <span
                            className={`px-2 py-1 rounded-full text-xs ${
                                Number(item.stock ?? 0) <= 0
                                    ? "bg-red-100 text-red-700"
                                    : "bg-orange-100 text-orange-700"
                            }`}
                        >
                          {item.status}
                        </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // =========================
    // ADMIN DASHBOARD
    // =========================
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-gray-500">Phone Shop POS Management</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="border rounded-lg px-3 py-2"
                    />
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="border rounded-lg px-3 py-2"
                    />
                    <button
                        onClick={loadDashboard}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <RefreshCw size={17} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard title="Today's Sales" value={money(stats.todaySales)} icon={DollarSign} />
                <StatCard title="Today's Profit" value={money(stats.todayProfit)} icon={TrendingUp} kind="green" />
                <StatCard title="Today's Orders" value={String(stats.todayOrders ?? 0)} icon={ClipboardList} kind="orange" />
                <StatCard
                    title="Monthly Sales"
                    value={money(stats.monthlySales)}
                    icon={ShoppingCart}
                    kind="purple"
                    sub={`${Number(stats.percentChange ?? 0).toFixed(2)}% from last month`}
                />
                <StatCard title="Total Products" value={String(stats.totalStockItems ?? 0)} icon={Boxes} kind="indigo" />
                <StatCard title="Low Stock" value={String(stats.lowStockCount ?? 0)} icon={AlertTriangle} kind="red" />
            </div>

            {/* SALES TREND + REPAIRS */}
            <div className="grid lg:grid-cols-2 gap-6">
                <ChartBox title="Sales Trend">
                    <div className="h-full">
                        <div className="flex gap-2 justify-end mb-2">
                            <select
                                value={salesGroup}
                                onChange={(e) => setSalesGroup(e.target.value as GroupType)}
                                className="border rounded px-2 py-1 text-sm"
                            >
                                <option>Weekly</option>
                                <option>Monthly</option>
                                <option>Yearly</option>
                            </select>

                            <select
                                value={chartType}
                                onChange={(e) =>
                                    setChartType(e.target.value as "Bar" | "Line")
                                }
                                className="border rounded px-2 py-1 text-sm"
                            >
                                <option>Bar</option>
                                <option>Line</option>
                            </select>
                        </div>

                        <div className="h-60">
                            {chartType === "Bar" ? (
                                <Bar
                                    data={salesTrendData}
                                    options={commonBarOptions}
                                />
                            ) : (
                                <Line
                                    data={salesTrendData}
                                    options={commonBarOptions}
                                />
                            )}
                        </div>
                    </div>
                </ChartBox>

                <ChartBox title="Pending Repair Status">
                    <Doughnut
                        data={repairChart}
                        options={doughnutOptions}
                    />
                </ChartBox>
            </div>

            {/* TOP + SLOW */}
            <div className="grid lg:grid-cols-2 gap-6">
                <ChartBox title="Top Selling Products">
                    <Bar data={topChart} options={commonBarOptions} />
                </ChartBox>

                <ChartBox title="Slow Selling Products">
                    <Bar data={slowChart} options={commonBarOptions} />
                </ChartBox>
            </div>

            {/* PAYMENT + CATEGORY */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow p-5">
                    <h2 className="font-bold text-lg">Payment Method Sales</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Cash, Card and Installment
                    </p>

                    <div className="h-72">
                        <Doughnut
                            data={paymentChart}
                            options={doughnutOptions}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-4">
                        <PaymentBox title="Cash" value={cash} icon={Banknote} />
                        <PaymentBox title="Card" value={card} icon={CreditCard} />
                        <PaymentBox
                            title="Installment"
                            value={installment}
                            icon={CalendarClock}
                        />
                    </div>
                </div>

                <ChartBox title="Sales by Category">
                    <Bar data={categoryChart} options={commonBarOptions} />
                </ChartBox>
            </div>

            {/* LOW STOCK */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="p-5 border-b flex justify-between items-center">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <AlertTriangle className="text-red-500" size={20} />
                        Low Stock Notification
                    </h2>
                    <span className="text-sm text-gray-500">{low.length} items</span>
                </div>

                {low.length === 0 ? (
                    <p className="p-8 text-center text-gray-500">
                        All products have sufficient stock.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                            <tr>
                                {["Product", "Category", "Stock", "Reorder", "Status"].map(
                                    (h) => (
                                        <th
                                            key={h}
                                            className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
                                        >
                                            {h}
                                        </th>
                                    )
                                )}
                            </tr>
                            </thead>
                            <tbody className="divide-y">
                            {low.map((item: any) => (
                                <tr key={item.id}>
                                    <td className="px-5 py-4 font-medium">
                                        {item.name}
                                        <div className="text-xs text-gray-500">
                                            {item.brand || "-"}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">{item.category || "-"}</td>
                                    <td className="px-5 py-4 font-bold">
                                        {Number(item.stock ?? 0)}
                                    </td>
                                    <td className="px-5 py-4">
                                        {Number(item.reorderLevel ?? 5)}
                                    </td>
                                    <td className="px-5 py-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                        {item.status}
                      </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}