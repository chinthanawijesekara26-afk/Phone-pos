import { PrismaClient, RepairStatus } from '@prisma/client'

const prisma = new PrismaClient();

async function main() {
    // Get customers
    const customers = await prisma.customer.findMany({
        orderBy: {
            id: 'asc',
        },
        take: 5,
    })

    // Get technicians
    const technicians = await prisma.user.findMany({
        where: {
            role: 'TECHNICIAN',
        },
        orderBy: {
            id: 'asc',
        },
    })

    if (customers.length === 0) {
        throw new Error(
            'No customers found. Please create customers first.'
        )
    }

    console.log(`Found ${customers.length} customers`)
    console.log(`Found ${technicians.length} technicians`)

    const repairData = [
        {
            customerId: customers[0].id,
            device: 'iPhone 13',
            condition: 'Screen cracked, device working normally',
            problem: 'Broken display',
            advancePayment: 5000,
            costEstimate: 18000,
            actualCost: null,
            expectedCompletionDate: new Date('2026-09-06'),
            status: RepairStatus.PENDING,
            technicianId: technicians[0]?.id ?? null,
        },

        {
            customerId: customers[1 % customers.length].id,
            device: 'Samsung Galaxy A54',
            condition: 'Phone turns on but battery drains quickly',
            problem: 'Battery replacement',
            advancePayment: 3000,
            costEstimate: 9500,
            actualCost: null,
            expectedCompletionDate: new Date('2026-09-07'),
            status: RepairStatus.IN_PROGRESS,
            technicianId: technicians[0]?.id ?? null,
        },

        {
            customerId: customers[2 % customers.length].id,
            device: 'iPhone 11',
            condition: 'Camera glass damaged',
            problem: 'Rear camera issue',
            advancePayment: 2500,
            costEstimate: 12000,
            actualCost: null,
            expectedCompletionDate: new Date('2026-09-08'),
            status: RepairStatus.PENDING,
            technicianId: technicians[1]?.id ?? technicians[0]?.id ?? null,
        },

        {
            customerId: customers[3 % customers.length].id,
            device: 'Redmi Note 12',
            condition: 'Phone not charging',
            problem: 'Charging port damaged',
            advancePayment: 2000,
            costEstimate: 7500,
            actualCost: 7000,
            expectedCompletionDate: new Date('2026-09-03'),
            status: RepairStatus.COMPLETED,
            technicianId: technicians[0]?.id ?? null,
        },

        {
            customerId: customers[4 % customers.length].id,
            device: 'Samsung Galaxy S22',
            condition: 'Phone has water damage',
            problem: 'Water damage and motherboard inspection',
            advancePayment: 5000,
            costEstimate: 25000,
            actualCost: null,
            expectedCompletionDate: new Date('2026-09-10'),
            status: RepairStatus.IN_PROGRESS,
            technicianId: technicians[0]?.id ?? null,
        },

        {
            customerId: customers[0].id,
            device: 'iPhone 14 Pro',
            condition: 'Back glass broken',
            problem: 'Back glass replacement',
            advancePayment: 7000,
            costEstimate: 30000,
            actualCost: null,
            expectedCompletionDate: new Date('2026-09-12'),
            status: RepairStatus.PENDING,
            technicianId: technicians[1]?.id ?? technicians[0]?.id ?? null,
        },

        {
            customerId: customers[1 % customers.length].id,
            device: 'Google Pixel 7',
            condition: 'Display has lines and touch issue',
            problem: 'Display replacement',
            advancePayment: 6000,
            costEstimate: 28000,
            actualCost: 27500,
            expectedCompletionDate: new Date('2026-09-02'),
            status: RepairStatus.COMPLETED,
            technicianId: technicians[0]?.id ?? null,
        },

        {
            customerId: customers[2 % customers.length].id,
            device: 'Oppo Reno 8',
            condition: 'Phone restarts randomly',
            problem: 'Software and motherboard diagnosis',
            advancePayment: 1500,
            costEstimate: 10000,
            actualCost: null,
            expectedCompletionDate: new Date('2026-09-09'),
            status: RepairStatus.CANCELLED,
            technicianId: technicians[0]?.id ?? null,
        },
    ]

    for (const repair of repairData) {
        await prisma.repair.create({
            data: repair,
        })
    }

    console.log('✅ Repair dummy data inserted successfully!')
}

main()
    .catch((error) => {
        console.error('❌ Seed error:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })