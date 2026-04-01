import { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { FaUsers, FaFileAlt, FaHdd, FaShieldAlt } from 'react-icons/fa';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats');
                setStats(res.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="max-w-5xl mx-auto px-4 pb-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 pt-8"
            >
                <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-4 border border-red-500/20">
                    <FaShieldAlt /> Administrator Access
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight text-[var(--text-main)]">System Overview</h1>
                <p className="text-[var(--text-muted)] text-lg max-w-xl">Monitor your application performance, user activity, and storage usage.</p>
            </motion.div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-red-500 rounded-full animate-spin"></div>
                    <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-xs">Fetching System Stats...</p>
                </div>
            ) : stats ? (
                <div className="grid md:grid-cols-3 gap-8">
                    <StatsCard
                        icon={<FaUsers />}
                        title="Total Users"
                        value={stats.users}
                        color="text-indigo-500"
                        bg="bg-indigo-500/10"
                    />
                    <StatsCard
                        icon={<FaFileAlt />}
                        title="Total Files"
                        value={stats.files}
                        color="text-pink-500"
                        bg="bg-pink-500/10"
                    />
                    <StatsCard
                        icon={<FaHdd />}
                        title="Storage Used"
                        value={`${(stats.totalSizeBytes / 1024 / 1024).toFixed(2)} MB`}
                        color="text-green-500"
                        bg="bg-green-500/10"
                    />
                </div>
            ) : (
                <div className="glass-card p-12 rounded-[32px] text-center border-red-500/20 bg-red-500/5">
                    <p className="text-red-500 font-bold">Failed to load system statistics.</p>
                </div>
            )}
        </div>
    );
};

const StatsCard = ({ icon, title, value, color, bg }) => (
    <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ y: -5 }}
        className="glass-card p-10 rounded-[40px] flex flex-col items-center text-center transition-all duration-300"
    >
        <div className={`text-4xl ${color} ${bg} w-20 h-20 rounded-3xl flex items-center justify-center mb-8 shadow-inner`}>
            {icon}
        </div>
        <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2">{title}</h3>
            <p className="text-4xl font-black text-[var(--text-main)] tracking-tight">{value}</p>
        </div>
    </motion.div>
);

export default AdminDashboard;
