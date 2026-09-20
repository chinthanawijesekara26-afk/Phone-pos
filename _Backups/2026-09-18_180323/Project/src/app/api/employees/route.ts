import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/src/lib/prisma';

const allowedRoles = ['ADMIN', 'CASHIER'];

// ============================================================
// Helper - Check ADMIN
// ============================================================

async function checkAdmin(request: NextRequest) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
        return null;
    }

    // If your authentication is already handled by middleware,
    // this endpoint can still be protected through your auth/me.
    const authResponse = await fetch(
        `${request.nextUrl.origin}/api/auth/me`,
        {
            headers: {
                Cookie: `token=${token}`,
            },
            cache: 'no-store',
        }
    );

    if (!authResponse.ok) {
        return null;
    }

    const user = await authResponse.json();

    if (user?.role !== 'ADMIN') {
        return null;
    }

    return user;
}

// ============================================================
// GET - Get employees
// ============================================================

export async function GET(request: NextRequest) {
    try {
        const admin = await checkAdmin(request);

        if (!admin) {
            return NextResponse.json(
                {
                    message:
                        'Unauthorized. Admin access required.',
                },
                { status: 403 }
            );
        }

        const employees = await prisma.user.findMany({
            where: {
                role: {
                    in: allowedRoles as any,
                },
            },

            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            },

            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(employees);
    } catch (error) {
        console.error(
            'GET employees error:',
            error
        );

        return NextResponse.json(
            {
                message:
                    'Failed to load employees',
            },
            { status: 500 }
        );
    }
}

// ============================================================
// POST - Add employee
// ============================================================

export async function POST(
    request: NextRequest
) {
    try {
        const admin = await checkAdmin(request);

        if (!admin) {
            return NextResponse.json(
                {
                    message:
                        'Unauthorized. Admin access required.',
                },
                { status: 403 }
            );
        }

        const body = await request.json();

        const {
            name,
            email,
            password,
            role,
        } = body;

        // ----------------------------------------------------
        // Validation
        // ----------------------------------------------------

        if (!name?.trim()) {
            return NextResponse.json(
                {
                    message:
                        'Employee name is required.',
                },
                { status: 400 }
            );
        }

        if (!email?.trim()) {
            return NextResponse.json(
                {
                    message:
                        'Email is required.',
                },
                { status: 400 }
            );
        }

        if (!password) {
            return NextResponse.json(
                {
                    message:
                        'Password is required.',
                },
                { status: 400 }
            );
        }

        if (!allowedRoles.includes(role)) {
            return NextResponse.json(
                {
                    message:
                        'Only ADMIN and CASHIER roles are allowed.',
                },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                {
                    message:
                        'Password must contain at least 6 characters.',
                },
                { status: 400 }
            );
        }

        // ----------------------------------------------------
        // Check existing email
        // ----------------------------------------------------

        const existingUser =
            await prisma.user.findUnique({
                where: {
                    email: email
                        .trim()
                        .toLowerCase(),
                },
            });

        if (existingUser) {
            return NextResponse.json(
                {
                    message:
                        'An employee with this email already exists.',
                },
                { status: 409 }
            );
        }

        // ----------------------------------------------------
        // Hash password
        // ----------------------------------------------------

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        // ----------------------------------------------------
        // Create
        // ----------------------------------------------------

        const employee =
            await prisma.user.create({
                data: {
                    name: name.trim(),

                    email: email
                        .trim()
                        .toLowerCase(),

                    password: hashedPassword,

                    role,

                    isActive: true,
                },

                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                },
            });

        return NextResponse.json(
            employee,
            { status: 201 }
        );
    } catch (error) {
        console.error(
            'POST employee error:',
            error
        );

        return NextResponse.json(
            {
                message:
                    'Failed to create employee.',
            },
            { status: 500 }
        );
    }
}