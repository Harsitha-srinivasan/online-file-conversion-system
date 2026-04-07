import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaHistory, FaDownload, FaFileAlt, FaFilePdf, FaFileWord, FaFileImage, FaClock, FaCalendarAlt, FaEdit, FaCheck, FaTimes, FaTrash } from 'react-icons/fa';
import api from '../services/api';

const HistoryPage = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editedName, setEditedName] = useState('');
    const [renaming, setRenaming] = useState(false);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/history');
            setHistory(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleRename = async (id) => {
        if (!editedName.trim()) return;
        setRenaming(id);
        try {
            await api.patch(`/history/${id}`, { newName: editedName });
            setHistory(history.map(item => item._id === id ? { ...item, originalFileName: editedName } : item));
            setEditingId(null);
        } catch (err) {
            console.error('Rename failed:', err);
            alert('Failed to rename file. Please try again.');
        } finally {
            setRenaming(false);
        }
    };

    const handlePayment = async (id) => {
        try {
            await api.post(`/history/${id}/pay`);
            setHistory(history.map(item => item._id === id ? { ...item, isPaid: true } : item));
        } catch (err) {
            console.error('Payment failed:', err);
            alert('Failed to process payment. Please try again.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this conversion from your history?')) return;
        try {
            await api.delete(`/history/${id}`);
            setHistory(history.filter(item => item._id !== id));
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete history item. Please try again.');
        }
    };

    const startEditing = (id, name) => {
        setEditingId(id);
        setEditedName(name);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditedName('');
    };

    const getFileIcon = (type) => {
        const t = type.toLowerCase();
        if (t.includes('pdf')) return <FaFilePdf className="text-red-500" />;
        if (t.includes('doc') || t.includes('word')) return <FaFileWord className="text-blue-500" />;
        if (t.includes('png') || t.includes('jpg') || t.includes('image')) return <FaFileImage className="text-pink-500" />;
        return <FaFileAlt className="text-indigo-500" />;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
            time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        };
    };

    return (
        <div className="max-w-5xl mx-auto px-4 pb-20">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 pt-8"
            >
                <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight text-[var(--text-main)]">Conversion History</h1>
                <p className="text-[var(--text-muted)] text-lg max-w-xl">Review and download all your past file conversions in one place.</p>
            </motion.div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-indigo-500 rounded-full animate-spin"></div>
                    <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-xs">Accessing History...</p>
                </div>
            ) : history.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-24 glass-card rounded-[40px] border-dashed border-2 flex flex-col items-center gap-6"
                >
                    <div className="w-24 h-24 bg-indigo-50/50 dark:bg-indigo-500/10 flex items-center justify-center rounded-full text-indigo-400 dark:text-indigo-300 text-4xl border border-indigo-100/50 dark:border-indigo-500/10">
                        <FaHistory />
                    </div>
                    <div>
                        <p className="text-xl font-black text-[var(--text-main)] mb-2">No History Yet</p>
                        <p className="text-[var(--text-muted)]">Your converted files will appear here.</p>
                    </div>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {history.map((item, index) => {
                        const { date, time } = formatDate(item.date);
                        return (
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="glass-card p-6 rounded-[24px] hover:border-indigo-500/30 transition-all duration-300 group"
                            >
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-5 w-full md:flex-1 min-w-0">
                                        <div className="w-14 h-14 bg-indigo-50/50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-indigo-100 dark:border-indigo-500/20 group-hover:scale-110 transition-transform">
                                            {getFileIcon(item.conversionType)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {editingId === item._id ? (
                                                <div className="flex items-center gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        value={editedName}
                                                        onChange={(e) => setEditedName(e.target.value)}
                                                        className="bg-white border border-indigo-500/50 rounded-lg px-3 py-1.5 text-sm font-bold text-[var(--text-main)] w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleRename(item._id);
                                                            if (e.key === 'Escape') cancelEditing();
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => handleRename(item._id)}
                                                        disabled={renaming === item._id}
                                                        className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                                                    >
                                                        {renaming === item._id ? (
                                                            <div className="w-4 h-4 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
                                                        ) : (
                                                            <FaCheck />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={cancelEditing}
                                                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-bold text-lg break-words whitespace-normal text-[var(--text-main)] max-w-[85%]">
                                                        {item.originalFileName}
                                                    </h4>
                                                    <button
                                                        onClick={() => startEditing(item._id, item.originalFileName)}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-md transition-all"
                                                        title="Rename"
                                                    >
                                                        <FaEdit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item._id)}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                                                        title="Delete"
                                                    >
                                                        <FaTrash size={14} />
                                                    </button>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/10">
                                                    {item.conversionType}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto shrink-0">
                                        <div className="flex items-center gap-6 text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">
                                            <div className="flex items-center gap-2">
                                                <FaCalendarAlt className="text-indigo-400" />
                                                {date}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <FaClock className="text-indigo-400" />
                                                {time}
                                            </div>
                                        </div>

                                        {item.conversionType === 'PDF to PPT' && !item.isPaid ? (
                                            <button
                                                onClick={() => handlePayment(item._id)}
                                                className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-green-500/20"
                                            >
                                                Pay $5.00 to Unlock
                                            </button>
                                        ) : (
                                            <a
                                                href={`http://localhost:5000/api/conversion/download/${item.convertedFileName || item._id}?token=${encodeURIComponent(localStorage.getItem('token') || '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full md:w-auto bg-indigo-50/50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-[var(--text-main)] px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-95 border border-indigo-100 dark:border-indigo-500/20 group/btn"
                                            >
                                                <FaDownload className="text-indigo-500 group-hover/btn:translate-y-0.5 transition-transform" /> Download
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
