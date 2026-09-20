'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Printer, ArrowLeft } from 'lucide-react';
import JsBarcode from 'jsbarcode';

type ReceiptItem = {
    name: string;
    quantity: number;
    price: number;
    marketPrice?: number;
    discount?: number;
};

type Receipt = {
    invoiceNo: string;
    date: string;
    customer?: string;
    cashier?: string;
    items: ReceiptItem[];

    subtotal?: number;
    discountTotal?: number;
    tax?: number;
    total?: number;

    tendered?: number;
    balance?: number;

    // Split payment support
    paymentMethod?: string;
    cashAmount?: number;
    cardAmount?: number;
};

export default function ReceiptPage() {
    const router = useRouter();

    const [receipt, setReceipt] = useState<Receipt | null>(null);
    const [loading, setLoading] = useState(true);

    const barcodeRef = useRef<SVGSVGElement | null>(null);

    /* =========================================================
       LOAD RECEIPT
    ========================================================= */

    useEffect(() => {
        try {
            const data = sessionStorage.getItem('receipt');

            if (!data) {
                router.push('/dashboard');
                return;
            }

            const parsed: Receipt = JSON.parse(data);

            setReceipt(parsed);
        } catch (error) {
            console.error('Receipt loading error:', error);
            router.push('/dashboard');
        } finally {
            setLoading(false);
        }
    }, [router]);

    /* =========================================================
       BARCODE
    ========================================================= */

    useEffect(() => {
        if (!receipt || !barcodeRef.current) {
            return;
        }

        const value = String(receipt.invoiceNo || '000001')
            .replace(/[^A-Za-z0-9-]/g, '');

        try {
            JsBarcode(barcodeRef.current, value, {
                format: 'CODE128',
                width: 1.8,
                height: 45,
                displayValue: true,
                fontSize: 10,
                font: 'Arial',
                textMargin: 3,
                margin: 0,
                background: '#ffffff',
                lineColor: '#000000',
            });
        } catch (error) {
            console.error('Barcode generation error:', error);
        }
    }, [receipt]);

    /* =========================================================
       PRINT
    ========================================================= */

    const handlePrint = () => {
        window.print();
    };

    /* =========================================================
       NUMBER HELPER
    ========================================================= */

    const number = (value: unknown): number => {
        const n = Number(value);

        return Number.isFinite(n) ? n : 0;
    };

    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading receipt...
            </div>
        );
    }

    /* =========================================================
       NO RECEIPT
    ========================================================= */

    if (!receipt) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                No receipt found.
            </div>
        );
    }

    /* =========================================================
       BASIC VALUES
    ========================================================= */

    const invoiceNo =
        receipt.invoiceNo || 'INV-000001';

    const customer =
        receipt.customer || 'Walk-in Customer';

    const cashier =
        receipt.cashier || 'Admin';

    const items = Array.isArray(receipt.items)
        ? receipt.items
        : [];

    /* =========================================================
       MARKET PRICE

       If marketPrice > 0:
           use marketPrice

       If marketPrice = 0:
           use selling price

       Example:

       Market Price = 25
       Our Price    = 20

       Saving = 5
    ========================================================= */

    const getMarketPrice = (item: ReceiptItem): number => {
        const market = number(item.marketPrice);
        const selling = number(item.price);
        return market > 0 ? market : selling;
    };

    /* =========================================================
       MARKET TOTAL
    ========================================================= */

    const marketTotal = items.reduce(
        (sum, item) => {
            const marketPrice = getMarketPrice(item);
            const quantity = number(item.quantity);

            return sum + marketPrice * quantity;
        },
        0
    );

    /* =========================================================
       SELLING TOTAL
    ========================================================= */

    const sellingTotal = items.reduce(
        (sum, item) => {
            const sellingPrice = number(item.price);
            const quantity = number(item.quantity);

            return sum + sellingPrice * quantity;
        },
        0
    );

    /* =========================================================
       SAVING

       Market 160000
       Selling 150000

       Saving = 10000
    ========================================================= */

    const marketSaving = Math.max(
        0,
        marketTotal - sellingTotal
    );

    /* =========================================================
       ACTUAL DISCOUNT

       We use the actual price difference.

       Example:

       Market Price = 25
       Selling Price = 20

       You Saved = 5
    ========================================================= */

    const discount =
        marketSaving > 0
            ? marketSaving
            : number(receipt.discountTotal);

    /* =========================================================
       NET TOTAL

       Actual customer payment amount.
    ========================================================= */

    const netTotal =
        receipt.total !== undefined
            ? number(receipt.total)
            : sellingTotal;

    /* =========================================================
       PAYMENT
    ========================================================= */

    const tendered = number(receipt.tendered);

    const balance =
        receipt.balance !== undefined
            ? number(receipt.balance)
            : Math.max(
                0,
                tendered - netTotal
            );

    const paymentMethod =
        String(receipt.paymentMethod || '')
            .toUpperCase();

    const cashAmount =
        number(receipt.cashAmount);

    const cardAmount =
        number(receipt.cardAmount);

    /* =========================================================
       DATE
    ========================================================= */

    const receiptDate =
        receipt.date ||
        new Date().toLocaleString();

    /* =========================================================
       RETURN
    ========================================================= */

    return (
        <>
            <div className="receipt-page">

                {/* =================================================
                    SCREEN BUTTONS
                ================================================= */}

                <div className="no-print receipt-buttons">

                    <button
                        type="button"
                        onClick={() =>
                            router.push('/dashboard')
                        }
                        className="back-button"
                    >
                        <ArrowLeft size={18} />
                        Dashboard
                    </button>

                    <button
                        type="button"
                        onClick={handlePrint}
                        className="print-button"
                    >
                        <Printer size={18} />
                        Print Receipt
                    </button>

                </div>

                {/* =================================================
                    RECEIPT
                ================================================= */}

                <div
                    id="print-area"
                    className="receipt"
                >

                    {/* =================================================
                        SHOP HEADER
                    ================================================= */}

                    <div className="shop-header">

                        <img
                            src="/image.png"
                            alt="AB"
                            className="shop-logo"
                            onError={(event) => {
                                event.currentTarget.style.display =
                                    'none';
                            }}
                        />

                        <h1>
                            DIGITAL MART
                        </h1>

                        <div className="telephone">
                            Tel: 077 3800 440 / 077 3800 460
                        </div>

                        <div className="address">
                            New shopping complex,
                            Gallinda, Thalgaswala
                        </div>

                    </div>

                    <div className="line" />

                    {/* =================================================
                        INVOICE INFORMATION
                    ================================================= */}

                    <div className="invoice-information">

                        <div className="invoice-line">

                            <span className="invoice-number">
                                Invoice No : {invoiceNo}
                            </span>



                        </div>
                        <span className="invoice-date">
                                {receiptDate}
                            </span>
                        <div>
                            Cashier : {cashier}
                        </div>

                        <div>
                            Customer : {customer}
                        </div>

                    </div>

                    <div className="line" />

                    {/* =================================================
                        TABLE HEADER
                    ================================================= */}

                    <div className="product-header">

                        <div>
                            PRODUCT
                        </div>

                        <div className="center">
                            <span>MARKET PRICE</span>
                        </div>

                        <div className="center">
                            <span>OUR PRICE</span>
                        </div>

                        <div className="right">
                            AMOUNT
                        </div>

                    </div>

                    {/* =================================================
                        PRODUCTS
                    ================================================= */}

                    <div className="products">

                        {items.map(
                            (item, index) => {

                                const quantity =
                                    number(
                                        item.quantity
                                    );

                                const marketPrice =
                                    getMarketPrice(item);

                                const ourPrice =
                                    number(item.price);

                                const amount =
                                    ourPrice *
                                    quantity;

                                return (
                                    <div
                                        key={`${item.name}-${index}`}
                                        className="product-row"
                                    >

                                        <div className="product-name">
                                            {item.name}
                                        </div>

                                        <div className="price-row">

                                            <div>
                                                {quantity}
                                            </div>

                                            <div className="center">
                                                {marketPrice.toFixed(2)}
                                            </div>

                                            <div className="center">
                                                {ourPrice.toFixed(2)}
                                            </div>

                                            <div className="right">
                                                {amount.toFixed(2)}
                                            </div>

                                        </div>

                                    </div>
                                );
                            }
                        )}

                    </div>

                    {/* =================================================
                        TOTALS
                    ================================================= */}

                    <div className="totals">

                        {/* NET TOTAL */}
                        <div className="total-line">
                            <span>Net Total</span>

                            <strong className="grand-total">
                                {netTotal.toFixed(2)}
                            </strong>
                        </div>


                        {/* DISCOUNT */}
                        {discount > 0 && (
                            <div className="total-line">
                                <span>Discount</span>

                                <span>
                {discount.toFixed(2)}
            </span>
                            </div>
                        )}


                        {/* CASH */}
                        {cashAmount > 0 && (
                            <div className="total-line">
                                <span>Cash</span>

                                <span>
                {cashAmount.toFixed(2)}
            </span>
                            </div>
                        )}


                        {/* CARD */}
                        {cardAmount > 0 && (
                            <div className="total-line">
                                <span>Card</span>

                                <span>
                {cardAmount.toFixed(2)}
            </span>
                            </div>
                        )}


                        {/* TENDERED */}
                        <div className="total-line">
                            <span>Tendered</span>

                            <span>
            {tendered.toFixed(2)}
        </span>
                        </div>


                        {/* BALANCE */}
                        <div className="total-line">
                            <span>Balance</span>

                            <span>
            {balance.toFixed(2)}
        </span>
                        </div>

                    </div>
                    {/* =================================================
                        SAVED
                    ================================================= */}

                    <div className="saved">
                        You Saved : Rs {discount.toFixed(2)}
                    </div>

                    {/* =================================================
                        BARCODE
                    ================================================= */}

                    <div className="barcode-section">

                        <svg
                            ref={barcodeRef}
                            className="barcode"
                        />

                    </div>

                    {/* =================================================
                        FOOTER
                    ================================================= */}

                    <div className="footer">
                        Cloudnex Soft Solution :
                        071 3343 902 / 071 4343 902
                    </div>

                </div>
            </div>

            {/* =====================================================
                CSS

                IMPORTANT:
                This uses a normal CSS string and avoids the
                problematic multiline syntax from the old version.
            ====================================================== */}

            <style jsx global>{`
                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                }

                .receipt-page {
                    min-height: 100vh;
                    background: #f1f5f9;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .receipt-buttons {
                    width: 100%;
                    max-width: 520px;
                    display: flex;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .back-button,
                .print-button {
                    border: none;
                    border-radius: 8px;
                    padding: 12px 18px;
                    font-size: 15px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .back-button {
                    background: white;
                    color: #111827;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                }

                .print-button {
                    margin-left: auto;
                    background: #2563eb;
                    color: white;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                }

                .receipt {
                    width: 100%;
                    max-width: 520px;
                    background: white;
                    color: black;
                    padding: 24px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
                    font-family: Arial, Helvetica, sans-serif;
                }

                .shop-header {
                    text-align: center;
                }

                .shop-logo {
                    width: 100px;
                    max-height: 65px;
                    object-fit: contain;
                    margin: 0 auto 8px auto;
                    display: block;
                }

                .shop-header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 900;
                    letter-spacing: 6px;
                    line-height: 1;
                }

                .telephone {
                    margin-top: 8px;
                    font-size: 15px;
                    font-weight: 600;
                }

                .address {
                    margin-top: 3px;
                    font-size: 14px;
                }

                .line {
                    border-top: 1px solid black;
                    margin: 16px 0;
                }

                .invoice-information {
                    font-size: 14px;
                    line-height: 1.7;
                }

                .invoice-line {
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 8px;
                    white-space: nowrap;
                }

                .invoice-number {
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .invoice-date {
                    flex-shrink: 0;
                    white-space: nowrap;
                }

                .product-header {
                    width: 100%;
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 1fr;
                    gap: 4px;
                    align-items: center;
                    background: black;
                    color: white;
                    font-weight: bold;
                    font-size: 11px;
                    padding: 9px 5px;
                }

                .product-header .center {
                    text-align: center;
                    line-height: 1.05;
                }

                .product-header .center span {
                    display: block;
                }

                .product-header .right {
                    text-align: right;
                }

                .product-row {
                    width: 100%;
                    padding: 12px 0;
                    border-bottom: 1px dotted #999;
                }

                .product-name {
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 8px;
                    overflow-wrap: anywhere;
                }

                .price-row {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 1fr;
                    gap: 4px;
                    align-items: center;
                    font-size: 13px;
                }

                .center {
                    text-align: center;
                }

                .right {
                    text-align: right;
                }

                .totals {
                    margin-top: 16px;
                    font-size: 15px;
                }

                .total-line {
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    min-height: 24px;
                }

                .grand-total {
                    font-size: 23px;
                    font-weight: 900;
                }

                .saved {
                    border-top: 1px dotted #777;
                    margin-top: 14px;
                    padding-top: 14px;
                    text-align: center;
                    font-size: 19px;
                    font-weight: 900;
                }

                .barcode-section {
                    width: 100%;
                    margin-top: 14px;
                    padding-top: 10px;
                    border-top: 1px dotted #777;
                    text-align: center;
                }

                .barcode {
                    width: 64mm;
                    max-width: 100%;
                    height: auto;
                    display: block;
                    margin: 0 auto;
                }

                .footer {
                    text-align: center;
                    font-size: 11px;
                    margin-top: 8px;
                }

                @media print {

                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }

                    html,
                    body {
                        width: 80mm !important;
                        min-width: 80mm !important;
                        max-width: 80mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }

                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    body * {
                        visibility: hidden !important;
                    }

                    #print-area,
                    #print-area * {
                        visibility: visible !important;
                    }

                    .no-print {
                        display: none !important;
                    }

                    #print-area {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 80mm !important;
                        min-width: 80mm !important;
                        max-width: 80mm !important;
                        margin: 0 !important;
                        padding: 4mm !important;
                        background: white !important;
                        box-shadow: none !important;
                        border: none !important;
                    }

                    .shop-logo {
                        width: 22mm !important;
                        max-width: 22mm !important;
                        max-height: 17mm !important;
                    }

                    .shop-header h1 {
                        font-size: 7mm !important;
                        letter-spacing: 1.5mm !important;
                    }

                    .telephone {
                        font-size: 3.4mm !important;
                    }

                    .address {
                        font-size: 3.2mm !important;
                    }

                    .invoice-information {
                        font-size: 3.4mm !important;
                    }

                    .invoice-line {
                        font-size: 3.4mm !important;
                        white-space: nowrap !important;
                    }

                    .product-header {
                        font-size: 2.8mm !important;
                        grid-template-columns: 2fr 1fr 1fr 1fr !important;
                        padding-top: 2mm !important;
                        padding-bottom: 2mm !important;
                        background: black !important;
                        color: white !important;
                    }

                    .product-row {
                        padding-top: 2.5mm !important;
                        padding-bottom: 2.5mm !important;
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }

                    .product-name {
                        font-size: 3.6mm !important;
                    }

                    .price-row {
                        font-size: 3.3mm !important;
                        grid-template-columns: 2fr 1fr 1fr 1fr !important;
                    }

                    .grand-total {
                        font-size: 5.5mm !important;
                    }

                    .saved {
                        font-size: 4.7mm !important;
                    }

                    .barcode-section {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }

                    .barcode {
                        width: 64mm !important;
                        max-width: 64mm !important;
                    }

                    .footer {
                        font-size: 2.8mm !important;
                    }
                }
            `}</style>
        </>
    );
}