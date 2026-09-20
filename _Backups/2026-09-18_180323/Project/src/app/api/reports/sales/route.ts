import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams

        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const filter = searchParams.get('filter')?.trim() || ''

        const saleWhere: any = {}

        // Date filter
        if (from || to) {
            saleWhere.saleDate = {}

            if (from) {
                const start = new Date(`${from}T00:00:00`)
                saleWhere.saleDate.gte = start
            }

            if (to) {
                const end = new Date(`${to}T23:59:59.999`)
                saleWhere.saleDate.lte = end
            }
        }

        // Customer / invoice filter
        if (filter) {
            saleWhere.OR = [
                {
                    invoiceNo: {
                        contains: filter,
                    },
                },
                {
                    customer: {
                        name: {
                            contains: filter,
                        },
                    },
                },
                {
                    customer: {
                        phone: {
                            contains: filter,
                        },
                    },
                },
            ]
        }

        const sales = await prisma.sale.findMany({
            where: saleWhere,
            include: {
                customer: true,
                cashier: true,
                saleItems: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: {
                saleDate: 'desc',
            },
        })

        const totalSales = sales.reduce(
            (sum, sale) => sum + sale.grandTotal,
            0
        )

        const totalOrders = sales.length

        const totalItems = sales.reduce(
            (sum, sale) =>
                sum +
                sale.saleItems.reduce(
                    (itemSum, item) => itemSum + item.quantity,
                    0
                ),
            0
        )

        const avgOrderValue =
            totalOrders > 0
                ? totalSales / totalOrders
                : 0

        // Payment method summary
        const paymentMethods: Record<string, number> = {}

        sales.forEach((sale) => {
            const method = sale.paymentMethod

            paymentMethods[method] =
                (paymentMethods[method] || 0) +
                sale.grandTotal
        })

        // Daily sales
        const dailyMap: Record<
            string,
            {
                date: string
                total: number
                orders: number
            }
        > = {}

        sales.forEach((sale) => {
            const date = new Date(sale.saleDate)
                .toISOString()
                .split('T')[0]

            if (!dailyMap[date]) {
                dailyMap[date] = {
                    date,
                    total: 0,
                    orders: 0,
                }
            }

            dailyMap[date].total += sale.grandTotal
            dailyMap[date].orders += 1
        })

        const dailySales = Object.values(dailyMap).sort(
            (a, b) =>
                new Date(a.date).getTime() -
                new Date(b.date).getTime()
        )

        return NextResponse.json({
            summary: {
                totalSales,
                totalOrders,
                totalItems,
                avgOrderValue,
            },

            paymentMethods,

            dailySales,

            sales: sales.map((sale) => ({
                id: sale.id,
                invoiceNo: sale.invoiceNo,
                saleDate: sale.saleDate,
                customer: sale.customer
                    ? {
                        id: sale.customer.id,
                        name: sale.customer.name,
                        phone: sale.customer.phone,
                    }
                    : null,
                cashier: {
                    id: sale.cashier.id,
                    name: sale.cashier.name,
                },
                paymentMethod: sale.paymentMethod,
                subtotal: sale.subtotal,
                discount: sale.discount,
                tax: sale.tax,
                grandTotal: sale.grandTotal,
                status: sale.status,
                items: sale.saleItems.map((item) => ({
                    productId: item.productId,
                    productName: item.product.name,
                    quantity: item.quantity,
                    price: item.price,
                    discount: item.discount,
                    total:
                        item.price * item.quantity -
                        item.discount,
                })),
            })),
        })
    } catch (error) {
        console.error('Sales report error:', error)

        return NextResponse.json(
            {
                error: 'Failed to generate sales report',
            },
            {
                status: 500,
            }
        )
    }
}