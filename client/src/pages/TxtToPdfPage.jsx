import { useState } from 'react';
import { FaFilePdf, FaSpinner, FaDownload, FaCheckCircle } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';

const TxtToPdfPage = () => {
    const [text, setText] = useState('');
    const [converting, setConverting] = useState(false);
    const [convertedUrl, setConvertedUrl] = useState(null);

    const handleConvert = async () => {
        if (!text.trim()) {
            toast.error('Please enter some text');
            return;
        }

        setConverting(true);
        setConvertedUrl(null);
        try {
            const res = await api.post('/files/txt-to-pdf', { text });
            setConvertedUrl(res.data.convertedFileUrl);
            toast.success('Conversion successful!');
        } catch (err) {
            toast.error('Conversion failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setConverting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">TXT → PDF Conversion</h1>
                <p className="text-slate-400">Enter your text below to generate a professional PDF document instantly.</p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-slate-800">
                <textarea
                    className="w-full h-80 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 outline-none focus:border-primary transition-colors resize-none mb-6"
                    placeholder="Type or paste your text here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />

                <div className="flex items-center justify-between">
                    <button
                        onClick={handleConvert}
                        disabled={converting || !text.trim()}
                        className="bg-primary hover:bg-indigo-600 px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {converting ? <FaSpinner className="animate-spin" /> : <FaFilePdf />}
                        {converting ? 'Generating PDF...' : 'Convert to PDF'}
                    </button>

                    {convertedUrl && (
                        <div className="flex items-center gap-4 animate-fade-in">
                            <div className="flex items-center gap-2 text-green-400">
                                <FaCheckCircle />
                                <span className="font-medium text-sm">PDF Ready!</span>
                            </div>
                            <a
                                href={`http://localhost:5000${convertedUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition border border-slate-700"
                            >
                                <FaDownload /> Download
                            </a>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                    <h3 className="font-bold text-primary mb-1">Fast & Secure</h3>
                    <p className="text-xs text-slate-400">Your text is processed instantly and converted to a high-quality PDF.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                    <h3 className="font-bold text-secondary mb-1">Clean Formatting</h3>
                    <p className="text-xs text-slate-400">Standard font and spacing are applied for a readable document.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                    <h3 className="font-bold text-green-400 mb-1">Instant Download</h3>
                    <p className="text-xs text-slate-400">No waiting in queues. Download your file as soon as it's generated.</p>
                </div>
            </div>
        </div>
    );
};

export default TxtToPdfPage;
