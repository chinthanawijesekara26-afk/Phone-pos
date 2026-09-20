// src/app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
    startOfDay,
    endOfDay,
    startOfMonth,
    endOfMonth,
    subMonths,
} from "date-fns";

const n = (value: unknown) => Number(value ?? 0);

function getCategoryType(name?: string | null) {
    const x = (name ?? "").trim().toLowerCase();

    // Accessories first so products such as "Phone Case" are not
    // incorrectly counted as Smart Devices.
    if (
        /accessor|charger|cable|cover|case|tempered|earphone|headphone|power bank|adapter|holder|airpods|screen protector/.test(
            x
        )
    ) {
        return "accessories" as const;
    }

    // Smart Device = Phone + Tablet.
    if (/tablet|ipad|tab\b/.test(x)) {
        return "smartDevice" as const;
    }

    if (
        /phone|mobile|iphone|samsung|xiaomi|oppo|vivo|realme|oneplus|pixel|nokia|huawei/.test(
            x
        )
    ) {
        return "smartDevice" as const;
    }

    // A category explicitly called Smart Device is also included.
    if (/smart[\s-]*device|smart[\s-]*watch|wearable|apple watch|galaxy watch|watch/.test(x)) {
        return "smartDevice" as const;
    }

    return "other" as const;
}

export async function GET(request: NextRequest) {
    try {
        const params = request.nextUrl.searchParams;
        const fromParam = params.get("from");
        const toParam = params.get("to");

        const now = new Date();

        const startDate = fromParam
            ? new Date(`${fromParam}T00:00:00`)
            : startOfMonth(now);

        const endDate = toParam
            ? new Date(`${toParam}T23:59:59.999`)
            : endOfMonth(now);

        if (
            Number.isNaN(startDate.getTime()) ||
            Number.isNaN(endDate.getTime()) ||
            startDate > endDate
        ) {
            return NextResponse.json(
                { success: false, message: "Invalid date range." },
                { status: 400 }
            );
        }

        // All chart sales use the selected date range.
        const sales = await prisma.sale.findMany({
            where: {
                saleDate: { gte: startDate, lte: endDate },
                status: "PAID",
            },
            include: {
                saleItems: {
                    include: {
                        product: {
                            include: {
                                category: true,
                                brand: true,
                            },
                        },
                    },
                },
            },
            orderBy: { saleDate: "desc" },
        });

        const totalSales = sales.reduce(
            (sum, sale) => sum + n(sale.grandTotal),
            0
        );

        const totalDiscount = sales.reduce(
            (sum, sale) => sum + n(sale.discount),
            0
        );

        const paymentMethods = {
            CASH: 0,
            CARD: 0,
            INSTALLMENT: 0,
        };

        // Only two dashboard categories are returned:
        // Smart Device = Phone + Tablet, and Accessories.
        const categorySales = {
            smartDevice: 0,
            accessories: 0,
        };

        const productMap = new Map<number, any>();

        for (const sale of sales) {
            // Your Prisma enum is CASH/CARD/QR/BANK/INSTALLMENT.
            // SPLIT is intentionally ignored here because it is not a valid enum value.
            const method = String(sale.paymentMethod);

            if (method === "CASH") {
                paymentMethods.CASH += n(sale.grandTotal);
            } else if (method === "CARD") {
                paymentMethods.CARD += n(sale.grandTotal);
            } else if (method === "INSTALLMENT") {
                paymentMethods.INSTALLMENT += n(sale.grandTotal);
            }

            for (const item of sale.saleItems) {
                const quantity = n(item.quantity);
                const amount = n(item.price) * quantity;
                const category = getCategoryType(item.product.category?.name);

                if (category === "smartDevice") {
                    categorySales.smartDevice += amount;
                } else if (category === "accessories") {
                    categorySales.accessories += amount;
                }

                const product = item.product;
                const existing = productMap.get(product.id);

                if (existing) {
                    existing.totalSold += quantity;
                    existing.totalRevenue += amount;
                    existing.numberOfSales += 1;
                } else {
                    productMap.set(product.id, {
                        id: product.id,
                        name: product.name,
                        category:
                            product.category?.name || "Uncategorized",
                        brand: product.brand?.name || "-",
                        totalSold: quantity,
                        totalRevenue: amount,
                        currentStock: product.stock,
                        reorderLevel: product.reorderLevel,
                        numberOfSales: 1,
                    });
                }
            }
        }

        const allProducts = [...productMap.values()];

        const topSellingProducts = [...allProducts]
            .filter((p) => p.totalSold >= 3)
            .sort((a, b) => b.totalSold - a.totalSold)
            .slice(0, 10);

        // Slow selling = products sold less than 3 units in selected date range.
        const slowSellingProducts = [...allProducts]
            .filter((p) => p.totalSold < 3)
            .sort((a, b) => a.totalSold - b.totalSold)
            .slice(0, 10);

        // Low-stock data is current inventory, not limited by sales date.
        const products = await prisma.product.findMany({
            select: {
                id: true,
                name: true,
                stock: true,
                reorderLevel: true,
                sellingPrice: true,
                purchasePrice: true,
                createdAt: true,
                category: { select: { name: true } },
                brand: { select: { name: true } },
            },
            orderBy: { stock: "asc" },
        });

        const lowStockItems = products
            .filter((p) => p.stock <= (p.reorderLevel ?? 5))
            .map((p) => ({
                id: p.id,
                name: p.name,
                brand: p.brand?.name || "-",
                category: p.category?.name || "Uncategorized",
                stock: p.stock,
                reorderLevel: p.reorderLevel ?? 5,
                sellingPrice: n(p.sellingPrice),
                purchasePrice: n(p.purchasePrice),
                status:
                    p.stock <= 0
                        ? "Out of Stock"
                        : p.stock <= 2
                            ? "Critical"
                            : "Low Stock",
            }));

        // Today's cards intentionally mean TODAY, independent of the selected chart filter.
        const today = new Date();

        const todayRows = await prisma.sale.findMany({
            where: {
                saleDate: {
                    gte: startOfDay(today),
                    lte: endOfDay(today),
                },
                status: "PAID",
            },
            include: {
                saleItems: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        const todaySales = todayRows.reduce(
            (sum, sale) => sum + n(sale.grandTotal),
            0
        );

        const todayOrders = todayRows.length;

        let todayProfit = 0;
        for (const sale of todayRows) {
            for (const item of sale.saleItems) {
                todayProfit +=
                    (n(item.price) - n(item.product.purchasePrice)) *
                    n(item.quantity);
            }
        }

        const monthRows = await prisma.sale.findMany({
            where: {
                saleDate: {
                    gte: startOfMonth(today),
                    lte: endOfMonth(today),
                },
                status: "PAID",
            },
            select: { grandTotal: true },
        });

        const monthlySales = monthRows.reduce(
            (sum, sale) => sum + n(sale.grandTotal),
            0
        );

        const previousMonth = subMonths(today, 1);

        const previousMonthRows = await prisma.sale.findMany({
            where: {
                saleDate: {
                    gte: startOfMonth(previousMonth),
                    lte: endOfMonth(previousMonth),
                },
                status: "PAID",
            },
            select: { grandTotal: true },
        });

        const previousMonthlySales = previousMonthRows.reduce(
            (sum, sale) => sum + n(sale.grandTotal),
            0
        );

        const percentChange =
            previousMonthlySales > 0
                ? ((monthlySales - previousMonthlySales) /
                    previousMonthlySales) *
                100
                : 0;

        const repairGroups = await prisma.repair.groupBy({
            by: ["status"],
            _count: { _all: true },
        });

        const repairs = {
            pending: 0,
            inProgress: 0,
            completed: 0,
        };

        for (const row of repairGroups) {
            if (row.status === "PENDING") repairs.pending = row._count._all;
            if (row.status === "IN_PROGRESS")
                repairs.inProgress = row._count._all;
            if (row.status === "COMPLETED")
                repairs.completed = row._count._all;
        }

        const totalCustomers = await prisma.customer.count();

        const totalOrders = await prisma.sale.count({
            where: { status: "PAID" },
        });

        const pendingInstallments = await prisma.installment.count({
            where: { status: "ACTIVE" },
        });

        // Used by the frontend for the selected date-range sales trend.
        const rawSales = sales.map((sale) => ({
            id: sale.id,
            saleDate: sale.saleDate.toISOString(),
            grandTotal: n(sale.grandTotal),
            paymentMethod: String(sale.paymentMethod),
            category:
                sale.saleItems[0]?.product.category?.name ||
                "Uncategorized",
        }));

        return NextResponse.json({
            success: true,

            summary: {
                totalSales,
                totalDiscount,
                totalTransactions: sales.length,
                averageSale:
                    sales.length > 0 ? totalSales / sales.length : 0,
            },

            paymentMethods,
            categorySales,
            repairs,
            lowStockItems,
            topSellingProducts,
            slowSellingProducts,
            rawSales,

            todaySales,
            todayProfit,
            todayOrders,
            monthlySales,
            totalStockItems: products.length,
            lowStockCount: lowStockItems.length,
            percentChange,

            totalCustomers,
            totalOrders,
            pendingInstallments,
        });
    } catch (error) {
        console.error("Dashboard API Error:", error);

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to fetch dashboard data.",
            },
            { status: 500 }
        );
    }
}
