import { useState, useEffect } from 'react';
import { FaHistory, FaDownload, FaFileAlt, FaSyncAlt } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';

const HistoryPage = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get('/history');
            setHistory(res.data.data);
        } catch (err) {
            toast.error('Failed to load history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Conversion History</h1>
                    <p className="text-slate-400">View and download your previous file conversions.</p>
                </div>
                <button
                    onClick={fetchHistory}
                    disabled={loading}
                    className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full transition text-slate-300"
                    title="Refresh History"
                >
                    <FaSyncAlt className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : history.length === 0 ? (
                <div className="glass-card py-20 rounded-2xl text-center">
                    <div className="text-5xl text-slate-700 mb-4 flex justify-center">
                        <FaHistory />
                    </div>
                    <h2 className="text-xl font-bold text-slate-400">No history found</h2>
                    <p className="text-slate-500">Your converted files will appear here once you start using the service.</p>
                </div>
            ) : (
                <div className="overflow-hidden glass-card rounded-2xl border border-slate-800">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">File Details</th>
                                <th className="px-6 py-4 font-semibold">Type</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {history.map((item) => (
                                <tr key={item._id} className="hover:bg-slate-900/30 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-800 p-2 rounded-lg text-primary text-xl">
                                                <FaFileAlt />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-200 truncate max-w-[250px]" title={item.originalFileName}>
                                                    {item.originalFileName}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                    {item.convertedFileName}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="bg-slate-800/80 px-2.5 py-1 rounded-full text-[10px] font-bold text-secondary border border-secondary/20 uppercase tracking-tighter">
                                            {item.conversionType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-sm text-slate-400">
                                            {new Date(item.date).toLocaleDateString()}
                                        </p>
                                        <p className="text-[10px] text-slate-500">
                                            {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <a
                                            href={`http://localhost:5000${item.downloadUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-primary px-4 py-2 rounded-lg text-xs font-bold transition-all border border-slate-700 hover:border-primary"
                                        >
                                            <FaDownload /> Download
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
