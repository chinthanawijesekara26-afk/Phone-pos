import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/src/lib/prisma';
import jwt from 'jsonwebtoken';

const allowedRoles = ['ADMIN', 'CASHIER'];

// ============================================================
// Helper - Check ADMIN
// ============================================================

// ============================================================
// Helper - Check ADMIN
// ============================================================

async function checkAdmin(request: NextRequest) {
    try {
        const token = request.cookies.get('token')?.value;

        if (!token) {
            console.log('ADMIN CHECK: No token found');
            return null;
        }

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            console.error(
                'ADMIN CHECK ERROR: JWT_SECRET is missing'
            );
            return null;
        }

        // Verify JWT directly
        const decoded = jwt.verify(
            token,
            secret
        ) as {
            id?: number | string;
            userId?: number | string;
            email?: string;
            role?: string;
        };

        console.log(
            'ADMIN CHECK JWT:',
            {
                id: decoded.id,
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
            }
        );

        // Get user ID from token
        const rawUserId =
            decoded.id ??
            decoded.userId;

        if (!rawUserId) {
            console.error(
                'ADMIN CHECK: User ID missing from JWT'
            );
            return null;
        }

        const userId = Number(rawUserId);

        if (!Number.isInteger(userId)) {
            console.error(
                'ADMIN CHECK: Invalid user ID'
            );
            return null;
        }

        // Find user in MySQL
        const user =
            await prisma.user.findUnique({
                where: {
                    id: userId,
                },

                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isActive: true,
                },
            });

        if (!user) {
            console.error(
                'ADMIN CHECK: User not found'
            );
            return null;
        }

        if (!user.isActive) {
            console.error(
                'ADMIN CHECK: User is inactive'
            );
            return null;
        }

        if (user.role !== 'ADMIN') {
            console.error(
                'ADMIN CHECK: User is not ADMIN'
            );
            return null;
        }

        return user;

    } catch (error) {
        console.error(
            'ADMIN CHECK JWT ERROR:',
            error
        );

        return null;
    }
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