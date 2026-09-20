'use client'
import { Sale } from '@/types'

export default function PrintReceipt({ sale }: { sale: Sale }) {
    const handlePrint = () => {
        window.print()
    }

    return (
        <div>
            <button
                onClick={handlePrint}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
            >
                🖨️ Print Receipt
            </button>
            {/* Hidden receipt content that will be printed */}
            <div id="receipt" className="hidden print:block print:visible print:w-full print:max-w-sm print:mx-auto">
                <div className="p-4 font-mono text-sm">
                    <h2 className="text-center text-lg font-bold">📱 Phone Shop</h2>
                    <p className="text-center text-xs">123 Main St, City</p>
                    <p className="text-center text-xs">Tel: 077-1234567</p>
                    <hr className="my-2 border-dashed" />
                    <p><strong>Invoice:</strong> {sale.invoiceNo}</p>
                    <p><strong>Date:</strong> {new Date(sale.saleDate).toLocaleString()}</p>
                    <p><strong>Customer:</strong> {sale.customer?.name || 'Walk-in'}</p>
                    <hr className="my-2 border-dashed" />
                    <table className="w-full text-sm">
                        <thead>
                        <tr>
                            <th className="text-left">Item</th>
                            <th className="text-right">Qty</th>
                            <th className="text-right">Price</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sale.saleItems.map((item) => (
                            <tr key={item.id}>
                                <td className="py-1">{item.product?.name || 'Item'}</td>
                                <td className="text-right">{item.quantity}</td>
                                <td className="text-right">LKR {item.price.toFixed(2)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <hr className="my-2 border-dashed" />
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>LKR {sale.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>- LKR {sale.discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>LKR {sale.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>LKR {sale.grandTotal.toFixed(2)}</span>
                    </div>
                    <p className="text-center text-xs mt-4">Thank you for your purchase!</p>
                </div>
            </div>
        </div>
    )
}