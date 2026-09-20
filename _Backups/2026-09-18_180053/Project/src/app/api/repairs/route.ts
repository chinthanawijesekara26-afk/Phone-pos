import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'

export async function GET() {
    try {
        const repairs = await prisma.repair.findMany({
            include: {
                customer: true,
                technician: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return NextResponse.json(repairs)
    } catch (error) {
        console.error('GET repairs error:', error)

        return NextResponse.json(
            { error: 'Failed to fetch repairs' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()

        const {
            customerName,
            phoneNumber,
            address,
            device,
            condition,
            problem,
            advancePayment,
            expectedCompletionDate,
            technicianId,
        } = body

        // Required fields
        if (!customerName?.trim()) {
            return NextResponse.json(
                { error: 'Customer name is required' },
                { status: 400 }
            )
        }

        if (!phoneNumber?.trim()) {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            )
        }

        if (!device?.trim()) {
            return NextResponse.json(
                { error: 'Device is required' },
                { status: 400 }
            )
        }

        // Find existing customer by phone
        let customer = await prisma.customer.findUnique({
            where: {
                phone: phoneNumber.trim(),
            },
        })

        // Create customer if not found
        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    name: customerName.trim(),
                    phone: phoneNumber.trim(),
                    address: address?.trim() || null,
                },
            })
        } else {
            // Update customer information
            customer = await prisma.customer.update({
                where: {
                    id: customer.id,
                },
                data: {
                    name: customerName.trim(),
                    address: address?.trim() || null,
                },
            })
        }

        const repair = await prisma.repair.create({
            data: {
                customerId: customer.id,

                device: device.trim(),

                condition: condition?.trim() || null,

                problem: problem?.trim() || null,

                advancePayment:
                    Number(advancePayment) >= 0
                        ? Number(advancePayment)
                        : 0,

                expectedCompletionDate:
                    expectedCompletionDate
                        ? new Date(expectedCompletionDate)
                        : null,

                technicianId:
                    technicianId
                        ? Number(technicianId)
                        : null,

                status: 'PENDING',
            },

            include: {
                customer: true,
                technician: true,
            },
        })

        return NextResponse.json(repair, { status: 201 })
    } catch (error) {
        console.error('POST repair error:', error)

        return NextResponse.json(
            { error: 'Failed to create repair' },
            { status: 500 }
        )
    }
}