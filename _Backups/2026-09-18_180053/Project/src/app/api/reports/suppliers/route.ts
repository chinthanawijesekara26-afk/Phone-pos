import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams

        const filter =
            searchParams.get('filter')?.trim() || ''

        const where: any = {}

        if (filter) {
            where.OR = [
                {
                    name: {
                        contains: filter,
                    },
                },
                {
                    company: {
                        contains: filter,
                    },
                },
                {
                    phone: {
                        contains: filter,
                    },
                },
                {
                    email: {
                        contains: filter,
                    },
                },
            ]
        }

        const suppliers =
            await prisma.supplier.findMany({
                where,

                orderBy: {
                    createdAt: 'desc',
                },
            })

        const supplierData = suppliers.map(
            (supplier) => ({
                id: supplier.id,
                name: supplier.name,
                company: supplier.company,
                phone: supplier.phone,
                email: supplier.email,
                address: supplier.address,
                createdAt: supplier.createdAt,

                // No purchase/GRN relation currently
                totalPurchases: 0,
            })
        )

        return NextResponse.json({
            summary: {
                totalSuppliers:
                supplierData.length,

                totalPurchases: 0,

                topSupplier:
                    supplierData.length > 0
                        ? supplierData[0].name
                        : null,
            },

            suppliers: supplierData,
        })
    } catch (error) {
        console.error(
            'Supplier report error:',
            error
        )

        return NextResponse.json(
            {
                error:
                    'Failed to generate supplier report',
            },
            {
                status: 500,
            }
        )
    }
}