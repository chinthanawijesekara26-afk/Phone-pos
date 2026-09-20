'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Product, Customer } from '@/types';
import {
    Trash2,
    Search,
    X,
    AlertCircle,
    UserPlus,
    Archive,
    Wrench,
    Shield,
    Lock,
    Edit2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

type DiscountType = 'percentage' | 'amount';

interface CartItem {
    product: Product;
    quantity: number;

    discountType: DiscountType;
    discountValue: number;

    manualPrice?: number;

    requiresApproval: boolean;
    discountReason?: string;

    isPriceEdited: boolean;

    originalPrice: number;

    finalUnitPrice?: number;
}

export default function SalesPage() {
    const router = useRouter();

    // ============================================================
    // STATE
    // ============================================================

    const [cart, setCart] = useState<CartItem[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>(
        []
    );

    const [searchQuery, setSearchQuery] = useState('');

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);

    const [showCustomerModal, setShowCustomerModal] =
        useState(false);

    const [showAddCustomerModal, setShowAddCustomerModal] =
        useState(false);

    const [customerSearch, setCustomerSearch] = useState('');

    const [paymentMethod, setPaymentMethod] = useState<
        'CASH' | 'CARD' | 'QR' | 'SPLIT' | 'INSTALLMENT'
    >('CASH');

    const [cashReceived, setCashReceived] = useState('');

    // Split payment: Cash + Card
    const [cardReceived, setCardReceived] = useState('');

    const [loading, setLoading] = useState(false);

    const [userRole, setUserRole] = useState<string>('CASHIER');
    const [userName, setUserName] = useState<string>('');

    const [globalDiscountType, setGlobalDiscountType] =
        useState<DiscountType>('percentage');

    const [globalDiscountValue, setGlobalDiscountValue] =
        useState(0);

    const inputRef = useRef<HTMLInputElement>(null);

    const [showApprovalModal, setShowApprovalModal] =
        useState(false);

    const [approvalItems, setApprovalItems] = useState<CartItem[]>(
        []
    );

    // ============================================================
    // IMPORTANT
    // Temporary string state for price input.
    //
    // This allows cashier/admin to type normally.
    // Example:
    // 900 -> select all -> 800
    //
    // We DON'T update the cart while typing.
    // Cart is updated only on blur / Enter.
    // ============================================================

    const [priceInputs, setPriceInputs] = useState<
        Record<number, string>
    >({});

    // ============================================================
    // INSTALLMENT
    // ============================================================

    const [installmentDownPayment, setInstallmentDownPayment] =
        useState(0);

    const [installmentMonths, setInstallmentMonths] =
        useState(12);

    const [installmentMonthlyAmount, setInstallmentMonthlyAmount] =
        useState(0);

    const [installmentFirstDueDate, setInstallmentFirstDueDate] =
        useState(format(new Date(), 'yyyy-MM-dd'));

    const [installmentInterest, setInstallmentInterest] =
        useState(0);

    // ============================================================
    // REPAIR
    // ============================================================

    const [repairCharges, setRepairCharges] = useState(0);

    const [showRepairModal, setShowRepairModal] =
        useState(false);

    const [repairDescription, setRepairDescription] =
        useState('');

    // ============================================================
    // NEW CUSTOMER
    // ============================================================

    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
    });

    // ============================================================
    // LOAD DATA
    // ============================================================

    useEffect(() => {
        const loadData = async () => {
            try {
                const [
                    productsRes,
                    customersRes,
                    authRes,
                ] = await Promise.all([
                    fetch('/api/products'),
                    fetch('/api/customers'),
                    fetch('/api/auth/me'),
                ]);

                const productsData =
                    await productsRes.json();

                const customersData =
                    await customersRes.json();

                if (authRes.ok) {
                    const userData =
                        await authRes.json();

                    setUserRole(
                        String(
                            userData?.role ||
                            'CASHIER'
                        ).toUpperCase()
                    );

                    setUserName(
                        userData?.name ||
                        'User'
                    );
                }

                setProducts(
                    Array.isArray(productsData)
                        ? productsData
                        : []
                );

                setCustomers(
                    Array.isArray(customersData)
                        ? customersData
                        : []
                );
            } catch (error) {
                console.error(
                    'Error loading data:',
                    error
                );

                toast.error(
                    'Failed to load data'
                );
            }
        };

        loadData();
    }, []);

    // ============================================================
    // ROLE
    // ============================================================

    const isAdmin =
        userRole === 'ADMIN';

    // ============================================================
    // SEARCH
    // ============================================================

    useEffect(() => {
        if (searchQuery.trim()) {
            const query =
                searchQuery
                    .trim()
                    .toLowerCase();

            setFilteredProducts(
                products.filter(
                    (p) =>
                        p.name
                            .toLowerCase()
                            .includes(query) ||
                        p.barcode
                            ?.toLowerCase()
                            .includes(query) ||
                        p.imei
                            ?.toLowerCase()
                            .includes(query) ||
                        p.serialNumber
                            ?.toLowerCase()
                            .includes(query)
                )
            );
        } else {
            setFilteredProducts([]);
        }
    }, [searchQuery, products]);

    // ============================================================
    // ADD PRODUCT
    // ============================================================

    const addToCart = (product: Product) => {
        if (product.stock <= 0) {
            toast.error(
                'Product is out of stock'
            );
            return;
        }

        setCart((prev) => {
            const existing =
                prev.find(
                    (item) =>
                        item.product.id ===
                        product.id
                );

            if (existing) {
                if (
                    existing.quantity >=
                    product.stock
                ) {
                    toast.error(
                        'Not enough stock available'
                    );

                    return prev;
                }

                return prev.map((item) =>
                    item.product.id ===
                    product.id
                        ? {
                            ...item,
                            quantity:
                                item.quantity + 1,
                        }
                        : item
                );
            }

            const sellingPrice =
                Number(
                    product.sellingPrice
                );

            return [
                ...prev,
                {
                    product,
                    quantity: 1,

                    discountType:
                        'amount',

                    discountValue: 0,

                    manualPrice:
                    sellingPrice,

                    requiresApproval:
                        false,

                    discountReason: '',

                    isPriceEdited:
                        false,

                    originalPrice:
                    sellingPrice,

                    finalUnitPrice:
                    sellingPrice,
                },
            ];
        });

        // Initial price input
        setPriceInputs((prev) => ({
            ...prev,
            [product.id]:
                Number(
                    product.sellingPrice
                ).toFixed(2),
        }));

        setSearchQuery('');
        setFilteredProducts([]);

        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    // ============================================================
    // REMOVE PRODUCT
    // ============================================================

    const removeFromCart = (
        productId: number
    ) => {
        setCart((prev) =>
            prev.filter(
                (item) =>
                    item.product.id !==
                    productId
            )
        );

        setPriceInputs((prev) => {
            const next = {
                ...prev,
            };

            delete next[productId];

            return next;
        });
    };

    // ============================================================
    // UPDATE QUANTITY
    // ============================================================

    const updateQuantity = (
        productId: number,
        quantity: number
    ) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        const product =
            products.find(
                (p) =>
                    p.id === productId
            );

        if (
            product &&
            quantity > product.stock
        ) {
            toast.error(
                `Only ${product.stock} items available`
            );

            return;
        }

        setCart((prev) =>
            prev.map((item) =>
                item.product.id ===
                productId
                    ? {
                        ...item,
                        quantity,
                    }
                    : item
            )
        );
    };

    // ============================================================
    // UPDATE DISCOUNT
    //
    // CASHIER:
    // Discount is automatic.
    //
    // ADMIN:
    // Discount can be manually edited.
    // ============================================================

    const updateDiscount = (
        productId: number,
        type: DiscountType,
        value: number
    ) => {
        const cartItem =
            cart.find(
                (item) =>
                    item.product.id ===
                    productId
            );

        if (!cartItem) return;

        const product =
            cartItem.product;

        // ========================================================
        // CASHIER
        // ========================================================

        if (!isAdmin) {
            const currentPrice =
                cartItem.finalUnitPrice ??
                cartItem.manualPrice ??
                Number(
                    product.sellingPrice
                );

            const automaticDiscount =
                Math.max(
                    0,
                    Number(
                        product.sellingPrice
                    ) - currentPrice
                );

            setCart((prev) =>
                prev.map((item) =>
                    item.product.id ===
                    productId
                        ? {
                            ...item,
                            discountType:
                                'amount',
                            discountValue:
                            automaticDiscount,
                            finalUnitPrice:
                            currentPrice,
                            manualPrice:
                            currentPrice,
                            requiresApproval:
                                false,
                            discountReason:
                                '',
                        }
                        : item
                )
            );

            return;
        }

        // ========================================================
        // ADMIN
        // ========================================================

        const price =
            cartItem.finalUnitPrice ??
            cartItem.manualPrice ??
            Number(
                product.sellingPrice
            );

        const safeValue =
            Math.max(
                0,
                Number(value) || 0
            );

        let discountAmount = 0;

        if (
            type === 'percentage'
        ) {
            discountAmount =
                price *
                (safeValue / 100);
        } else {
            discountAmount =
                safeValue;
        }

        const finalUnitPrice =
            Math.max(
                0,
                price -
                discountAmount
            );

        setCart((prev) =>
            prev.map((item) =>
                item.product.id ===
                productId
                    ? {
                        ...item,

                        discountType:
                        type,

                        discountValue:
                        safeValue,

                        finalUnitPrice,

                        manualPrice:
                        finalUnitPrice,

                        isPriceEdited:
                            true,

                        requiresApproval:
                            false,

                        discountReason:
                            '',
                    }
                    : item
            )
        );

        setPriceInputs((prev) => ({
            ...prev,
            [productId]:
                finalUnitPrice.toFixed(2),
        }));
    };

    // ============================================================
    // UPDATE FINAL PRICE
    //
    // ADMIN:
    // Any price >= 0
    //
    // CASHIER:
    // Purchase Price <= Price <= Selling Price
    // ============================================================

    const updateManualPrice = (
        productId: number,
        inputPrice: number
    ) => {
        const cartItem =
            cart.find(
                (item) =>
                    item.product.id ===
                    productId
            );

        if (!cartItem) return;

        const product =
            cartItem.product;

        const purchasePrice =
            Number(
                product.purchasePrice
            );

        const sellingPrice =
            Number(
                product.sellingPrice
            );

        if (
            !Number.isFinite(
                inputPrice
            )
        ) {
            return;
        }

        // ========================================================
        // ADMIN
        // ========================================================

        if (isAdmin) {
            const finalPrice =
                Math.max(
                    0,
                    inputPrice
                );

            const discount =
                Math.max(
                    0,
                    sellingPrice -
                    finalPrice
                );

            setCart((prev) =>
                prev.map((item) =>
                    item.product.id ===
                    productId
                        ? {
                            ...item,

                            manualPrice:
                            finalPrice,

                            finalUnitPrice:
                            finalPrice,

                            discountType:
                                'amount',

                            discountValue:
                            discount,

                            isPriceEdited:
                                finalPrice !==
                                sellingPrice,

                            requiresApproval:
                                false,

                            discountReason:
                                '',
                        }
                        : item
                )
            );

            setPriceInputs((prev) => ({
                ...prev,
                [productId]:
                    finalPrice.toFixed(2),
            }));

            return;
        }

        // ========================================================
        // CASHIER
        //
        // purchasePrice <= finalPrice <= sellingPrice
        // ========================================================

        let finalPrice =
            inputPrice;

        if (
            inputPrice <
            purchasePrice
        ) {
            finalPrice =
                purchasePrice;

            toast.error(
                `Minimum cashier price is LKR ${purchasePrice.toFixed(
                    2
                )}`
            );
        }

        if (
            inputPrice >
            sellingPrice
        ) {
            finalPrice =
                sellingPrice;

            toast.error(
                `Maximum cashier price is LKR ${sellingPrice.toFixed(
                    2
                )}`
            );
        }

        // ========================================================
        // AUTOMATIC DISCOUNT
        //
        // Selling Price - Final Price
        //
        // Example:
        // Selling = 900
        // Price   = 800
        // Discount = 100
        // ========================================================

        const automaticDiscount =
            Math.max(
                0,
                sellingPrice -
                finalPrice
            );

        setCart((prev) =>
            prev.map((item) =>
                item.product.id ===
                productId
                    ? {
                        ...item,

                        manualPrice:
                        finalPrice,

                        finalUnitPrice:
                        finalPrice,

                        discountType:
                            'amount',

                        discountValue:
                        automaticDiscount,

                        isPriceEdited:
                            finalPrice !==
                            sellingPrice,

                        requiresApproval:
                            false,

                        discountReason:
                            '',
                    }
                    : item
            )
        );

        setPriceInputs((prev) => ({
            ...prev,
            [productId]:
                finalPrice.toFixed(2),
        }));
    };

    // ============================================================
    // HANDLE PRICE TYPING
    //
    // VERY IMPORTANT:
    // Do NOT calculate anything here.
    //
    // Only store the string the user is typing.
    // ============================================================

    const handlePriceChange = (
        productId: number,
        value: string
    ) => {
        setPriceInputs((prev) => ({
            ...prev,
            [productId]:
            value,
        }));
    };

    // ============================================================
    // HANDLE PRICE BLUR
    // ============================================================

    const handlePriceBlur = (
        productId: number
    ) => {
        const cartItem =
            cart.find(
                (item) =>
                    item.product.id ===
                    productId
            );

        if (!cartItem) return;

        const product =
            cartItem.product;

        const purchasePrice =
            Number(
                product.purchasePrice
            );

        const sellingPrice =
            Number(
                product.sellingPrice
            );

        const inputValue =
            priceInputs[productId];

        // ========================================================
        // EMPTY INPUT
        // ========================================================

        if (
            inputValue === undefined ||
            inputValue.trim() === ''
        ) {
            updateManualPrice(
                productId,
                sellingPrice
            );

            return;
        }

        const enteredPrice =
            Number(inputValue);

        // ========================================================
        // INVALID INPUT
        // ========================================================

        if (
            !Number.isFinite(
                enteredPrice
            )
        ) {
            toast.error(
                'Please enter a valid price'
            );

            updateManualPrice(
                productId,
                sellingPrice
            );

            return;
        }

        // ========================================================
        // ADMIN
        // ========================================================

        if (isAdmin) {
            updateManualPrice(
                productId,
                Math.max(
                    0,
                    enteredPrice
                )
            );

            return;
        }

        // ========================================================
        // CASHIER
        // ========================================================

        let finalPrice =
            enteredPrice;

        if (
            enteredPrice <
            purchasePrice
        ) {
            finalPrice =
                purchasePrice;

            toast.error(
                `Cashier minimum price is LKR ${purchasePrice.toFixed(
                    2
                )}`
            );
        }

        if (
            enteredPrice >
            sellingPrice
        ) {
            finalPrice =
                sellingPrice;

            toast.error(
                `Cashier maximum price is LKR ${sellingPrice.toFixed(
                    2
                )}`
            );
        }

        updateManualPrice(
            productId,
            finalPrice
        );
    };

    // ============================================================
    // ENTER KEY
    // ============================================================

    const handlePriceKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        productId: number
    ) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
        }
    };

    // ============================================================
    // GET FINAL PRICE
    // ============================================================

    const getItemPrice = (
        item: CartItem
    ) => {
        return Number(
            item.finalUnitPrice ??
            item.manualPrice ??
            item.product.sellingPrice
        );
    };

    // ============================================================
    // GET ITEM DISCOUNT
    // ============================================================

    const getItemDiscount = (
        item: CartItem
    ) => {
        const sellingPrice =
            Number(
                item.product.sellingPrice
            );

        const finalPrice =
            getItemPrice(item);

        return (
            Math.max(
                0,
                sellingPrice -
                finalPrice
            ) *
            item.quantity
        );
    };

    // ============================================================
    // PRICE STATUS
    // ============================================================

    const getPriceStatus = (
        item: CartItem
    ) => {
        const price =
            getItemPrice(item);

        const minPrice =
            Number(
                item.product.purchasePrice
            );

        const maxPrice =
            Number(
                item.product.sellingPrice
            );

        if (isAdmin) {
            if (
                price <
                minPrice
            ) {
                return {
                    status:
                        'admin-below',
                    label:
                        'Admin: Below minimum',
                    color:
                        'text-orange-600',
                    bg:
                        'bg-orange-50',
                };
            }

            if (
                price ===
                minPrice
            ) {
                return {
                    status: 'min',
                    label:
                        'At minimum price',
                    color:
                        'text-yellow-600',
                    bg:
                        'bg-yellow-50',
                };
            }

            if (
                price ===
                maxPrice
            ) {
                return {
                    status: 'max',
                    label:
                        'At maximum price',
                    color:
                        'text-blue-600',
                    bg:
                        'bg-blue-50',
                };
            }

            return {
                status: 'normal',
                label:
                    'Admin price',
                color:
                    'text-green-600',
                bg:
                    'bg-green-50',
            };
        }

        if (
            price <
            minPrice
        ) {
            return {
                status: 'below',
                label:
                    'Below minimum!',
                color:
                    'text-red-600',
                bg:
                    'bg-red-50',
            };
        }

        if (
            price ===
            minPrice
        ) {
            return {
                status: 'min',
                label:
                    'At minimum price',
                color:
                    'text-yellow-600',
                bg:
                    'bg-yellow-50',
            };
        }

        if (
            price ===
            maxPrice
        ) {
            return {
                status: 'max',
                label:
                    'At maximum price',
                color:
                    'text-blue-600',
                bg:
                    'bg-blue-50',
            };
        }

        return {
            status: 'normal',
            label:
                'Within cashier range',
            color:
                'text-green-600',
            bg:
                'bg-green-50',
        };
    };

    // ============================================================
    // TOTALS
    // ============================================================

    // Original selling-price subtotal
    const originalSubtotal =
        cart.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.product
                        .sellingPrice
                ) *
                item.quantity,
            0
        );

    // Actual subtotal after item prices
    const itemSubtotal =
        cart.reduce(
            (sum, item) =>
                sum +
                getItemPrice(item) *
                item.quantity,
            0
        );

    // Difference between original selling price
    // and actual selling price
    const itemDiscountTotal =
        Math.max(
            0,
            originalSubtotal -
            itemSubtotal
        );

    const subtotalAfterItemDiscount =
        itemSubtotal;

    // ============================================================
    // GLOBAL DISCOUNT
    // ============================================================

    let globalDiscountAmount = 0;

    if (
        globalDiscountType ===
        'percentage'
    ) {
        globalDiscountAmount =
            subtotalAfterItemDiscount *
            (
                Math.max(
                    0,
                    globalDiscountValue
                ) / 100
            );
    } else {
        globalDiscountAmount =
            Math.min(
                Math.max(
                    0,
                    globalDiscountValue
                ),
                subtotalAfterItemDiscount
            );
    }

    // ============================================================
    // FINAL TOTAL
    // ============================================================

    const total =
        Math.max(
            0,
            subtotalAfterItemDiscount -
            globalDiscountAmount
        ) +
        Number(
            repairCharges || 0
        );

    // ============================================================
    // APPROVAL
    // ============================================================

    const needsApproval =
        cart.some(
            (item) =>
                item.requiresApproval
        );

    const approvalItemsList =
        cart.filter(
            (item) =>
                item.requiresApproval
        );

    // ============================================================
    // INSTALLMENT CALCULATION
    // ============================================================

    useEffect(() => {
        if (
            paymentMethod ===
            'INSTALLMENT' &&
            total > 0
        ) {
            const safeMonths =
                Math.max(
                    1,
                    installmentMonths
                );

            const loanAmount =
                Math.max(
                    0,
                    total -
                    installmentDownPayment
                );

            const monthly =
                (
                    loanAmount *
                    (
                        1 +
                        installmentInterest /
                        100
                    )
                ) /
                safeMonths;

            setInstallmentMonthlyAmount(
                monthly
            );
        } else {
            setInstallmentMonthlyAmount(
                0
            );
        }
    }, [
        total,
        installmentDownPayment,
        installmentMonths,
        installmentInterest,
        paymentMethod,
    ]);

    // ============================================================
    // HOLD SALE
    // ============================================================

    const handleHoldSale = () => {
        if (
            cart.length === 0
        ) {
            toast.error(
                'Cart is empty'
            );
            return;
        }

        if (!customer) {
            toast.error(
                'Please select a customer to hold the sale'
            );
            return;
        }

        const heldSale = {
            customer,
            cart,
            paymentMethod,
            cashReceived,
            cardReceived,
            globalDiscountType,
            globalDiscountValue,
            repairCharges,
            repairDescription,
            userRole,
            userName,

            installmentDetails:
                paymentMethod ===
                'INSTALLMENT'
                    ? {
                        downPayment:
                        installmentDownPayment,
                        months:
                        installmentMonths,
                        monthlyAmount:
                        installmentMonthlyAmount,
                        firstDueDate:
                        installmentFirstDueDate,
                        interest:
                        installmentInterest,
                    }
                    : null,

            heldAt:
                new Date().toISOString(),
        };

        const heldSales =
            JSON.parse(
                localStorage.getItem(
                    'heldSales'
                ) || '[]'
            );

        heldSales.push(
            heldSale
        );

        localStorage.setItem(
            'heldSales',
            JSON.stringify(
                heldSales
            )
        );

        setCart([]);
        setPriceInputs({});
        setGlobalDiscountValue(0);
        setRepairCharges(0);
        setRepairDescription('');

        toast.success(
            'Sale held successfully!'
        );

        toast.success(
            `Total held sales: ${heldSales.length}`
        );
    };

    // ============================================================
    // CHECKOUT
    // ============================================================

    const handleCheckout =
        async () => {
            if (
                cart.length === 0
            ) {
                toast.error(
                    'Cart is empty'
                );
                return;
            }

            // ====================================================
            // CASHIER SECURITY CHECK
            // ====================================================

            if (!isAdmin) {
                const invalidItem =
                    cart.find(
                        (item) => {
                            const finalPrice =
                                getItemPrice(
                                    item
                                );

                            const minPrice =
                                Number(
                                    item.product
                                        .purchasePrice
                                );

                            const maxPrice =
                                Number(
                                    item.product
                                        .sellingPrice
                                );

                            return (
                                finalPrice <
                                minPrice ||
                                finalPrice >
                                maxPrice
                            );
                        }
                    );

                if (
                    invalidItem
                ) {
                    const minPrice =
                        Number(
                            invalidItem
                                .product
                                .purchasePrice
                        );

                    const maxPrice =
                        Number(
                            invalidItem
                                .product
                                .sellingPrice
                        );

                    toast.error(
                        `${invalidItem.product.name}: Cashier price must be between LKR ${minPrice.toFixed(
                            2
                        )} and LKR ${maxPrice.toFixed(
                            2
                        )}`
                    );

                    return;
                }
            }

            // ====================================================
            // APPROVAL
            // ====================================================

            if (
                needsApproval &&
                !isAdmin
            ) {
                setApprovalItems(
                    approvalItemsList
                );

                setShowApprovalModal(
                    true
                );

                return;
            }

            // ====================================================
            // INSTALLMENT CUSTOMER
            // ====================================================

            if (
                paymentMethod ===
                'INSTALLMENT' &&
                !customer
            ) {
                toast.error(
                    'Customer is required for installment payments'
                );

                return;
            }

            // ====================================================
            // CASH PAYMENT
            // ====================================================

            if (paymentMethod === 'CASH') {
                const cash = parseFloat(cashReceived || '0');

                if (!Number.isFinite(cash) || cash < total) {
                    toast.error(
                        `Cash received must be at least LKR ${total.toFixed(2)}`
                    );
                    return;
                }
            }

            // ====================================================
            // CARD PAYMENT
            // ====================================================

            if (paymentMethod === 'CARD') {
                const card = parseFloat(cardReceived || '0');

                if (!Number.isFinite(card) || card < total) {
                    toast.error(
                        `Card payment must be at least LKR ${total.toFixed(2)}`
                    );
                    return;
                }
            }

            // ====================================================
            // SPLIT PAYMENT: CASH + CARD
            // ====================================================

            if (paymentMethod === 'SPLIT') {
                const cash = parseFloat(cashReceived || '0');
                const card = parseFloat(cardReceived || '0');
                const paid = (Number.isFinite(cash) ? cash : 0) +
                    (Number.isFinite(card) ? card : 0);

                if (cash < 0 || card < 0) {
                    toast.error('Payment amounts cannot be negative');
                    return;
                }

                if (paid < total) {
                    toast.error(
                        `Split payment is short by LKR ${(total - paid).toFixed(2)}`
                    );
                    return;
                }
            }

            // ====================================================
            // DOWN PAYMENT
            // ====================================================

            if (
                paymentMethod ===
                'INSTALLMENT' &&
                installmentDownPayment >
                total
            ) {
                toast.error(
                    'Down payment cannot exceed total amount'
                );

                return;
            }

            await processCheckout();
        };

    // ============================================================
    // PROCESS CHECKOUT
    // ============================================================

    const processCheckout =
        async () => {
            setLoading(true);

            try {
                const saleData = {
                    customerId:
                        customer?.id ||
                        null,

                    cashierId: 1,

                    items: cart.map(
                        (item) => {
                            const finalPrice =
                                getItemPrice(
                                    item
                                );

                            const sellingPrice =
                                Number(
                                    item.product
                                        .sellingPrice
                                );

                            const discountPerUnit =
                                Math.max(
                                    0,
                                    sellingPrice -
                                    finalPrice
                                );

                            return {
                                productId:
                                item.product
                                    .id,

                                quantity:
                                item.quantity,

                                price:
                                finalPrice,

                                discount:
                                discountPerUnit,
                            };
                        }
                    ),

                    subtotal:
                    originalSubtotal,

                    discount:
                        itemDiscountTotal +
                        globalDiscountAmount,

                    tax: 0,

                    grandTotal:
                    total,

                    paymentMethod,

                    // Payment breakdown
                    cashReceived:
                        paymentMethod === 'CASH' || paymentMethod === 'SPLIT'
                            ? parseFloat(cashReceived || '0')
                            : 0,

                    cardReceived:
                        paymentMethod === 'CARD' || paymentMethod === 'SPLIT'
                            ? parseFloat(cardReceived || '0')
                            : 0,

                    totalPaid:
                        paymentMethod === 'CASH'
                            ? parseFloat(cashReceived || '0')
                            : paymentMethod === 'CARD'
                                ? parseFloat(cardReceived || '0')
                                : paymentMethod === 'SPLIT'
                                    ? parseFloat(cashReceived || '0') + parseFloat(cardReceived || '0')
                                    : undefined,

                    balance:
                        paymentMethod === 'CASH'
                            ? parseFloat(cashReceived || '0') - total
                            : paymentMethod === 'SPLIT'
                                ? parseFloat(cashReceived || '0') + parseFloat(cardReceived || '0') - total
                                : undefined,

                    repairCharges,

                    repairDescription,

                    requiresApproval:
                    needsApproval,

                    approvedBy:
                        needsApproval
                            ? isAdmin
                                ? 'Admin'
                                : null
                            : null,

                    installmentDetails:
                        paymentMethod ===
                        'INSTALLMENT'
                            ? {
                                downPayment:
                                installmentDownPayment,

                                months:
                                installmentMonths,

                                monthlyAmount:
                                installmentMonthlyAmount,

                                firstDueDate:
                                installmentFirstDueDate,

                                interest:
                                installmentInterest,
                            }
                            : null,
                };

                // =================================================
                // SEND SALE
                // =================================================

                const res =
                    await fetch(
                        '/api/sales',
                        {
                            method: 'POST',

                            headers: {
                                'Content-Type':
                                    'application/json',
                            },

                            body: JSON.stringify(
                                saleData
                            ),
                        }
                    );

                if (!res.ok) {
                    let err: any = {};

                    try {
                        err =
                            await res.json();
                    } catch {
                        err = {};
                    }

                    throw new Error(
                        err.message ||
                        'Checkout failed'
                    );
                }

                const sale =
                    await res.json();

                toast.success(
                    'Sale completed successfully! 🎉'
                );

                // =================================================
                // RECEIPT
                // =================================================

                const receiptData = {
                    invoiceNo: sale.invoiceNo,

                    date: new Date().toLocaleString(),

                    customer:
                        customer?.name || 'Walk-in Customer',

                    cashier: userName || 'Admin',

                    items: cart.map((item) => {
                        const finalPrice = getItemPrice(item);

                        const marketPrice =
                            Number(item.product.sellingPrice) || 0;

                        return {
                            name: item.product.name,
                            quantity: item.quantity,

                            // Customer's actual price
                            price: finalPrice,

                            // Original selling price = Market Price
                            marketPrice: marketPrice,

                            discount: Math.max(
                                0,
                                marketPrice - finalPrice
                            ),
                        };
                    }),

                    subtotal: originalSubtotal,

                    discountTotal:
                        itemDiscountTotal +
                        globalDiscountAmount,

                    tax: 0,

                    repairCharges,

                    total: total,

                    paymentMethod: paymentMethod,

                    // ==========================================
                    // PAYMENT VALUES
                    // ==========================================

                    cashAmount:
                        paymentMethod === 'CASH' ||
                        paymentMethod === 'SPLIT'
                            ? Number(cashReceived || 0)
                            : 0,

                    cardAmount:
                        paymentMethod === 'CARD' ||
                        paymentMethod === 'SPLIT'
                            ? Number(cardReceived || 0)
                            : 0,

                    // Total money received
                    tendered:
                        paymentMethod === 'CASH'
                            ? Number(cashReceived || 0)
                            : paymentMethod === 'CARD'
                                ? Number(cardReceived || 0)
                                : paymentMethod === 'SPLIT'
                                    ? Number(cashReceived || 0) +
                                    Number(cardReceived || 0)
                                    : 0,

                    // Change
                    balance:
                        paymentMethod === 'CASH'
                            ? Math.max(
                                0,
                                Number(cashReceived || 0) - total
                            )
                            : paymentMethod === 'SPLIT'
                                ? Math.max(
                                    0,
                                    (
                                        Number(cashReceived || 0) +
                                        Number(cardReceived || 0)
                                    ) - total
                                )
                                : 0,

                    requiresApproval: needsApproval,

                    approvedBy:
                        needsApproval
                            ? isAdmin
                                ? 'Admin'
                                : null
                            : null,
                };
                sessionStorage.setItem(
                    'receipt',
                    JSON.stringify(
                        receiptData
                    )
                );

                // =================================================
                // RESET
                // =================================================

                setCart([]);
                setPriceInputs({});

                setGlobalDiscountValue(
                    0
                );

                setRepairCharges(0);

                setRepairDescription(
                    ''
                );

                setCashReceived('');
                setCardReceived('');

                setCustomer(null);

                setInstallmentDownPayment(
                    0
                );

                setInstallmentMonths(
                    12
                );

                setInstallmentInterest(
                    0
                );

                router.push(
                    '/receipt'
                );
            } catch (err: any) {
                console.error(
                    'Checkout error:',
                    err
                );

                toast.error(
                    err?.message ||
                    'Checkout failed'
                );
            } finally {
                setLoading(false);
            }
        };

    // ============================================================
    // ADD CUSTOMER
    // ============================================================

    const handleAddCustomer =
        async () => {
            if (
                !newCustomer.name ||
                !newCustomer.phone
            ) {
                toast.error(
                    'Name and Phone are required'
                );

                return;
            }

            try {
                const res =
                    await fetch(
                        '/api/customers',
                        {
                            method: 'POST',

                            headers: {
                                'Content-Type':
                                    'application/json',
                            },

                            body: JSON.stringify(
                                newCustomer
                            ),
                        }
                    );

                if (!res.ok) {
                    let errorData: any = {};

                    try {
                        errorData =
                            await res.json();
                    } catch {
                        errorData = {};
                    }

                    throw new Error(
                        errorData.message ||
                        'Failed to add customer'
                    );
                }

                const customerData =
                    await res.json();

                setCustomers((prev) => [
                    ...prev,
                    customerData,
                ]);

                setCustomer(
                    customerData
                );

                setShowAddCustomerModal(
                    false
                );

                setNewCustomer({
                    name: '',
                    phone: '',
                    email: '',
                    address: '',
                });

                toast.success(
                    'Customer added successfully!'
                );
            } catch (err: any) {
                toast.error(
                    err?.message ||
                    'Failed to add customer'
                );
            }
        };

    // ============================================================
    // BARCODE SCANNER
    //
    // USB/Bluetooth barcode scanners normally behave like a keyboard.
    // They type the barcode into the focused input and send ENTER.
    //
    // Flow:
    // Scanner -> searchQuery -> exact barcode/IMEI/serial match
    // -> addToCart() -> search box cleared -> focus returns to scanner
    // ============================================================

    const handleBarcodeScan = (value: string) => {
        const scannedCode = String(value || '').trim();

        if (!scannedCode) {
            return;
        }

        console.log('SCANNED CODE:', scannedCode);

        // --------------------------------------------------------
        // Exact match first: barcode, IMEI, serial number
        // --------------------------------------------------------
        const normalizedCode = scannedCode.toLowerCase();

        const match = products.find((p) => {
            const barcode = String(p.barcode || '').trim().toLowerCase();
            const imei = String(p.imei || '').trim().toLowerCase();
            const serial = String(p.serialNumber || '').trim().toLowerCase();

            return (
                barcode === normalizedCode ||
                imei === normalizedCode ||
                serial === normalizedCode
            );
        });

        if (match) {
            console.log('SCANNER PRODUCT FOUND:', match);

            // addToCart already checks stock and increments quantity
            // when the same product is scanned again.
            addToCart(match);

            toast.success(`Added: ${match.name}`);

            // addToCart clears the input, but explicitly clear it here
            // too so the scanner is immediately ready for the next scan.
            setSearchQuery('');
            setFilteredProducts([]);

            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);

            return;
        }

        // --------------------------------------------------------
        // Barcode/IMEI/serial not found
        // --------------------------------------------------------
        toast.error(`Product not found: ${scannedCode}`);

        setSearchQuery('');
        setFilteredProducts([]);

        setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
    };


    // ============================================================
    // KEEP SCANNER INPUT FOCUSED
    //
    // This makes the POS ready to scan without clicking the box
    // every time. We do NOT steal focus while the user is typing
    // inside another input/textarea/select/button.
    // ============================================================

    useEffect(() => {
        const focusScanner = () => {
            const active = document.activeElement as HTMLElement | null;

            if (!active) {
                inputRef.current?.focus();
                return;
            }

            const tag = active.tagName.toLowerCase();

            const isTypingField =
                tag === 'input' ||
                tag === 'textarea' ||
                tag === 'select' ||
                tag === 'button' ||
                active.isContentEditable;

            if (!isTypingField) {
                inputRef.current?.focus();
            }
        };

        // Focus when Sales page opens.
        inputRef.current?.focus();

        // If the cashier clicks an empty page area, return focus
        // to the scanner input. Other form controls keep their focus.
        window.addEventListener('click', focusScanner);

        return () => {
            window.removeEventListener('click', focusScanner);
        };
    }, []);


    // ============================================================
    // FIRST PRODUCT
    // ============================================================

    const firstProduct =
        cart.length > 0
            ? cart[0].product
            : null;

    // ============================================================
    // UI
    // ============================================================

    return (
        <div className="flex flex-col lg:flex-row gap-6">

            {/* ==================================================
                ROLE BANNER
            ================================================== */}

            <div className="fixed top-16 right-4 z-40">
                <div
                    className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
                        isAdmin
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}
                >
                    {isAdmin ? (
                        <Shield className="w-4 h-4" />
                    ) : (
                        <Lock className="w-4 h-4" />
                    )}

                    <span className="text-sm font-medium">
                        {userRole}: {userName}
                    </span>

                    {!isAdmin &&
                        firstProduct && (
                            <span className="text-xs text-blue-600 ml-2">
                                (Min: LKR{' '}
                                {Number(
                                    firstProduct.purchasePrice
                                ).toFixed(2)}
                                {' '}-
                                Max: LKR{' '}
                                {Number(
                                    firstProduct.sellingPrice
                                ).toFixed(2)}
                                )
                            </span>
                        )}

                    {isAdmin && (
                        <span className="text-xs text-green-600 ml-2">
                            (Full Access)
                        </span>
                    )}
                </div>
            </div>

            {/* ==================================================
                LEFT SIDE
            ================================================== */}

            <div className="lg:w-2/3">

                {/* SEARCH */}

                <div className="bg-white p-4 rounded-lg shadow mb-4">

                    <div className="flex items-center gap-2">

                        <Search className="w-5 h-5 text-gray-500" />

                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Scan barcode, IMEI, serial or search product..."
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            value={searchQuery}
                            onChange={(e) =>
                                setSearchQuery(
                                    e.target.value
                                )
                            }
                            onKeyDown={(e) => {
                                if (e.key !== 'Enter') {
                                    return;
                                }

                                e.preventDefault();

                                const value = searchQuery.trim();

                                if (!value) {
                                    return;
                                }

                                // Enter from a barcode scanner reaches here.
                                // Exact barcode/IMEI/serial is handled first.
                                handleBarcodeScan(value);
                            }}
                        />

                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                        Barcode scanner ready — scan the sticker barcode and press Enter if your scanner does not send Enter automatically.
                    </div>

                    {/* SEARCH RESULTS */}

                    {filteredProducts.length >
                        0 && (
                            <div className="mt-2 max-h-60 overflow-y-auto border rounded-md divide-y">

                                {filteredProducts.map(
                                    (p) => (
                                        <div
                                            key={p.id}
                                            className="flex justify-between items-center p-2 hover:bg-gray-50 cursor-pointer"
                                            onClick={() =>
                                                addToCart(
                                                    p
                                                )
                                            }
                                        >

                                            <div>

                                            <span className="font-medium">
                                                {p.name}
                                            </span>

                                                <span className="text-xs text-gray-500 ml-2">
                                                {p.barcode
                                                    ? `📱 ${p.barcode}`
                                                    : p.imei
                                                        ? `📱 ${p.imei}`
                                                        : ''}
                                            </span>

                                                <div className="text-xs text-gray-400">
                                                    Price Range:
                                                    {' '}
                                                    LKR{' '}
                                                    {Number(
                                                        p.purchasePrice
                                                    ).toFixed(
                                                        2
                                                    )}
                                                    {' '}-
                                                    LKR{' '}
                                                    {Number(
                                                        p.sellingPrice
                                                    ).toFixed(
                                                        2
                                                    )}
                                                </div>

                                            </div>

                                            <div className="text-right">

                                            <span className="text-sm font-semibold">
                                                LKR{' '}
                                                {Number(
                                                    p.sellingPrice
                                                ).toFixed(
                                                    2
                                                )}
                                            </span>

                                                <span className="text-xs text-gray-500 ml-2">
                                                Stock:
                                                    {' '}
                                                    {p.stock}
                                            </span>

                                            </div>

                                        </div>
                                    )
                                )}

                            </div>
                        )}

                </div>

                {/* CART */}

                <div className="bg-white p-4 rounded-lg shadow">

                    <div className="flex justify-between items-center mb-4">

                        <h2 className="text-lg font-semibold">
                            Cart
                        </h2>

                        <div className="flex gap-2">

                            <button
                                onClick={
                                    handleHoldSale
                                }
                                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 disabled:opacity-50"
                                disabled={
                                    cart.length ===
                                    0
                                }
                            >
                                <Archive className="w-4 h-4" />
                                Hold
                            </button>

                            <button
                                onClick={() =>
                                    setShowRepairModal(
                                        true
                                    )
                                }
                                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1"
                            >
                                <Wrench className="w-4 h-4" />
                                Add Repair
                            </button>

                        </div>

                    </div>

                    {cart.length === 0 ? (
                        <p className="text-gray-500">
                            No items added
                        </p>
                    ) : (
                        <div className="space-y-3">

                            {cart.map(
                                (item) => {

                                    const effectivePrice =
                                        getItemPrice(
                                            item
                                        );

                                    // IMPORTANT:
                                    // This is already the final
                                    // price, so DO NOT subtract
                                    // discount again.
                                    const lineTotal =
                                        effectivePrice *
                                        item.quantity;

                                    const discountAmount =
                                        getItemDiscount(
                                            item
                                        );

                                    const priceStatus =
                                        getPriceStatus(
                                            item
                                        );

                                    const minPrice =
                                        Number(
                                            item.product
                                                .purchasePrice
                                        );

                                    const maxPrice =
                                        Number(
                                            item.product
                                                .sellingPrice
                                        );

                                    return (
                                        <div
                                            key={
                                                item.product
                                                    .id
                                            }
                                            className={`border-b pb-3 p-3 rounded-lg ${priceStatus.bg}`}
                                        >

                                            {/* PRODUCT ROW */}

                                            <div className="flex flex-wrap items-center gap-3">

                                                {/* PRODUCT INFO */}

                                                <div className="flex-1 min-w-[180px]">

                                                    <p className="font-medium">
                                                        {
                                                            item.product
                                                                .name
                                                        }
                                                    </p>

                                                    <p className="text-sm text-gray-600">

                                                        Unit Price:

                                                        <span className="font-semibold ml-1">
                                                            LKR{' '}
                                                            {effectivePrice.toFixed(
                                                                2
                                                            )}
                                                        </span>

                                                        {item.isPriceEdited && (
                                                            <span className="text-xs text-blue-600 ml-2">
                                                                (manual)
                                                            </span>
                                                        )}

                                                        <span
                                                            className={`text-xs ml-2 font-medium ${priceStatus.color}`}
                                                        >
                                                            {
                                                                priceStatus.label
                                                            }
                                                        </span>

                                                    </p>

                                                    {/* RANGE */}

                                                    <p className="text-xs text-gray-400 mt-1">

                                                        Price Range:

                                                        {' '}LKR{' '}
                                                        {minPrice.toFixed(
                                                            2
                                                        )}

                                                        {' '}-

                                                        {' '}LKR{' '}
                                                        {maxPrice.toFixed(
                                                            2
                                                        )}

                                                        {!isAdmin && (
                                                            <span className="text-xs text-blue-500 ml-2">
                                                                Cashier allowed range
                                                            </span>
                                                        )}

                                                        {isAdmin && (
                                                            <span className="text-xs text-green-500 ml-2">
                                                                Admin: Any price
                                                            </span>
                                                        )}

                                                    </p>

                                                    {/* DISCOUNT */}

                                                    {discountAmount >
                                                        0 && (
                                                            <p className="text-xs text-green-600 mt-1 font-medium">
                                                                💰 Discount:
                                                                {' '}
                                                                - LKR{' '}
                                                                {discountAmount.toFixed(
                                                                    2
                                                                )}
                                                            </p>
                                                        )}

                                                </div>

                                                {/* QUANTITY */}

                                                <div className="flex items-center gap-1">

                                                    <label className="text-xs text-gray-500">
                                                        Qty:
                                                    </label>

                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={
                                                            item.product
                                                                .stock
                                                        }
                                                        value={
                                                            item.quantity
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateQuantity(
                                                                item.product
                                                                    .id,
                                                                parseInt(
                                                                    e.target
                                                                        .value
                                                                ) ||
                                                                1
                                                            )
                                                        }
                                                        className="w-14 px-1 py-1 border border-gray-300 rounded text-center"
                                                    />

                                                </div>

                                                {/* DISCOUNT */}

                                                <div className="flex items-center gap-1">

                                                    <label className="text-xs text-gray-500">
                                                        Discount:
                                                    </label>

                                                    <select
                                                        value={
                                                            item.discountType
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateDiscount(
                                                                item.product
                                                                    .id,
                                                                e.target
                                                                    .value as DiscountType,
                                                                item.discountValue
                                                            )
                                                        }
                                                        disabled={
                                                            !isAdmin
                                                        }
                                                        className={`text-xs border rounded px-1 py-1 ${
                                                            isAdmin
                                                                ? 'border-green-300 bg-white'
                                                                : 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                                                        }`}
                                                    >

                                                        <option value="amount">
                                                            LKR
                                                        </option>

                                                        <option value="percentage">
                                                            %
                                                        </option>

                                                    </select>

                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={
                                                            Number(
                                                                item.discountValue
                                                            ).toFixed(
                                                                2
                                                            )
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            updateDiscount(
                                                                item.product
                                                                    .id,
                                                                item.discountType,
                                                                parseFloat(
                                                                    e.target
                                                                        .value
                                                                ) ||
                                                                0
                                                            )
                                                        }
                                                        disabled={
                                                            !isAdmin
                                                        }
                                                        className={`w-24 px-2 py-1 border rounded text-center ${
                                                            isAdmin
                                                                ? 'border-green-300 bg-white'
                                                                : 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                                                        }`}
                                                    />

                                                    {!isAdmin && (
                                                        <span className="text-[10px] text-blue-600 font-bold">
                                                            AUTO
                                                        </span>
                                                    )}

                                                    {isAdmin && (
                                                        <Edit2 className="w-3 h-3 text-green-600" />
                                                    )}

                                                </div>

                                                {/* PRICE */}

                                                <div className="flex items-center gap-1">

                                                    <label className="text-xs text-gray-500 font-medium">
                                                        Price:
                                                    </label>

                                                    <div className="relative flex items-center">

                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            inputMode="decimal"

                                                            /*
                                                             * IMPORTANT:
                                                             * Cashier MUST be able
                                                             * to edit this field.
                                                             *
                                                             * Do not use min/max
                                                             * HTML restrictions here
                                                             * because they can make
                                                             * typing difficult.
                                                             *
                                                             * Validation happens
                                                             * on blur / Enter.
                                                             */

                                                            disabled={false}

                                                            value={
                                                                priceInputs[
                                                                    item.product
                                                                        .id
                                                                    ] ??
                                                                Number(
                                                                    item.finalUnitPrice ??
                                                                    item.manualPrice ??
                                                                    item.product
                                                                        .sellingPrice
                                                                ).toFixed(
                                                                    2
                                                                )
                                                            }

                                                            onChange={(
                                                                e
                                                            ) =>
                                                                handlePriceChange(
                                                                    item.product
                                                                        .id,
                                                                    e.target
                                                                        .value
                                                                )
                                                            }

                                                            onBlur={() =>
                                                                handlePriceBlur(
                                                                    item.product
                                                                        .id
                                                                )
                                                            }

                                                            onKeyDown={(
                                                                e
                                                            ) =>
                                                                handlePriceKeyDown(
                                                                    e,
                                                                    item.product
                                                                        .id
                                                                )
                                                            }

                                                            className={`w-28 px-2 py-2 border-2 rounded-lg text-center font-semibold outline-none ${
                                                                isAdmin
                                                                    ? 'border-green-400 bg-green-50 focus:ring-2 focus:ring-green-400'
                                                                    : 'border-blue-400 bg-blue-50 focus:ring-2 focus:ring-blue-400'
                                                            }`}

                                                            placeholder="0.00"

                                                            title={
                                                                isAdmin
                                                                    ? 'Admin: Any price >= 0'
                                                                    : `Cashier allowed: LKR ${minPrice.toFixed(
                                                                        2
                                                                    )} - LKR ${maxPrice.toFixed(
                                                                        2
                                                                    )}`
                                                            }
                                                        />

                                                        {!isAdmin && (
                                                            <div className="ml-2 text-[10px] leading-tight">

                                                                <div className="text-green-600">
                                                                    Min:
                                                                    {' '}
                                                                    LKR{' '}
                                                                    {minPrice.toFixed(
                                                                        2
                                                                    )}
                                                                </div>

                                                                <div className="text-blue-600">
                                                                    Max:
                                                                    {' '}
                                                                    LKR{' '}
                                                                    {maxPrice.toFixed(
                                                                        2
                                                                    )}
                                                                </div>

                                                            </div>
                                                        )}

                                                        {isAdmin && (
                                                            <Edit2
                                                                className="w-4 h-4 text-green-600 ml-1"
                                                                aria-label="Admin can set any price"
                                                            />
                                                        )}

                                                    </div>

                                                </div>

                                                {/* TOTAL */}

                                                <div className="text-sm font-semibold min-w-[110px] text-right">
                                                    LKR{' '}
                                                    {lineTotal.toFixed(
                                                        2
                                                    )}
                                                </div>

                                                {/* DELETE */}

                                                <button
                                                    onClick={() =>
                                                        removeFromCart(
                                                            item.product
                                                                .id
                                                        )
                                                    }
                                                    className="text-red-600 hover:text-red-800 p-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>

                                            </div>

                                            {/* DISCOUNT MESSAGE */}

                                            {discountAmount >
                                                0 && (
                                                    <div className="text-xs text-green-600 mt-2">
                                                        💰 Discount:
                                                        {' '}
                                                        - LKR{' '}
                                                        {discountAmount.toFixed(
                                                            2
                                                        )}
                                                    </div>
                                                )}

                                            {/* CASHIER MINIMUM */}

                                            {!isAdmin &&
                                                effectivePrice ===
                                                minPrice && (
                                                    <div className="text-xs text-yellow-600 mt-1 flex items-center gap-1">

                                                        <AlertCircle className="w-3 h-3" />

                                                        ⚠️ Price is at minimum:
                                                        {' '}
                                                        LKR{' '}
                                                        {minPrice.toFixed(
                                                            2
                                                        )}

                                                    </div>
                                                )}

                                            {/* CASHIER MAXIMUM */}

                                            {!isAdmin &&
                                                effectivePrice ===
                                                maxPrice && (
                                                    <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">

                                                        <AlertCircle className="w-3 h-3" />

                                                        ℹ️ Price is at maximum:
                                                        {' '}
                                                        LKR{' '}
                                                        {maxPrice.toFixed(
                                                            2
                                                        )}

                                                        {' '}— No discount.

                                                    </div>
                                                )}

                                            {/* ADMIN BELOW MIN */}

                                            {isAdmin &&
                                                effectivePrice <
                                                minPrice && (
                                                    <div className="text-xs text-orange-600 mt-1 flex items-center gap-1">

                                                        <AlertCircle className="w-3 h-3" />

                                                        ⚠️ Admin:
                                                        Price below purchase price.

                                                    </div>
                                                )}

                                        </div>
                                    );
                                }
                            )}

                        </div>
                    )}

                    {/* ==================================================
                        TOTAL SUMMARY
                    ================================================== */}

                    <div className="mt-4 border-t pt-4 space-y-2">

                        {/* ORIGINAL SUBTOTAL */}

                        <div className="flex justify-between text-sm">

                            <span>
                                Subtotal
                            </span>

                            <span>
                                LKR{' '}
                                {originalSubtotal.toFixed(
                                    2
                                )}
                            </span>

                        </div>

                        {/* ITEM DISCOUNTS */}

                        <div className="flex justify-between text-sm text-green-600">

                            <span>
                                Item Discounts
                            </span>

                            <span>
                                - LKR{' '}
                                {itemDiscountTotal.toFixed(
                                    2
                                )}
                            </span>

                        </div>

                        {/* AFTER ITEM DISCOUNT */}

                        <div className="flex justify-between text-sm">

                            <span>
                                After Item Discount
                            </span>

                            <span className="font-medium">
                                LKR{' '}
                                {subtotalAfterItemDiscount.toFixed(
                                    2
                                )}
                            </span>

                        </div>

                        {/* GLOBAL DISCOUNT */}

                        <div className="flex items-center justify-between text-sm">

                            <span>
                                Global Discount
                            </span>

                            <div className="flex items-center gap-2">

                                <select
                                    value={
                                        globalDiscountType
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setGlobalDiscountType(
                                            e.target
                                                .value as DiscountType
                                        )
                                    }
                                    disabled={
                                        !isAdmin
                                    }
                                    className={`text-xs border rounded px-1 py-1 ${
                                        !isAdmin
                                            ? 'bg-gray-100 text-gray-500'
                                            : 'border-green-300'
                                    }`}
                                >

                                    <option value="percentage">
                                        %
                                    </option>

                                    <option value="amount">
                                        LKR
                                    </option>

                                </select>

                                <input
                                    type="number"
                                    min="0"
                                    value={
                                        globalDiscountValue
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setGlobalDiscountValue(
                                            parseFloat(
                                                e.target
                                                    .value
                                            ) ||
                                            0
                                        )
                                    }
                                    disabled={
                                        !isAdmin
                                    }
                                    className={`w-20 px-2 py-1 border rounded text-right ${
                                        !isAdmin
                                            ? 'bg-gray-100 text-gray-500'
                                            : 'border-green-300'
                                    }`}
                                />

                                <span className="text-sm font-medium">
                                    - LKR{' '}
                                    {globalDiscountAmount.toFixed(
                                        2
                                    )}
                                </span>

                            </div>

                        </div>

                        {/* REPAIR */}

                        {repairCharges >
                            0 && (
                                <div className="flex justify-between text-sm text-purple-600">

                                <span>
                                    Repair Charges
                                </span>

                                    <span>
                                    + LKR{' '}
                                        {Number(
                                            repairCharges
                                        ).toFixed(
                                            2
                                        )}
                                </span>

                                </div>
                            )}

                        {/* APPROVAL */}

                        {needsApproval && (
                            <div className="flex justify-between text-sm text-red-600 bg-red-50 p-2 rounded">

                                <span className="flex items-center gap-1">

                                    <AlertCircle className="w-4 h-4" />

                                    ⚠️ Approval Required

                                </span>

                                <span>
                                    {
                                        approvalItemsList.length
                                    }{' '}
                                    item(s) need admin approval
                                </span>

                            </div>
                        )}

                        {/* TOTAL */}

                        <div className="flex justify-between font-bold text-lg border-t pt-3">

                            <span>
                                Total
                            </span>

                            <span className="text-green-700">
                                LKR{' '}
                                {total.toFixed(
                                    2
                                )}
                            </span>

                        </div>

                    </div>

                </div>

            </div>

            {/* ==================================================
                RIGHT SIDE
            ================================================== */}

            <div className="lg:w-1/3 space-y-4">

                {/* CUSTOMER */}

                <div className="bg-white p-4 rounded-lg shadow">

                    <div className="flex justify-between items-center mb-2">

                        <h3 className="font-semibold">
                            Customer
                        </h3>

                        <button
                            onClick={() =>
                                setShowAddCustomerModal(
                                    true
                                )
                            }
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                        >
                            <UserPlus className="w-4 h-4" />
                            Add New
                        </button>

                    </div>

                    {customer ? (
                        <div className="flex justify-between items-center">

                            <div>

                                <p className="font-medium">
                                    {customer.name}
                                </p>

                                <p className="text-sm text-gray-500">
                                    {customer.phone}
                                </p>

                                {customer.email && (
                                    <p className="text-sm text-gray-500">
                                        {customer.email}
                                    </p>
                                )}

                            </div>

                            <button
                                onClick={() =>
                                    setCustomer(
                                        null
                                    )
                                }
                                className="text-red-600"
                            >
                                <X className="w-4 h-4" />
                            </button>

                        </div>
                    ) : (
                        <button
                            onClick={() =>
                                setShowCustomerModal(
                                    true
                                )
                            }
                            className="w-full bg-gray-100 hover:bg-gray-200 py-2 rounded-md"
                        >
                            Select Customer
                        </button>
                    )}

                </div>

                {/* PAYMENT */}

                <div className="bg-white p-4 rounded-lg shadow">

                    <h3 className="font-semibold mb-2">
                        Payment
                    </h3>

                    <select
                        value={
                            paymentMethod
                        }
                        onChange={(e) =>
                            setPaymentMethod(
                                e.target
                                    .value as
                                    | 'CASH'
                                    | 'CARD'
                                    | 'QR'
                                    | 'SPLIT'
                                    | 'INSTALLMENT'
                            )
                        }
                        className="w-full border border-gray-300 rounded-md p-2 mb-2"
                    >

                        <option value="CASH">
                            Cash
                        </option>

                        <option value="CARD">
                            Card
                        </option>

                        <option value="QR">
                            QR
                        </option>

                        <option value="SPLIT">
                            Split (Cash + Card)
                        </option>

                        <option value="INSTALLMENT">
                            Installment
                        </option>

                    </select>

                    {/* CASH */}

                    {paymentMethod === 'CASH' && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">
                                Cash Received
                            </label>

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                inputMode="decimal"
                                value={cashReceived}
                                onChange={(e) => setCashReceived(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2"
                                placeholder="Enter cash amount"
                            />

                            {cashReceived !== '' && (
                                <div className="text-sm text-gray-600">
                                    Change:
                                    <span className="font-semibold ml-1 text-green-600">
                                        LKR {Math.max(0, parseFloat(cashReceived || '0') - total).toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CARD */}

                    {paymentMethod === 'CARD' && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">
                                Card Payment
                            </label>

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                inputMode="decimal"
                                value={cardReceived}
                                onChange={(e) => setCardReceived(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2"
                                placeholder="Enter card amount"
                            />
                        </div>
                    )}

                    {/* SPLIT PAYMENT */}

                    {paymentMethod === 'SPLIT' && (
                        <div className="mt-2 p-3 border border-blue-200 bg-blue-50 rounded-md space-y-3">
                            <div className="text-sm font-semibold text-blue-800">
                                Split Payment — Cash + Card
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Cash Payment (LKR)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    inputMode="decimal"
                                    value={cashReceived}
                                    onChange={(e) => setCashReceived(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2 bg-white"
                                    placeholder="e.g. 500.00"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Card Payment (LKR)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    inputMode="decimal"
                                    value={cardReceived}
                                    onChange={(e) => setCardReceived(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md p-2 bg-white"
                                    placeholder="e.g. 1000.00"
                                />
                            </div>

                            <div className="border-t border-blue-200 pt-2 space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span>Bill Total</span>
                                    <span className="font-semibold">LKR {total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Cash</span>
                                    <span>LKR {parseFloat(cashReceived || '0').toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Card</span>
                                    <span>LKR {parseFloat(cardReceived || '0').toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                    <span>Total Paid</span>
                                    <span>LKR {(parseFloat(cashReceived || '0') + parseFloat(cardReceived || '0')).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{(parseFloat(cashReceived || '0') + parseFloat(cardReceived || '0')) >= total ? 'Change' : 'Remaining'}</span>
                                    <span className={(parseFloat(cashReceived || '0') + parseFloat(cardReceived || '0')) >= total ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                        LKR {Math.abs(total - (parseFloat(cashReceived || '0') + parseFloat(cardReceived || '0'))).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* INSTALLMENT */}

                    {paymentMethod ===
                        'INSTALLMENT' && (
                            <div className="space-y-3 mt-2 p-3 border border-gray-200 rounded-md">

                                <div className="text-sm text-red-600 mb-2">
                                    ⚠️ Customer is required for installment payments
                                </div>

                                <div className="grid grid-cols-2 gap-2">

                                    <div>

                                        <label className="block text-xs font-medium text-gray-700">
                                            Down Payment
                                            (LKR)
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            value={
                                                installmentDownPayment
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setInstallmentDownPayment(
                                                    Math.max(
                                                        0,
                                                        parseFloat(
                                                            e.target
                                                                .value
                                                        ) ||
                                                        0
                                                    )
                                                )
                                            }
                                            className="w-full border border-gray-300 rounded-md p-1 text-sm"
                                        />

                                    </div>

                                    <div>

                                        <label className="block text-xs font-medium text-gray-700">
                                            Months
                                        </label>

                                        <input
                                            type="number"
                                            min="1"
                                            value={
                                                installmentMonths
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setInstallmentMonths(
                                                    Math.max(
                                                        1,
                                                        parseInt(
                                                            e.target
                                                                .value
                                                        ) ||
                                                        1
                                                    )
                                                )
                                            }
                                            className="w-full border border-gray-300 rounded-md p-1 text-sm"
                                        />

                                    </div>

                                </div>

                                <div className="grid grid-cols-2 gap-2">

                                    <div>

                                        <label className="block text-xs font-medium text-gray-700">
                                            Interest (%)
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={
                                                installmentInterest
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setInstallmentInterest(
                                                    Math.max(
                                                        0,
                                                        parseFloat(
                                                            e.target
                                                                .value
                                                        ) ||
                                                        0
                                                    )
                                                )
                                            }
                                            className="w-full border border-gray-300 rounded-md p-1 text-sm"
                                        />

                                    </div>

                                    <div>

                                        <label className="block text-xs font-medium text-gray-700">
                                            First Due Date
                                        </label>

                                        <input
                                            type="date"
                                            value={
                                                installmentFirstDueDate
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setInstallmentFirstDueDate(
                                                    e.target
                                                        .value
                                                )
                                            }
                                            className="w-full border border-gray-300 rounded-md p-1 text-sm"
                                        />

                                    </div>

                                </div>

                                <div className="text-sm text-gray-600">

                                    Monthly Installment:

                                    <span className="font-semibold ml-1">
                                    LKR{' '}
                                        {installmentMonthlyAmount.toFixed(
                                            2
                                        )}
                                </span>

                                </div>

                                <div className="text-xs text-gray-500">

                                    Total Payable:

                                    <span className="font-medium ml-1">
                                    LKR{' '}
                                        {(
                                            installmentDownPayment +
                                            installmentMonthlyAmount *
                                            installmentMonths
                                        ).toFixed(
                                            2
                                        )}
                                </span>

                                </div>

                            </div>
                        )}

                    {/* CHECKOUT */}

                    <button
                        onClick={
                            handleCheckout
                        }
                        disabled={
                            loading ||
                            cart.length ===
                            0 ||
                            (
                                paymentMethod ===
                                'INSTALLMENT' &&
                                !customer
                            )
                        }
                        className={`w-full py-2 rounded-md mt-4 ${
                            needsApproval &&
                            !isAdmin
                                ? 'bg-yellow-600 hover:bg-yellow-700'
                                : 'bg-green-600 hover:bg-green-700'
                        } text-white disabled:opacity-50`}
                    >
                        {loading
                            ? 'Processing...'
                            : needsApproval &&
                            !isAdmin
                                ? '⚠️ Request Approval'
                                : 'Complete Sale'}
                    </button>

                </div>

            </div>

            {/* ==================================================
                CUSTOMER SELECTION MODAL
            ================================================== */}

            {showCustomerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

                    <div className="bg-white rounded-lg p-6 w-full max-w-md">

                        <h3 className="text-lg font-bold mb-4">
                            Select Customer
                        </h3>

                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            className="w-full border border-gray-300 rounded-md p-2 mb-4"
                            value={
                                customerSearch
                            }
                            onChange={(e) =>
                                setCustomerSearch(
                                    e.target.value
                                )
                            }
                        />

                        <div className="max-h-60 overflow-y-auto">

                            {customers
                                .filter(
                                    (c) =>
                                        c.name
                                            .toLowerCase()
                                            .includes(
                                                customerSearch.toLowerCase()
                                            ) ||
                                        c.phone.includes(
                                            customerSearch
                                        )
                                )
                                .map((c) => (
                                    <div
                                        key={c.id}
                                        className="p-2 hover:bg-gray-100 cursor-pointer border-b"
                                        onClick={() => {
                                            setCustomer(
                                                c
                                            );

                                            setShowCustomerModal(
                                                false
                                            );

                                            setCustomerSearch(
                                                ''
                                            );
                                        }}
                                    >
                                        {c.name}
                                        {' '}-
                                        {' '}
                                        {c.phone}
                                    </div>
                                ))}

                        </div>

                        <button
                            onClick={() =>
                                setShowCustomerModal(
                                    false
                                )
                            }
                            className="mt-4 w-full bg-gray-200 hover:bg-gray-300 py-2 rounded-md"
                        >
                            Cancel
                        </button>

                    </div>

                </div>
            )}

            {/* ==================================================
                ADD CUSTOMER MODAL
            ================================================== */}

            {showAddCustomerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

                    <div className="bg-white rounded-lg p-6 w-full max-w-md">

                        <h3 className="text-lg font-bold mb-4">
                            Add New Customer
                        </h3>

                        <div className="space-y-3">

                            <input
                                type="text"
                                placeholder="Name *"
                                className="w-full border border-gray-300 rounded-md p-2"
                                value={
                                    newCustomer.name
                                }
                                onChange={(e) =>
                                    setNewCustomer({
                                        ...newCustomer,
                                        name:
                                        e.target
                                            .value,
                                    })
                                }
                            />

                            <input
                                type="text"
                                placeholder="Phone *"
                                className="w-full border border-gray-300 rounded-md p-2"
                                value={
                                    newCustomer.phone
                                }
                                onChange={(e) =>
                                    setNewCustomer({
                                        ...newCustomer,
                                        phone:
                                        e.target
                                            .value,
                                    })
                                }
                            />

                            <input
                                type="email"
                                placeholder="Email (optional)"
                                className="w-full border border-gray-300 rounded-md p-2"
                                value={
                                    newCustomer.email
                                }
                                onChange={(e) =>
                                    setNewCustomer({
                                        ...newCustomer,
                                        email:
                                        e.target
                                            .value,
                                    })
                                }
                            />

                            <input
                                type="text"
                                placeholder="Address (optional)"
                                className="w-full border border-gray-300 rounded-md p-2"
                                value={
                                    newCustomer.address
                                }
                                onChange={(e) =>
                                    setNewCustomer({
                                        ...newCustomer,
                                        address:
                                        e.target
                                            .value,
                                    })
                                }
                            />

                        </div>

                        <div className="flex gap-2 mt-4">

                            <button
                                onClick={
                                    handleAddCustomer
                                }
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md"
                            >
                                Add Customer
                            </button>

                            <button
                                onClick={() =>
                                    setShowAddCustomerModal(
                                        false
                                    )
                                }
                                className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-md"
                            >
                                Cancel
                            </button>

                        </div>

                    </div>

                </div>
            )}

            {/* ==================================================
                REPAIR MODAL
            ================================================== */}

            {showRepairModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

                    <div className="bg-white rounded-lg p-6 w-full max-w-md">

                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-purple-600" />
                            Add Repair Charges
                        </h3>

                        <div className="space-y-3">

                            <div>

                                <label className="block text-sm font-medium text-gray-700">
                                    Description
                                </label>

                                <input
                                    type="text"
                                    placeholder="Repair description..."
                                    className="w-full border border-gray-300 rounded-md p-2"
                                    value={
                                        repairDescription
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setRepairDescription(
                                            e.target
                                                .value
                                        )
                                    }
                                />

                            </div>

                            <div>

                                <label className="block text-sm font-medium text-gray-700">
                                    Amount (LKR)
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    placeholder="0.00"
                                    className="w-full border border-gray-300 rounded-md p-2"
                                    value={
                                        repairCharges ||
                                        ''
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setRepairCharges(
                                            Math.max(
                                                0,
                                                parseFloat(
                                                    e.target
                                                        .value
                                                ) ||
                                                0
                                            )
                                        )
                                    }
                                />

                            </div>

                        </div>

                        <div className="flex gap-2 mt-4">

                            <button
                                onClick={() => {
                                    setShowRepairModal(
                                        false
                                    );

                                    if (
                                        repairCharges >
                                        0
                                    ) {
                                        toast.success(
                                            `Repair charges added: LKR ${repairCharges.toFixed(
                                                2
                                            )}`
                                        );
                                    }
                                }}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md"
                            >
                                Add to Bill
                            </button>

                            <button
                                onClick={() => {
                                    setShowRepairModal(
                                        false
                                    );

                                    setRepairCharges(
                                        0
                                    );

                                    setRepairDescription(
                                        ''
                                    );
                                }}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-md"
                            >
                                Cancel
                            </button>

                        </div>

                    </div>

                </div>
            )}

            {/* ==================================================
                APPROVAL MODAL
            ================================================== */}

            {showApprovalModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

                    <div className="bg-white rounded-lg p-6 w-full max-w-lg">

                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-600">

                            <AlertCircle className="w-5 h-5" />

                            Admin Approval Required

                        </h3>

                        <p className="text-sm text-gray-600 mb-4">
                            The following items require admin approval because the price is below the minimum:
                        </p>

                        <div className="space-y-2 max-h-60 overflow-y-auto">

                            {approvalItems.map(
                                (
                                    item,
                                    index
                                ) => (
                                    <div
                                        key={index}
                                        className="bg-red-50 p-3 rounded border border-red-200"
                                    >

                                        <p className="font-medium">
                                            {
                                                item
                                                    .product
                                                    .name
                                            }
                                        </p>

                                        <p className="text-sm text-gray-600">
                                            Unit Price:
                                            {' '}
                                            LKR{' '}
                                            {getItemPrice(
                                                item
                                            ).toFixed(
                                                2
                                            )}
                                        </p>

                                        <p className="text-sm text-gray-600">
                                            Minimum Price:
                                            {' '}
                                            LKR{' '}
                                            {Number(
                                                item
                                                    .product
                                                    .purchasePrice
                                            ).toFixed(
                                                2
                                            )}
                                        </p>

                                        {item.discountReason && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {
                                                    item.discountReason
                                                }
                                            </p>
                                        )}

                                    </div>
                                )
                            )}

                        </div>

                        <div className="flex gap-2 mt-4">

                            <button
                                onClick={() => {
                                    setShowApprovalModal(
                                        false
                                    );

                                    const approvedItems =
                                        approvalItems;

                                    setCart(
                                        (prev) =>
                                            prev.filter(
                                                (
                                                    item
                                                ) =>
                                                    !approvedItems.some(
                                                        (
                                                            approved
                                                        ) =>
                                                            approved
                                                                .product
                                                                .id ===
                                                            item
                                                                .product
                                                                .id
                                                    )
                                            )
                                    );

                                    setPriceInputs(
                                        (prev) => {
                                            const next = {
                                                ...prev,
                                            };

                                            approvedItems.forEach(
                                                (
                                                    item
                                                ) => {
                                                    delete next[
                                                        item
                                                            .product
                                                            .id
                                                        ];
                                                }
                                            );

                                            return next;
                                        }
                                    );

                                    toast.success(
                                        'Items requiring approval have been removed from cart'
                                    );
                                }}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 rounded-md"
                            >
                                Remove Items
                            </button>

                            <button
                                onClick={() => {
                                    setShowApprovalModal(
                                        false
                                    );

                                    toast.success(
                                        'Please contact admin for approval'
                                    );
                                }}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md"
                            >
                                Contact Admin
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}
