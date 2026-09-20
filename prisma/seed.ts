import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // ============================
    // 1. ADMIN USER (if not exists)
    // ============================
    const adminPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { email: 'admin@pos.com' },
        update: {},
        create: {
            name: 'Admin',
            email: 'admin@pos.com',
            password: adminPassword,
            role: 'ADMIN',
        },
    });
    console.log('✅ Admin user ready');

    // ============================
    // 2. BRANDS & CATEGORIES
    // ============================
    const brands = [
        { name: 'Apple', country: 'USA' },
        { name: 'Samsung', country: 'South Korea' },
        { name: 'Google', country: 'USA' },
        { name: 'OnePlus', country: 'China' },
        { name: 'Xiaomi', country: 'China' },
    ];
    for (const b of brands) {
        await prisma.brand.upsert({
            where: { name: b.name },
            update: {},
            create: b,
        });
    }
    console.log('✅ Brands seeded');

    const categories = [
        { name: 'Smartphone' },
        { name: 'Accessory' },
        { name: 'Tablet' },
    ];
    for (const c of categories) {
        await prisma.category.upsert({
            where: { name: c.name },
            update: {},
            create: c,
        });
    }
    console.log('✅ Categories seeded');

    // ============================
    // 3. PRODUCTS
    // ============================
    const apple = await prisma.brand.findUnique({ where: { name: 'Apple' } });
    const samsung = await prisma.brand.findUnique({ where: { name: 'Samsung' } });
    const google = await prisma.brand.findUnique({ where: { name: 'Google' } });
    const oneplus = await prisma.brand.findUnique({ where: { name: 'OnePlus' } });
    const xiaomi = await prisma.brand.findUnique({ where: { name: 'Xiaomi' } });
    const smartphone = await prisma.category.findUnique({ where: { name: 'Smartphone' } });
    const accessory = await prisma.category.findUnique({ where: { name: 'Accessory' } });

    const productsData = [
        {
            name: 'iPhone 15 Pro',
            barcode: '1234567890',
            imei: '123456789012345',
            serialNumber: 'SN-IP15-001',
            brandId: apple?.id,
            categoryId: smartphone?.id,
            storage: '256GB',
            ram: '8GB',
            color: 'Titanium',
            purchasePrice: 1200,
            sellingPrice: 1500,
            discountPrice: 1400,
            tax: 0,
            stock: 10,
            reorderLevel: 3,
            warrantyMonths: 12,
            description: 'Latest Apple flagship with A17 Pro chip.',
        },
        {
            name: 'iPhone 15',
            barcode: '1234567891',
            imei: '123456789012346',
            serialNumber: 'SN-IP15-002',
            brandId: apple?.id,
            categoryId: smartphone?.id,
            storage: '128GB',
            ram: '6GB',
            color: 'Black',
            purchasePrice: 900,
            sellingPrice: 1100,
            discountPrice: 1050,
            tax: 0,
            stock: 15,
            reorderLevel: 5,
            warrantyMonths: 12,
            description: 'Standard iPhone 15 with USB-C.',
        },
        {
            name: 'Samsung Galaxy S24 Ultra',
            barcode: '9876543210',
            imei: '987654321012345',
            serialNumber: 'SN-S24-001',
            brandId: samsung?.id,
            categoryId: smartphone?.id,
            storage: '512GB',
            ram: '12GB',
            color: 'Phantom Black',
            purchasePrice: 1300,
            sellingPrice: 1600,
            discountPrice: 1500,
            tax: 0,
            stock: 8,
            reorderLevel: 2,
            warrantyMonths: 12,
            description: 'Samsung flagship with S Pen and AI features.',
        },
        {
            name: 'Samsung Galaxy A55',
            barcode: '9876543211',
            imei: '987654321012346',
            serialNumber: 'SN-A55-001',
            brandId: samsung?.id,
            categoryId: smartphone?.id,
            storage: '256GB',
            ram: '8GB',
            color: 'Awesome Blue',
            purchasePrice: 400,
            sellingPrice: 550,
            discountPrice: 520,
            tax: 0,
            stock: 20,
            reorderLevel: 5,
            warrantyMonths: 12,
            description: 'Mid-range Samsung with great camera.',
        },
        {
            name: 'Google Pixel 8 Pro',
            barcode: '5555555555',
            imei: '555555555555555',
            serialNumber: 'SN-P8P-001',
            brandId: google?.id,
            categoryId: smartphone?.id,
            storage: '256GB',
            ram: '12GB',
            color: 'Obsidian',
            purchasePrice: 900,
            sellingPrice: 1100,
            discountPrice: 1050,
            tax: 0,
            stock: 12,
            reorderLevel: 4,
            warrantyMonths: 12,
            description: 'Google flagship with pure Android and AI.',
        },
        {
            name: 'OnePlus 12',
            barcode: '4444444444',
            imei: '444444444444444',
            serialNumber: 'SN-OP12-001',
            brandId: oneplus?.id,
            categoryId: smartphone?.id,
            storage: '256GB',
            ram: '12GB',
            color: 'Green',
            purchasePrice: 700,
            sellingPrice: 900,
            discountPrice: 850,
            tax: 0,
            stock: 6,
            reorderLevel: 2,
            warrantyMonths: 12,
            description: 'OnePlus flagship with Snapdragon 8 Gen 3.',
        },
        {
            name: 'Xiaomi Redmi Note 13 Pro',
            barcode: '3333333333',
            imei: '333333333333333',
            serialNumber: 'SN-RN13-001',
            brandId: xiaomi?.id,
            categoryId: smartphone?.id,
            storage: '256GB',
            ram: '8GB',
            color: 'Blue',
            purchasePrice: 300,
            sellingPrice: 400,
            discountPrice: 380,
            tax: 0,
            stock: 25,
            reorderLevel: 8,
            warrantyMonths: 12,
            description: 'Popular mid-range Xiaomi with 200MP camera.',
        },
        {
            name: 'Samsung 45W Charger',
            barcode: '9999999999',
            imei: null,
            serialNumber: 'SN-CHG-001',
            brandId: samsung?.id,
            categoryId: accessory?.id,
            storage: null,
            ram: null,
            color: 'Black',
            purchasePrice: 20,
            sellingPrice: 30,
            discountPrice: 28,
            tax: 0,
            stock: 50,
            reorderLevel: 10,
            warrantyMonths: 6,
            description: 'Fast charging adapter for Samsung devices.',
        },
        {
            name: 'Apple USB-C Cable',
            barcode: '8888888888',
            imei: null,
            serialNumber: 'SN-CBL-001',
            brandId: apple?.id,
            categoryId: accessory?.id,
            storage: null,
            ram: null,
            color: 'White',
            purchasePrice: 15,
            sellingPrice: 25,
            discountPrice: 22,
            tax: 0,
            stock: 60,
            reorderLevel: 15,
            warrantyMonths: 6,
            description: 'Official Apple USB-C to Lightning cable.',
        },
    ];

    for (const p of productsData) {
        await prisma.product.upsert({
            where: { barcode: p.barcode || undefined },
            update: p,
            create: p,
        });
    }
    console.log('✅ Products seeded');

    // ============================
    // 4. CUSTOMERS
    // ============================
    const customersData = [
        { name: 'John Doe', phone: '0712345678', email: 'john@example.com', address: 'Colombo, Sri Lanka' },
        { name: 'Jane Smith', phone: '0723456789', email: 'jane@example.com', address: 'Kandy, Sri Lanka' },
        { name: 'David Wilson', phone: '0734567890', email: 'david@example.com', address: 'Galle, Sri Lanka' },
        { name: 'Sarah Johnson', phone: '0745678901', email: 'sarah@example.com', address: 'Negombo, Sri Lanka' },
        { name: 'Michael Brown', phone: '0756789012', email: 'michael@example.com', address: 'Jaffna, Sri Lanka' },
    ];
    for (const c of customersData) {
        await prisma.customer.upsert({
            where: { phone: c.phone },
            update: {},
            create: c,
        });
    }
    console.log('✅ Customers seeded');

    // ============================
    // 5. SUPPLIERS
    // ============================
    const suppliersData = [
        { name: 'Tech World Ltd', company: 'Tech World', phone: '0112345678', email: 'info@techworld.com', address: 'Colombo 01' },
        { name: 'Mobile Hub', company: 'Mobile Hub', phone: '0113456789', email: 'sales@mobilehub.lk', address: 'Colombo 03' },
        { name: 'Gadget Importers', company: 'Gadget Importers Inc.', phone: '0114567890', email: 'info@gadgetimporters.com', address: 'Kadawatha' },
    ];
    for (const s of suppliersData) {
        const existing = await prisma.supplier.findFirst({
            where: { phone: s.phone },
        });
        if (existing) {
            await prisma.supplier.update({
                where: { id: existing.id },
                data: s,
            });
        } else {
            await prisma.supplier.create({
                data: s,
            });
        }
    }
    console.log('✅ Suppliers seeded');

    // ============================
    // 6. SALES & SALE ITEMS
    // ============================
    const allCustomers = await prisma.customer.findMany();
    const allProducts = await prisma.product.findMany();
    const admin = await prisma.user.findUnique({ where: { email: 'admin@pos.com' } });

    // Helper to get random items
    const getRandomItems = (count = 2) => {
        const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count).map((p) => ({
            productId: p.id,
            quantity: Math.floor(Math.random() * 3) + 1,
            price: p.sellingPrice,
            discount: 0,
        }));
    };

    // Create 10 sales with different payment methods
    const paymentMethods = ['CASH', 'CARD', 'QR', 'INSTALLMENT'];
    for (let i = 0; i < 10; i++) {
        const customer = allCustomers[Math.floor(Math.random() * allCustomers.length)];
        const items = getRandomItems(2 + Math.floor(Math.random() * 3));
        const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
        const discount = Math.random() * 100;
        const tax = (subtotal - discount) * 0.05;
        const total = subtotal - discount + tax;
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

        const sale = await prisma.sale.create({
            data: {
                invoiceNo: `INV-${Date.now()}-${i}`,
                customerId: customer.id,
                cashierId: admin?.id || 1,
                saleDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // random past 30 days
                subtotal,
                discount,
                tax,
                grandTotal: total,
                paymentMethod: paymentMethod as any,
                cashReceived: paymentMethod === 'CASH' ? total + Math.random() * 10 : undefined,
                balance: paymentMethod === 'CASH' ? (total + Math.random() * 10) - total : undefined,
                status: 'PAID',
                saleItems: {
                    create: items,
                },
            },
        });

        // If installment, create contract
        if (paymentMethod === 'INSTALLMENT' && i % 2 === 0) {
            const downPayment = total * 0.3;
            const months = 12;
            const interestRate = 8;
            const loanAmount = total - downPayment;
            const monthlyInstallment = (loanAmount * (1 + interestRate / 100)) / months;
            await prisma.installment.create({
                data: {
                    saleId: sale.id,
                    customerId: customer.id,
                    totalAmount: total,
                    downPayment,
                    interestRate,
                    loanAmount,
                    months,
                    monthlyInstallment,
                    remainingBalance: loanAmount,
                    status: 'ACTIVE',
                },
            });
        }
    }
    console.log('✅ Sales and installments seeded');

    // ============================
    // 7. REPAIRS
    // ============================
    const repairStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    for (let i = 0; i < 8; i++) {
        const customer = allCustomers[Math.floor(Math.random() * allCustomers.length)];
        const product = allProducts[Math.floor(Math.random() * allProducts.length)];
        const status = repairStatuses[Math.floor(Math.random() * repairStatuses.length)];
        await prisma.repair.create({
            data: {
                customerId: customer.id,
                productId: product.id,
                problem: `Issue with ${product.name} - ${['Screen broken', 'Battery drain', 'Charging issue', 'Camera not working', 'Software crash'][Math.floor(Math.random() * 5)]}`,
                technicianId: admin?.id || 1,
                status: status as any,
                costEstimate: Math.random() * 200 + 50,
                actualCost: status === 'COMPLETED' ? Math.random() * 250 + 30 : undefined,
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                completedAt: status === 'COMPLETED' ? new Date() : undefined,
            },
        });
    }
    console.log('✅ Repairs seeded');

    console.log('🌱 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });