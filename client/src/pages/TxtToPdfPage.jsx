import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaFilePdf, FaExchangeAlt, FaSpinner, FaDownload, FaKeyboard, FaTimes } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';

const TxtToPdfPage = () => {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [convertedFileUrl, setConvertedFileUrl] = useState(null);

    const handleConvert = async (e) => {
        e.preventDefault();
        if (!text.trim()) {
            toast.error('Please enter some text');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/files/txt-to-pdf', { text });
            setConvertedFileUrl(res.data.convertedFileUrl);
            toast.success('PDF generated successfully!');
        } catch (err) {
            toast.error('Failed to generate PDF: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setText('');
        setConvertedFileUrl(null);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 pb-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 pt-8"
            >
                <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight text-[var(--text-main)]">Quick TXT → PDF</h1>
                <p className="text-[var(--text-muted)] text-lg max-w-xl">Type or paste your text directly to generate a high-quality PDF document instantly.</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-[40px] overflow-hidden"
            >
                <div className="p-8 border-b border-[var(--border-color)] flex items-center justify-between bg-slate-50 dark:bg-slate-800/20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-pink-500/10 text-pink-500 rounded-2xl flex items-center justify-center text-xl">
                            <FaKeyboard />
                        </div>
                        <span className="font-extrabold uppercase tracking-widest text-xs text-[var(--text-main)]">Document Content</span>
                    </div>
                    {text && (
                        <button
                            onClick={handleClear}
                            className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                        >
                            <FaTimes /> Clear Content
                        </button>
                    )}
                </div>

                <div className="p-8">
                    <textarea
                        className="w-full h-80 bg-transparent border border-[var(--border-color)] rounded-3xl p-8 text-[var(--text-main)] outline-none focus:border-indigo-500 transition-all font-medium leading-relaxed resize-none text-lg hover:border-indigo-400/30"
                        placeholder="Start typing your content here..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    ></textarea>

                    <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3 text-[var(--text-muted)]">
                            <span className="text-sm font-bold bg-transparent border border-[var(--border-color)] px-3 py-1 rounded-lg">
                                {text.length} Characters
                            </span>
                            <span className="text-sm font-bold bg-transparent border border-[var(--border-color)] px-3 py-1 rounded-lg">
                                {text.split(/\s+/).filter(Boolean).length} Words
                            </span>
                        </div>

                        {!convertedFileUrl ? (
                            <button
                                onClick={handleConvert}
                                disabled={loading || !text.trim()}
                                className="w-full md:w-auto btn-primary !py-4 min-w-[250px] flex items-center justify-center gap-3"
                            >
                                {loading ? <FaSpinner className="animate-spin text-xl" /> : <FaFilePdf className="text-lg" />}
                                {loading ? 'Generating...' : 'Generate PDF'}
                            </button>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                <a
                                    href={`http://localhost:5000${convertedFileUrl.startsWith('/converted') ? `/api/conversion/download/${convertedFileUrl.split('/').pop()}` : convertedFileUrl}?token=${encodeURIComponent(localStorage.getItem('token') || '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-green-500 hover:bg-green-600 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-xl shadow-green-500/20 active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <FaDownload className="animate-bounce" /> Download PDF
                                </a>
                                <button
                                    onClick={() => setConvertedFileUrl(null)}
                                    className="btn-secondary !py-4"
                                >
                                    New Document
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default TxtToPdfPage;
