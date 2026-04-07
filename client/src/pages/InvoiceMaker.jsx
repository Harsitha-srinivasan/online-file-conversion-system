import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaFileInvoiceDollar, FaDownload, FaEye, FaArrowLeft, FaLock } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import PaymentModal from '../components/PaymentModal';

const InvoiceMaker = () => {
    const currencies = [
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'GBP', symbol: '£', name: 'British Pound' },
        { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
        { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
        { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
        { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    ];

    const [invoice, setInvoice] = useState({
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        vendor: { name: '', address: '', email: '', phone: '' },
        client: { name: '', address: '' },
        items: [{ description: '', quantity: 1, unitPrice: 0 }],
        tax: 0,
        discount: 0,
        currency: currencies[0]
    });

    const [generating, setGenerating] = useState(false);
    const [isPaid, setIsPaid] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // 'pdf' | 'word' | 'json' | 'view'

    const handleVendorChange = (e) => {
        setInvoice({ ...invoice, vendor: { ...invoice.vendor, [e.target.name]: e.target.value } });
    };

    const handleClientChange = (e) => {
        setInvoice({ ...invoice, client: { ...invoice.client, [e.target.name]: e.target.value } });
    };

    const handleItemChange = (index, e) => {
        const newItems = [...invoice.items];
        newItems[index][e.target.name] = e.target.name === 'description' ? e.target.value : parseFloat(e.target.value) || 0;
        setInvoice({ ...invoice, items: newItems });
    };

    const addItem = () => {
        setInvoice({ ...invoice, items: [...invoice.items, { description: '', quantity: 1, unitPrice: 0 }] });
    };

    const removeItem = (index) => {
        const newItems = invoice.items.filter((_, i) => i !== index);
        setInvoice({ ...invoice, items: newItems });
    };

    const calculateSubtotal = () => {
        return invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const taxAmount = (subtotal * invoice.tax) / 100;
        return subtotal + taxAmount - invoice.discount;
    };

    const generateInvoice = async (view = false) => {
        setGenerating(true);
        const toastId = toast.loading(view ? "Preparing Preview..." : "Generating PDF Invoice...");
        try {
            const format = view ? 'view' : 'pdf';
            const response = await api.post('/invoices/generate', { ...invoice, format }, { responseType: 'blob' });
            
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            
            if (view) {
                window.open(url, '_blank');
                toast.update(toastId, { render: "Preview opened!", type: "success", isLoading: false, autoClose: 3000 });
            } else {
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `invoice_${invoice.invoiceNumber}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                toast.update(toastId, { render: "PDF downloaded!", type: "success", isLoading: false, autoClose: 3000 });
            }
        } catch (err) {
            toast.update(toastId, { render: `Failed to ${view ? 'view' : 'generate'} PDF`, type: "error", isLoading: false, autoClose: 3000 });
        } finally {
            setGenerating(false);
        }
    };

    const downloadWord = async () => {
        setGenerating(true);
        const toastId = toast.loading("Generating Word Invoice...");
        try {
            const response = await api.post('/invoices/generate', { ...invoice, format: 'docx' }, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice_${invoice.invoiceNumber}.docx`);
            document.body.appendChild(link);
            link.click();
            toast.update(toastId, { render: "Word doc downloaded!", type: "success", isLoading: false, autoClose: 3000 });
        } catch (err) {
            toast.update(toastId, { render: "Failed to generate Word document", type: "error", isLoading: false, autoClose: 3000 });
        } finally {
            setGenerating(false);
        }
    };

    const downloadJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(invoice, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `invoice_${invoice.invoiceNumber}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        toast.success("Data exported as JSON");
    };

    // Gate: downloads require payment (only once per session), but view is free
    const requestDownload = (action) => {
        if (action === 'view') {
            executeAction(action);
            return;
        }
        if (isPaid) {
            executeAction(action);
        } else {
            setPendingAction(action);
            setShowPayment(true);
        }
    };

    const executeAction = (action) => {
        if (action === 'pdf') generateInvoice(false);
        else if (action === 'view') generateInvoice(true);
        else if (action === 'word') downloadWord();
        else if (action === 'json') downloadJSON();
    };

    const handlePaymentSuccess = () => {
        setIsPaid(true);
        toast.success('Payment successful! Your download is starting...');
        if (pendingAction) {
            setTimeout(() => executeAction(pendingAction), 500);
            setPendingAction(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 pb-20">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-8 pt-4"
            >
                <Link to="/dashboard" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-indigo-500 font-bold transition-colors mb-6 group">
                    <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tight mb-2">Invoice Maker</h1>
                        <p className="text-[var(--text-muted)] font-medium">Create professional invoices in seconds.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {isPaid ? (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-full text-xs font-black uppercase tracking-widest border border-green-500/20">
                                ✓ Unlocked
                            </span>
                        ) : (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 rounded-full text-xs font-black uppercase tracking-widest border border-amber-500/20">
                                <FaLock className="text-[10px]" /> Premium: $5.00 to Download
                            </div>
                        )}
                        <button
                            onClick={() => requestDownload('json')}
                            className="bg-transparent text-[var(--text-main)] px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 border border-[var(--border-color)] hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all"
                        >
                            <FaDownload /> Export JSON
                        </button>
                        <button
                            onClick={() => requestDownload('word')}
                            disabled={generating}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                        >
                            {generating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FaFileInvoiceDollar />}
                            Generate Word
                        </button>
                        <button
                            onClick={() => requestDownload('view')}
                            disabled={generating}
                            className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
                        >
                            {generating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FaEye />}
                            View PDF
                        </button>
                        <button
                            onClick={() => requestDownload('pdf')}
                            disabled={generating}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                        >
                            {generating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <FaFileInvoiceDollar />}
                            Generate PDF
                        </button>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="glass-card p-10 rounded-[48px] hover-lift border-indigo-500/5">
                        <h3 className="text-xl font-black mb-8 uppercase tracking-widest text-[#a8c0ff] hover-glow cursor-default">Invoice Metadata</h3>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-3 block px-1">Serial Number</label>
                                <input
                                    type="text"
                                    value={invoice.invoiceNumber}
                                    onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
                                    className="w-full bg-transparent border border-[var(--border-color)] rounded-2xl py-4 px-6 text-[var(--text-main)] outline-none focus:border-indigo-300 transition-all font-bold shadow-sm hover:border-indigo-400/30"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-3 block px-1">Creation Date</label>
                                <input
                                    type="date"
                                    value={invoice.date}
                                    onChange={(e) => setInvoice({ ...invoice, date: e.target.value })}
                                    className="w-full bg-transparent border border-[var(--border-color)] rounded-2xl py-4 px-6 text-[var(--text-main)] outline-none focus:border-indigo-300 transition-all font-bold shadow-sm hover:border-indigo-400/30"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-8 rounded-[32px]">
                        <h3 className="text-lg font-black mb-6 uppercase tracking-widest text-pink-500">Your Info (Vendor)</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                name="name"
                                placeholder="Business Name"
                                value={invoice.vendor.name}
                                onChange={handleVendorChange}
                                className="w-full bg-transparent border border-[var(--border-color)] rounded-xl py-3 px-4 text-[var(--text-main)] outline-none focus:border-indigo-500 transition-all font-bold hover:border-indigo-400/50"
                            />
                            <textarea
                                name="address"
                                placeholder="Address"
                                value={invoice.vendor.address}
                                onChange={handleVendorChange}
                                className="w-full bg-transparent border border-[var(--border-color)] rounded-xl py-3 px-4 text-[var(--text-main)] outline-none focus:border-indigo-500 transition-all font-bold h-24 hover:border-indigo-400/50"
                            ></textarea>
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    value={invoice.vendor.email}
                                    onChange={handleVendorChange}
                                    className="w-full bg-transparent border border-[var(--border-color)] rounded-xl py-3 px-4 text-[var(--text-main)] outline-none focus:border-indigo-500 transition-all font-bold hover:border-indigo-400/50"
                                />
                                <input
                                    type="text"
                                    name="phone"
                                    placeholder="Phone"
                                    value={invoice.vendor.phone}
                                    onChange={handleVendorChange}
                                    className="w-full bg-transparent border border-[var(--border-color)] rounded-xl py-3 px-4 text-[var(--text-main)] outline-none focus:border-indigo-500 transition-all font-bold hover:border-indigo-400/50"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-8 rounded-[32px]">
                        <h3 className="text-lg font-black mb-6 uppercase tracking-widest text-purple-500">Client Info</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                name="name"
                                placeholder="Client Name"
                                value={invoice.client.name}
                                onChange={handleClientChange}
                                className="w-full bg-transparent border border-[var(--border-color)] rounded-xl py-3 px-4 text-[var(--text-main)] outline-none focus:border-indigo-500 transition-all font-bold hover:border-indigo-400/50"
                            />
                            <textarea
                                name="address"
                                placeholder="Client Address"
                                value={invoice.client.address}
                                onChange={handleClientChange}
                                className="w-full bg-transparent border border-[var(--border-color)] rounded-xl py-3 px-4 text-[var(--text-main)] outline-none focus:border-indigo-500 transition-all font-bold hover:border-indigo-400/50 h-24"
                            ></textarea>
                        </div>
                    </div>

                    <div className="glass-card p-8 rounded-[32px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black uppercase tracking-widest text-green-500">Line Items</h3>
                            <button
                                onClick={addItem}
                                className="text-indigo-500 hover:text-indigo-600 flex items-center gap-2 font-bold text-sm"
                            >
                                <FaPlus /> Add Item
                            </button>
                        </div>
                        <div className="space-y-4">
                            <AnimatePresence>
                                {invoice.items.map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex flex-col md:flex-row gap-4 items-start pb-4 border-b border-[var(--border-color)] last:border-0"
                                    >
                                        <div className="flex-1 w-full">
                                            <input
                                                type="text"
                                                name="description"
                                                placeholder="Item description"
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, e)}
                                                className="w-full bg-transparent border border-[var(--border-color)] rounded-xl py-3 px-4 text-[var(--text-main)] outline-none focus:border-indigo-500 transition-all font-bold hover:border-indigo-400/50"
                                            />
                                        </div>
                                        <div className="w-full md:w-24">
                                            <input
                                                type="number"
                                                name="quantity"
                                                placeholder="Qty"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, e)}
                                                className="w-full bg-transparent border border-[var(--border-color)] rounded-xl py-3 px-4 text-[var(--text-main)] outline-none focus:border-indigo-500 transition-all font-bold hover:border-indigo-400/50"
                                            />
                                        </div>
                                        <div className="w-full md:w-32">
                                            <input
                                                type="number"
                                                name="unitPrice"
                                                placeholder={`Price (${invoice.currency.symbol})`}
                                                value={item.unitPrice}
                                                onChange={(e) => handleItemChange(index, e)}
                                                className="w-full bg-transparent border border-[var(--border-color)] rounded-xl py-3 px-4 text-[var(--text-main)] outline-none focus:border-indigo-500 transition-all font-bold hover:border-indigo-400/50"
                                            />
                                        </div>
                                        {invoice.items.length > 1 && (
                                            <button
                                                onClick={() => removeItem(index)}
                                                className="w-12 h-12 flex items-center justify-center text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                                            >
                                                <FaTrash />
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="lg:col-span-5">
                    <div className="sticky top-24 space-y-8">
                        <div className="glass-card p-12 rounded-[60px] border-indigo-500/10 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 dark:from-indigo-500/5 dark:to-purple-500/5 floating">
                            <h3 className="text-2xl font-black mb-10 text-[var(--text-main)] flex items-center gap-4 hover-glow cursor-default">
                                <FaEye className="text-indigo-400" /> Live Preview
                            </h3>

                            <div className="space-y-6 mb-10">
                                <div className="flex justify-between text-[var(--text-muted)] font-bold text-lg">
                                    <span>Base Value</span>
                                    <span>{invoice.currency.symbol}{calculateSubtotal().toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[var(--text-muted)] font-bold flex-1">Tax (%)</span>
                                    <input
                                        type="number"
                                        value={invoice.tax}
                                        onChange={(e) => setInvoice({ ...invoice, tax: parseFloat(e.target.value) || 0 })}
                                        className="w-20 bg-transparent border border-[var(--border-color)] rounded-lg py-1 px-2 text-right text-[var(--text-main)] outline-none focus:border-indigo-500 transition-all font-bold text-sm hover:border-indigo-400/50"
                                    />
                                    <span className="w-24 text-right font-bold text-[var(--text-main)]">{invoice.currency.symbol}{((calculateSubtotal() * invoice.tax) / 100).toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[var(--text-muted)] font-bold flex-1">Discount ({invoice.currency.symbol})</span>
                                    <input
                                        type="number"
                                        value={invoice.discount}
                                        onChange={(e) => setInvoice({ ...invoice, discount: parseFloat(e.target.value) || 0 })}
                                        className="w-20 bg-transparent border border-[var(--border-color)] rounded-lg py-1 px-2 text-right text-[var(--text-main)] outline-none focus:border-indigo-500 transition-all font-bold text-sm hover:border-indigo-400/50"
                                    />
                                    <span className="w-24 text-right font-bold text-[var(--text-main)]">-{invoice.currency.symbol}{invoice.discount.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-[var(--border-color)]">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-1">Total Amount</p>
                                        <p className="text-4xl font-black text-[var(--text-main)] tracking-tight">{invoice.currency.symbol}{calculateTotal().toFixed(2)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-1">Currency</p>
                                        <select
                                            value={invoice.currency.code}
                                            onChange={(e) => {
                                                const selected = currencies.find(c => c.code === e.target.value);
                                                setInvoice({ ...invoice, currency: selected });
                                            }}
                                            className="bg-white border border-indigo-300 rounded-lg py-1.5 px-3 text-sm font-black text-indigo-600 outline-none hover:border-indigo-400 focus:border-indigo-500 transition-all cursor-pointer shadow-sm"
                                        >
                                            {currencies.map(c => (
                                                <option key={c.code} value={c.code} className="bg-white text-gray-800">
                                                    {c.code} ({c.symbol})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-8 rounded-[32px] text-center border-dashed">
                            <p className="text-[var(--text-muted)] text-sm font-medium mb-2 italic">Tip: You can export your invoice data as JSON to import it later.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={showPayment}
                onClose={() => setShowPayment(false)}
                onSuccess={handlePaymentSuccess}
                fileId={null}
                fileName={`invoice_${invoice.invoiceNumber}`}
                price={5.00}
                featureName="Invoice Download"
            />
        </div>
    );
};

export default InvoiceMaker;