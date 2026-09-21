import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/src/lib/jwt'
import { prisma } from '@/src/lib/prisma'

export async function GET(request: NextRequest) {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = verifyToken(token) as any
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, name: true, email: true, role: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json(user)
}