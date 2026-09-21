import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

// =====================================================
// GET /api/brands
// =====================================================

export async function GET() {
    try {
        const brands = await prisma.brand.findMany({
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json(brands, {
            status: 200,
        });
    } catch (error) {
        console.error('GET /api/brands ERROR:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to load brands',
            },
            {
                status: 500,
            }
        );
    }
}

// =====================================================
// POST /api/brands
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

        const country =
            typeof body.country === 'string'
                ? body.country.trim()
                : null;

        const logoUrl =
            typeof body.logoUrl === 'string'
                ? body.logoUrl.trim()
                : null;

        if (!name) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Brand name is required',
                },
                {
                    status: 400,
                }
            );
        }

        const existingBrand =
            await prisma.brand.findUnique({
                where: {
                    name,
                },
            });

        if (existingBrand) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Brand already exists',
                    brand: existingBrand,
                },
                {
                    status: 409,
                }
            );
        }

        const brand =
            await prisma.brand.create({
                data: {
                    name,
                    country: country || null,
                    logoUrl: logoUrl || null,
                },
            });

        return NextResponse.json(
            {
                success: true,
                data: brand,
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error(
            'POST /api/brands ERROR:',
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to create brand',
            },
            {
                status: 500,
            }
        );
    }
}

// =====================================================
// PUT /api/brands
// =====================================================

export async function PUT(
    request: NextRequest
) {
    try {
        const body = await request.json();

        const id = Number(body.id);

        const name =
            typeof body.name === 'string'
                ? body.name.trim()
                : '';

        const country =
            typeof body.country === 'string'
                ? body.country.trim()
                : null;

        const logoUrl =
            typeof body.logoUrl === 'string'
                ? body.logoUrl.trim()
                : null;

        if (!id || id <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Valid brand ID is required',
                },
                {
                    status: 400,
                }
            );
        }

        if (!name) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Brand name is required',
                },
                {
                    status: 400,
                }
            );
        }

        const existing =
            await prisma.brand.findFirst({
                where: {
                    name,
                    NOT: {
                        id,
                    },
                },
            });

        if (existing) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Brand name already exists',
                },
                {
                    status: 409,
                }
            );
        }

        const brand =
            await prisma.brand.update({
                where: {
                    id,
                },
                data: {
                    name,
                    country: country || null,
                    logoUrl: logoUrl || null,
                },
            });

        return NextResponse.json({
            success: true,
            data: brand,
        });
    } catch (error) {
        console.error(
            'PUT /api/brands ERROR:',
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to update brand',
            },
            {
                status: 500,
            }
        );
    }
}

// =====================================================
// DELETE /api/brands?id=1
// =====================================================

export async function DELETE(
    request: NextRequest
) {
    try {
        const id = Number(
            request.nextUrl.searchParams.get('id')
        );

        if (!id || id <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Valid brand ID is required',
                },
                {
                    status: 400,
                }
            );
        }

        const brand =
            await prisma.brand.findUnique({
                where: {
                    id,
                },
                include: {
                    products: {
                        select: {
                            id: true,
                        },
                    },
                },
            });

        if (!brand) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Brand not found',
                },
                {
                    status: 404,
                }
            );
        }

        if (brand.products.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        'Cannot delete this brand because products are using it.',
                },
                {
                    status: 409,
                }
            );
        }

        await prisma.brand.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Brand deleted successfully',
        });
    } catch (error) {
        console.error(
            'DELETE /api/brands ERROR:',
            error
        );

        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to delete brand',
            },
            {
                status: 500,
            }
        );
    }
}