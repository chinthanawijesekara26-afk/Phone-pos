import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import bcrypt from 'bcryptjs'
import { signToken } from '@/src/lib/jwt'

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        const cleanEmail = email?.trim().toLowerCase()

        console.log('Login email:', cleanEmail)

        const user = await prisma.user.findUnique({
            where: {
                email: cleanEmail,
            },
        })

        if (!user) {
            console.log('User not found')
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            )
        }

        console.log('User found:', {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
        })

        if (!user.isActive) {
            return NextResponse.json(
                { message: 'Account is inactive' },
                { status: 403 }
            )
        }

        // Compare entered password with the bcrypt hash stored in DB
        const isValid = await bcrypt.compare(
            password,
            user.password
            
        )

        console.log('Password valid:', isValid)

        if (!isValid) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            )
        }

        const token = signToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        })

        const response = NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        })

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        })

        return response

    } catch (error) {
        console.error('Login error:', error)

        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}