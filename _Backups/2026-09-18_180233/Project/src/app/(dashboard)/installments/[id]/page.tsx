'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InstallmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = parseInt(params.id as string);
    const [contract, setContract] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('CASH');

    const fetchContract = async () => {
        const res = await fetch(`/api/installments/${id}`);
        const data = await res.json();
        setContract(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchContract();
    }, [id]);

    const handleAddPayment = async () => {
        if (paymentAmount <= 0) {
            toast.error('Enter a valid amount');
            return;
        }
        if (paymentAmount > contract.remainingBalance) {
            toast.error('Amount exceeds remaining balance');
            return;
        }
        const res = await fetch(`/api/installments/${id}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: paymentAmount, paymentMethod, paidDate: new Date() }),
        });
        if (res.ok) {
            toast.success('Payment recorded successfully!');
            setPaymentAmount(0);
            fetchContract();
        } else {
            toast.error('Failed to record payment');
        }
    };

    if (loading) return <p className="text-center py-10">Loading...</p>;
    if (!contract) return <p className="text-center py-10">Contract not found</p>;

    return (
        <div className="max-w-3xl mx-auto">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
            >
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <h1 className="text-2xl font-bold mb-4">Installment Contract #{contract.id}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-semibold mb-2">Contract Details</h3>
                    <p><strong>Customer:</strong> {contract.customer?.name || 'N/A'}</p>
                    <p><strong>Phone:</strong> {contract.customer?.phone || 'N/A'}</p>
                    <p><strong>Total Amount:</strong> LKR {contract.totalAmount}</p>
                    <p><strong>Down Payment:</strong> LKR {contract.downPayment}</p>
                    <p><strong>Remaining Balance:</strong> LKR {contract.remainingBalance}</p>
                    <p><strong>Monthly Installment:</strong> LKR {contract.monthlyInstallment}</p>
                    <p><strong>Months:</strong> {contract.months}</p>
                    <p><strong>Interest Rate:</strong> {contract.interestRate}%</p>
                    <p><strong>Status:</strong>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                            contract.status === 'ACTIVE' ? 'bg-yellow-100 text-yellow-800' :
                                contract.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                    'bg-red-100 text-red-800'
                        }`}>
              {contract.status}
            </span>
                    </p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="font-semibold mb-2">Add Payment</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium">Amount (LKR)</label>
                            <input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                                className="w-full border border-gray-300 rounded-md p-2"
                                placeholder="Enter amount"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Payment Method</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2"
                            >
                                <option value="CASH">Cash</option>
                                <option value="CARD">Card</option>
                                <option value="QR">QR</option>
                            </select>
                        </div>
                        <button
                            onClick={handleAddPayment}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md"
                        >
                            Record Payment
                        </button>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                        Remaining: <span className="font-semibold">LKR {contract.remainingBalance}</span>
                    </div>
                </div>
            </div>

            <div className="mt-6 bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Payment History</h3>
                {contract.payments?.length === 0 ? (
                    <p className="text-gray-500">No payments recorded yet.</p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                        <tr>
                            <th className="text-left text-xs font-medium text-gray-500 py-2">Date</th>
                            <th className="text-left text-xs font-medium text-gray-500 py-2">Amount</th>
                            <th className="text-left text-xs font-medium text-gray-500 py-2">Method</th>
                            <th className="text-left text-xs font-medium text-gray-500 py-2">Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        {contract.payments.map((p: any) => (
                            <tr key={p.id}>
                                <td className="py-2">{format(new Date(p.paidDate), 'dd/MM/yyyy')}</td>
                                <td>LKR {p.amount}</td>
                                <td>{p.paymentMethod}</td>
                                <td>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                        p.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {p.status}
                    </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}