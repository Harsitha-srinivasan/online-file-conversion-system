import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaTimes, FaCreditCard, FaLock, FaCheckCircle,
    FaShieldAlt, FaBolt, FaDownload, FaArrowRight
} from 'react-icons/fa';
import { SiVisa, SiMastercard } from 'react-icons/si';
import api from '../services/api';
import { toast } from 'react-toastify';

const PaymentModal = ({ isOpen, onClose, onSuccess, fileId, fileName, price = 5.00, featureName = 'Premium Download' }) => {
    const [step, setStep] = useState('confirm'); // 'confirm' | 'card' | 'processing' | 'done'
    const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
    const [errors, setErrors] = useState({});

    const formatCardNumber = (val) => {
        return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    };
    const formatExpiry = (val) => {
        const v = val.replace(/\D/g, '').slice(0, 4);
        return v.length >= 3 ? `${v.slice(0, 2)}/${v.slice(2)}` : v;
    };

    const validate = () => {
        const errs = {};
        if (card.number.replace(/\s/g, '').length < 16) errs.number = 'Enter a valid 16-digit card number';
        if (card.expiry.length < 5) errs.expiry = 'Enter a valid expiry (MM/YY)';
        if (card.cvv.length < 3) errs.cvv = 'Enter a valid CVV';
        if (!card.name.trim()) errs.name = 'Cardholder name is required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handlePay = async () => {
        if (!validate()) return;
        setStep('processing');
        try {
            // Simulate payment processing delay
            await new Promise(r => setTimeout(r, 2000));
            if (fileId) {
                await api.post(`/history/${fileId}/pay`);
            }
            setStep('done');
            setTimeout(() => {
                onSuccess();
                handleClose();
            }, 1800);
        } catch (err) {
            toast.error('Payment failed. Please try again.');
            setStep('card');
        }
    };

    const handleClose = () => {
        setStep('confirm');
        setCard({ number: '', expiry: '', cvv: '', name: '' });
        setErrors({});
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={step !== 'processing' ? handleClose : undefined}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative w-full max-w-md"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">

                            {/* Header */}
                            <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white">
                                <div className="absolute inset-0 opacity-20"
                                    style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}
                                />
                                {step !== 'processing' && step !== 'done' && (
                                    <button
                                        onClick={handleClose}
                                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                                    >
                                        <FaTimes className="text-sm" />
                                    </button>
                                )}
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 text-white/70 text-xs font-bold uppercase tracking-widest mb-3">
                                        <FaShieldAlt /> Secure Checkout
                                    </div>
                                    <h2 className="text-2xl font-black mb-1">{featureName}</h2>
                                    <p className="text-white/70 text-sm">{fileName}</p>
                                </div>
                                <div className="relative z-10 mt-6 flex items-end gap-2">
                                    <span className="text-5xl font-black">${price.toFixed(2)}</span>
                                    <span className="text-white/60 mb-2 text-sm">one-time</span>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-8">
                                <AnimatePresence mode="wait">
                                    {/* STEP: Confirm */}
                                    {step === 'confirm' && (
                                        <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                            <div className="space-y-4 mb-8">
                                                {[
                                                    { icon: <FaDownload className="text-indigo-500" />, text: 'Instant download after payment' },
                                                    { icon: <FaLock className="text-green-500" />, text: 'Secure, encrypted transaction' },
                                                    { icon: <FaBolt className="text-amber-500" />, text: 'No subscription — pay once' },
                                                ].map((item, i) => (
                                                    <div key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                                            {item.icon}
                                                        </div>
                                                        {item.text}
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setStep('card')}
                                                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95 transition-all"
                                            >
                                                <FaCreditCard /> Proceed to Payment <FaArrowRight />
                                            </button>
                                        </motion.div>
                                    )}

                                    {/* STEP: Card Details */}
                                    {step === 'card' && (
                                        <motion.div key="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="font-black text-slate-800 dark:text-white">Card Details</h3>
                                                <div className="flex gap-2 text-2xl text-slate-400">
                                                    <SiVisa /> <SiMastercard />
                                                </div>
                                            </div>
                                            <div className="space-y-4 mb-6">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Card Number</label>
                                                    <input
                                                        type="text"
                                                        placeholder="1234 5678 9012 3456"
                                                        value={card.number}
                                                        onChange={e => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                                                        className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl py-3 px-4 text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all font-bold text-sm ${errors.number ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                                                    />
                                                    {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number}</p>}
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Cardholder Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="John Doe"
                                                        value={card.name}
                                                        onChange={e => setCard({ ...card, name: e.target.value })}
                                                        className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl py-3 px-4 text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all font-bold text-sm ${errors.name ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                                                    />
                                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Expiry</label>
                                                        <input
                                                            type="text"
                                                            placeholder="MM/YY"
                                                            value={card.expiry}
                                                            onChange={e => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                                                            className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl py-3 px-4 text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all font-bold text-sm ${errors.expiry ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                                                        />
                                                        {errors.expiry && <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>}
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">CVV</label>
                                                        <input
                                                            type="password"
                                                            placeholder="•••"
                                                            maxLength={4}
                                                            value={card.cvv}
                                                            onChange={e => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                                            className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-xl py-3 px-4 text-slate-800 dark:text-white outline-none focus:border-indigo-500 transition-all font-bold text-sm ${errors.cvv ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}
                                                        />
                                                        {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handlePay}
                                                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-green-500/30 active:scale-95 transition-all"
                                            >
                                                <FaLock /> Pay ${price.toFixed(2)}
                                            </button>
                                            <button onClick={() => setStep('confirm')} className="w-full mt-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors font-bold">
                                                ← Back
                                            </button>
                                        </motion.div>
                                    )}

                                    {/* STEP: Processing */}
                                    {step === 'processing' && (
                                        <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
                                            <div className="relative w-20 h-20 mx-auto mb-6">
                                                <div className="w-20 h-20 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <FaCreditCard className="text-indigo-600 text-2xl animate-pulse" />
                                                </div>
                                            </div>
                                            <h3 className="font-black text-slate-800 dark:text-white text-xl mb-2">Processing Payment</h3>
                                            <p className="text-slate-500 text-sm">Please wait, do not close this window...</p>
                                        </motion.div>
                                    )}

                                    {/* STEP: Done */}
                                    {step === 'done' && (
                                        <motion.div key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', damping: 15 }}
                                                className="w-20 h-20 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center"
                                            >
                                                <FaCheckCircle className="text-green-500 text-4xl" />
                                            </motion.div>
                                            <h3 className="font-black text-slate-800 dark:text-white text-xl mb-2">Payment Successful!</h3>
                                            <p className="text-slate-500 text-sm">Your download is starting now...</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Security badge */}
                                {(step === 'confirm' || step === 'card') && (
                                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                                        <FaLock className="text-green-500" />
                                        <span>256-bit SSL encrypted • Your data is safe</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PaymentModal;
