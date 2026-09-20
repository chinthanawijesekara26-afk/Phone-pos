import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams

        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const filter = searchParams.get('filter')?.trim() || ''

        const where: any = {}

        if (from || to) {
            where.createdAt = {}

            if (from) {
                where.createdAt.gte = new Date(
                    `${from}T00:00:00`
                )
            }

            if (to) {
                where.createdAt.lte = new Date(
                    `${to}T23:59:59.999`
                )
            }
        }

        if (filter) {
            where.customer = {
                OR: [
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
                ],
            }
        }

        const installments =
            await prisma.installment.findMany({
                where,

                include: {
                    customer: true,
                    sale: true,
                    payments: {
                        orderBy: {
                            installmentNo: 'asc',
                        },
                    },
                },

                orderBy: {
                    createdAt: 'desc',
                },
            })

        const active = installments.filter(
            (item) => item.status === 'ACTIVE'
        ).length

        const completed = installments.filter(
            (item) => item.status === 'COMPLETED'
        ).length

        const defaulted = installments.filter(
            (item) => item.status === 'DEFAULTED'
        ).length

        const pendingAmount =
            installments.reduce(
                (sum, item) =>
                    sum + item.remainingBalance,
                0
            )

        // Overdue payment count
        const today = new Date()

        const overdue = installments.reduce(
            (count, installment) => {
                const overduePayments =
                    installment.payments.filter(
                        (payment) =>
                            payment.status !== 'PAID' &&
                            new Date(payment.dueDate) <
                            today
                    )

                return count + overduePayments.length
            },
            0
        )

        const statusDistribution = {
            ACTIVE: active,
            COMPLETED: completed,
            DEFAULTED: defaulted,
        }

        return NextResponse.json({
            summary: {
                active,
                pendingAmount,
                overdue,
            },

            statusDistribution,

            installments: installments.map(
                (installment) => ({
                    id: installment.id,

                    customer: {
                        id: installment.customer.id,
                        name: installment.customer.name,
                        phone: installment.customer.phone,
                    },

                    sale: {
                        id: installment.sale.id,
                        invoiceNo:
                        installment.sale.invoiceNo,
                    },

                    totalAmount:
                    installment.totalAmount,

                    downPayment:
                    installment.downPayment,

                    loanAmount:
                    installment.loanAmount,

                    interestRate:
                    installment.interestRate,

                    months:
                    installment.months,

                    monthlyInstallment:
                    installment.monthlyInstallment,

                    remainingBalance:
                    installment.remainingBalance,

                    status:
                    installment.status,

                    createdAt:
                    installment.createdAt,

                    payments:
                    installment.payments,
                })
            ),
        })
    } catch (error) {
        console.error(
            'Installment report error:',
            error
        )

        return NextResponse.json(
            {
                error:
                    'Failed to generate installment report',
            },
            {
                status: 500,
            }
        )
    }
}