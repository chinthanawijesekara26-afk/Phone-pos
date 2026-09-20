import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'

type RouteContext = {
    params: Promise<{
        id: string
    }>
}

export async function GET(
    request: Request,
    context: RouteContext
) {
    try {
        const { id } = await context.params

        const repairId = Number(id)

        if (Number.isNaN(repairId)) {
            return NextResponse.json(
                { error: 'Invalid repair ID' },
                { status: 400 }
            )
        }

        const repair = await prisma.repair.findUnique({
            where: {
                id: repairId,
            },
            include: {
                customer: true,
                technician: true,
            },
        })

        if (!repair) {
            return NextResponse.json(
                { error: 'Repair not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(repair)
    } catch (error) {
        console.error('GET repair error:', error)

        return NextResponse.json(
            { error: 'Failed to fetch repair' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: Request,
    context: RouteContext
) {
    try {
        const { id } = await context.params

        const repairId = Number(id)

        if (Number.isNaN(repairId)) {
            return NextResponse.json(
                { error: 'Invalid repair ID' },
                { status: 400 }
            )
        }

        const body = await request.json()

        const {
            status,
            actualCost,
            costEstimate,
            technicianId,
            expectedCompletionDate,
        } = body

        const validStatuses = [
            'PENDING',
            'IN_PROGRESS',
            'COMPLETED',
            'CANCELLED',
        ]

        if (status && !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: 'Invalid repair status' },
                { status: 400 }
            )
        }

        const existingRepair = await prisma.repair.findUnique({
            where: {
                id: repairId,
            },
        })

        if (!existingRepair) {
            return NextResponse.json(
                { error: 'Repair not found' },
                { status: 404 }
            )
        }

        const updateData: any = {}

        if (status) {
            updateData.status = status
        }

        if (actualCost !== undefined) {
            updateData.actualCost =
                actualCost === null || actualCost === ''
                    ? null
                    : Number(actualCost)
        }

        if (costEstimate !== undefined) {
            updateData.costEstimate =
                costEstimate === null || costEstimate === ''
                    ? null
                    : Number(costEstimate)
        }

        if (technicianId !== undefined) {
            updateData.technicianId =
                technicianId === null || technicianId === ''
                    ? null
                    : Number(technicianId)
        }

        if (expectedCompletionDate !== undefined) {
            updateData.expectedCompletionDate =
                expectedCompletionDate
                    ? new Date(expectedCompletionDate)
                    : null
        }

        // Automatically set completedAt
        if (status === 'COMPLETED') {
            updateData.completedAt = new Date()
        }

        if (
            status &&
            status !== 'COMPLETED' &&
            existingRepair.status === 'COMPLETED'
        ) {
            updateData.completedAt = null
        }

        const repair = await prisma.repair.update({
            where: {
                id: repairId,
            },
            data: updateData,
            include: {
                customer: true,
                technician: true,
            },
        })

        return NextResponse.json(repair)
    } catch (error) {
        console.error('PATCH repair error:', error)

        return NextResponse.json(
            { error: 'Failed to update repair' },
            { status: 500 }
        )
    }
}