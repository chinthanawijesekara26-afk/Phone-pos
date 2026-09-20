import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams

        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const filter = searchParams.get('filter')?.trim() || ''

        const where: any = {}

        // Repair created date filter
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

        // Search
        if (filter) {
            where.OR = [
                {
                    device: {
                        contains: filter,
                    },
                },
                {
                    problem: {
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

        const repairs = await prisma.repair.findMany({
            where,

            include: {
                customer: true,
                technician: true,
            },

            orderBy: {
                createdAt: 'desc',
            },
        })

        const total = repairs.length

        const pending = repairs.filter(
            (repair) =>
                repair.status === 'PENDING'
        ).length

        const inProgress = repairs.filter(
            (repair) =>
                repair.status === 'IN_PROGRESS'
        ).length

        const completed = repairs.filter(
            (repair) =>
                repair.status === 'COMPLETED'
        ).length

        const cancelled = repairs.filter(
            (repair) =>
                repair.status === 'CANCELLED'
        ).length

        const totalAdvance = repairs.reduce(
            (sum, repair) =>
                sum + repair.advancePayment,
            0
        )

        const totalEstimated = repairs.reduce(
            (sum, repair) =>
                sum + (repair.costEstimate || 0),
            0
        )

        const totalActual = repairs.reduce(
            (sum, repair) =>
                sum + (repair.actualCost || 0),
            0
        )

        const statusDistribution = {
            PENDING: pending,
            IN_PROGRESS: inProgress,
            COMPLETED: completed,
            CANCELLED: cancelled,
        }

        return NextResponse.json({
            summary: {
                total,
                pending,
                inProgress,
                completed,
                cancelled,
                totalAdvance,
                totalEstimated,
                totalActual,
            },

            statusDistribution,

            repairs: repairs.map((repair) => ({
                id: repair.id,

                customer: {
                    id: repair.customer.id,
                    name: repair.customer.name,
                    phone: repair.customer.phone,
                    address:
                    repair.customer.address,
                },

                device: repair.device,

                condition:
                repair.condition,

                problem:
                repair.problem,

                technician:
                    repair.technician
                        ? {
                            id: repair.technician.id,
                            name:
                            repair.technician.name,
                        }
                        : null,

                technicianId:
                repair.technicianId,

                advancePayment:
                repair.advancePayment,

                costEstimate:
                repair.costEstimate,

                actualCost:
                repair.actualCost,

                expectedCompletionDate:
                repair.expectedCompletionDate,

                status:
                repair.status,

                createdAt:
                repair.createdAt,

                completedAt:
                repair.completedAt,
            })),
        })
    } catch (error) {
        console.error(
            'Repair report error:',
            error
        )

        return NextResponse.json(
            {
                error:
                    'Failed to generate repair report',
            },
            {
                status: 500,
            }
        )
    }
}