import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams

        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const filter = searchParams.get('filter')?.trim() || ''

        const customerWhere: any = {}

        if (filter) {
            customerWhere.OR = [
                {
                    name: {
                        contains: filter,
                    },
                },
                {
                    phone: {
                        contains: filter,
                    },
                },
            ]
        }

        const customers = await prisma.customer.findMany({
            where: customerWhere,
            include: {
                sales: {
                    where:
                        from || to
                            ? {
                                saleDate: {
                                    ...(from
                                        ? {
                                            gte: new Date(
                                                `${from}T00:00:00`
                                            ),
                                        }
                                        : {}),
                                    ...(to
                                        ? {
                                            lte: new Date(
                                                `${to}T23:59:59.999`
                                            ),
                                        }
                                        : {}),
                                },
                            }
                            : undefined,
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        const totalCustomers = customers.length

        const newCustomers = customers.filter((customer) => {
            const created = new Date(customer.createdAt)

            if (from) {
                const start = new Date(`${from}T00:00:00`)

                if (created < start) {
                    return false
                }
            }

            if (to) {
                const end = new Date(`${to}T23:59:59.999`)

                if (created > end) {
                    return false
                }
            }

            return true
        }).length

        const customerData = customers.map((customer) => {
            const totalSpent = customer.sales.reduce(
                (sum, sale) =>
                    sum + sale.grandTotal,
                0
            )

            return {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                address: customer.address,
                email: customer.email,
                orders: customer.sales.length,
                totalSpent,
                loyaltyPoints: customer.loyaltyPoints,
                createdAt: customer.createdAt,
            }
        })

        const sortedCustomers = [...customerData].sort(
            (a, b) =>
                b.totalSpent - a.totalSpent
        )

        const topCustomer =
            sortedCustomers.length > 0
                ? sortedCustomers[0].name
                : null

        return NextResponse.json({
            summary: {
                totalCustomers,
                newCustomers,
                topCustomer,
            },

            customers: customerData,
        })
    } catch (error) {
        console.error('Customer report error:', error)

        return NextResponse.json(
            {
                error: 'Failed to generate customer report',
            },
            {
                status: 500,
            }
        )
    }
}