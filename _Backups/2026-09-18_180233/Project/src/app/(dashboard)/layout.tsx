'use client'
import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/src/components/Sidebar'
import Header from '@/src/components/Header'
import { useAuth } from '@/src/hooks/useAuth'

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    if (loading || !user) return <div className="flex items-center justify-center h-screen">Loading...</div>

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header user={user} />
                <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
        </div>
    )
}