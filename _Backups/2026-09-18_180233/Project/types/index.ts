export interface User {
    id: number
    name: string
    email: string
    role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'TECHNICIAN'
}

export interface Product {
    id: number
    barcode?: string
    imei?: string
    serialNumber?: string
    name: string
    brandId?: number
    categoryId?: number
    storage?: string
    ram?: string
    color?: string
    purchasePrice: number
    sellingPrice: number
    discountPrice?: number
    tax: number
    stock: number
    reorderLevel: number
    warrantyMonths: number
    description?: string
    createdAt: string
    updatedAt: string
    brand?: { id: number; name: string }
    category?: { id: number; name: string }
}

export interface Customer {
    id: number
    name: string
    phone: string
    email?: string
    address?: string
    loyaltyPoints: number
    createdAt: string
    updatedAt: string
}

export interface Sale {
    id: number
    invoiceNo: string
    customerId?: number
    cashierId: number
    saleDate: string
    subtotal: number
    discount: number
    tax: number
    grandTotal: number
    paymentMethod: 'CASH' | 'CARD' | 'QR' | 'BANK' | 'INSTALLMENT'
    cashReceived?: number
    balance?: number
    status: 'PAID' | 'PENDING' | 'CANCELLED'
    customer?: Customer
    saleItems: SaleItem[]
}

export interface SaleItem {
    id: number
    saleId: number
    productId: number
    quantity: number
    price: number
    discount: number
    product?: Product
}

export interface InstallmentContract {
    id: number
    saleId: number
    customerId: number
    totalAmount: number
    downPayment: number
    interestRate: number
    loanAmount: number
    months: number
    monthlyInstallment: number
    remainingBalance: number
    status: 'ACTIVE' | 'COMPLETED' | 'DEFAULTED'
    createdAt: string
    nextDueDate?: string;
    customer?: Customer
    payments?: InstallmentPayment[];
}
export interface InstallmentPayment {
    id: number;
    contractId: number;
    amount: number;
    paidDate: string;
    paymentMethod: string;
    status: string;
}
export interface Repair {
    id: number
    customerId: number
    productId: number
    problem: string
    technicianId?: number
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    costEstimate?: number
    actualCost?: number
    createdAt: string
    completedAt?: string
    customer?: Customer
    product?: Product
    technician?: User

}
export interface Supplier {
    id: number;
    name: string;
    company?: string;
    phone?: string;
    email?: string;
    address?: string;
    createdAt: string;
}