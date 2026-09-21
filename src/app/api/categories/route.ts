import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// =====================================================
// GET /api/categories
// =====================================================

export async function GET() {
    try {
        const categories =
            await prisma.category.findMany({
                orderBy: {
                    name: 'asc',
                },
            });

        return NextResponse.json(
            categories,
            {
                status: 200,
            }
        );
    } catch (error) {
        console.error(
            'GET /api/categories ERROR:',
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    'Failed to load categories',
            },
            {
                status: 500,
            }
        );
    }
}

// =====================================================
// POST /api/categories
// =====================================================

export async function POST(
    request: NextRequest
) {
    try {
        const body = await request.json();

        const name =
            typeof body.name === 'string'
                ? body.name.trim()
                : '';

        if (!name) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        'Category name is required',
                },
                {
                    status: 400,
                }
            );
        }

        const existing =
            await prisma.category.findUnique({
                where: {
                    name,
                },
            });

        if (existing) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        'Category already exists',
                    category: existing,
                },
                {
                    status: 409,
                }
            );
        }

        const category =
            await prisma.category.create({
                data: {
                    name,
                },
            });

        return NextResponse.json(
            {
                success: true,
                data: category,
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error(
            'POST /api/categories ERROR:',
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to create category',
            },
            {
                status: 500,
            }
        );
    }
}